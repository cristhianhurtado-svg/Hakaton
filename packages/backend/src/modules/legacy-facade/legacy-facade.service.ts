import axios from 'axios';
import { config } from '../../config';
import { CircuitBreaker, CircuitBreakerOpenError } from '../../lib/circuit-breaker';
import { GatewayTimeoutError, ServiceUnavailableError } from '../../lib/errors';
import { logger } from '../../lib/logger';

/** Circuit breakers per SOAP service — Req 5.4 */
const circuitBreakers = new Map<string, CircuitBreaker>();

function getCircuitBreaker(serviceName: string): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker({ name: serviceName }));
  }
  return circuitBreakers.get(serviceName)!;
}

/**
 * Legacy Facade — Req 5
 * SOAP/XML to REST/JSON bidirectional transformation.
 */
export const legacyFacadeService = {
  /** Transform and forward request — Req 5.2 */
  async forwardRequest(
    servicePath: string,
    method: string,
    body: unknown,
    correlationId: string
  ) {
    const serviceName = servicePath.split('/')[1] || 'default';
    const cb = getCircuitBreaker(serviceName);

    try {
      return await cb.execute(async () => {
        // Transform JSON to SOAP/XML — Req 5.2
        const soapEnvelope = jsonToSoapXml(body as Record<string, unknown>, serviceName);

        const response = await axios({
          method: 'POST',
          url: `${config.legacy.baseUrl}/${servicePath}`,
          data: soapEnvelope,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': `urn:${serviceName}`,
            'X-Correlation-ID': correlationId,
          },
          timeout: config.legacy.timeout,
        });

        // Transform SOAP/XML response to JSON — Req 5.2
        const jsonResponse = soapXmlToJson(response.data);
        return jsonResponse;
      });
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        throw new ServiceUnavailableError(serviceName, error.retryAfter);
      }

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new GatewayTimeoutError(serviceName);
        }

        // Map SOAP faults to HTTP status codes — Req 5.3
        const status = mapSoapFaultToHttpStatus(error.response?.data);
        const detail = extractSoapFaultMessage(error.response?.data);

        logger.error('Legacy service error', {
          serviceName,
          correlationId,
          status,
          detail,
        });

        return {
          error: true,
          status,
          detail,
        };
      }

      throw error;
    }
  },
};

/** Convert JSON to SOAP/XML envelope — Req 5.2 */
function jsonToSoapXml(data: Record<string, unknown> | null, operation: string): string {
  const body = data ? objectToXml(data) : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:ns="urn:segurosbolivar:${operation}">
  <soap:Header/>
  <soap:Body>
    <ns:${operation}Request>
      ${body}
    </ns:${operation}Request>
  </soap:Body>
</soap:Envelope>`;
}

/** Convert object to XML elements */
function objectToXml(obj: Record<string, unknown>, indent = '      '): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'object' && !Array.isArray(value)) {
        return `${indent}<ns:${key}>\n${objectToXml(value as Record<string, unknown>, indent + '  ')}\n${indent}</ns:${key}>`;
      }
      return `${indent}<ns:${key}>${escapeXml(String(value))}</ns:${key}>`;
    })
    .filter(Boolean)
    .join('\n');
}

/** Parse SOAP/XML response to JSON — Req 5.2 */
function soapXmlToJson(xml: string): Record<string, unknown> {
  // Simplified XML to JSON parser for SOAP responses
  const bodyMatch = xml.match(/<soap:Body[^>]*>([\s\S]*?)<\/soap:Body>/i);
  if (!bodyMatch) return { rawResponse: xml };

  const bodyContent = bodyMatch[1].trim();
  return parseXmlToObject(bodyContent);
}

/** Simple XML to object parser */
function parseXmlToObject(xml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const tagRegex = /<([^\/\s>]+)[^>]*>([^<]*)<\/\1>/g;
  let match;

  while ((match = tagRegex.exec(xml)) !== null) {
    const key = match[1].replace(/^[^:]+:/, ''); // Remove namespace prefix
    const value = match[2].trim();
    result[key] = value;
  }

  return result;
}

/** Map SOAP fault codes to HTTP status — Req 5.3 */
function mapSoapFaultToHttpStatus(responseData: string | undefined): number {
  if (!responseData) return 500;
  if (responseData.includes('Client')) return 400;
  if (responseData.includes('MustUnderstand')) return 400;
  return 500;
}

/** Extract fault message from SOAP response */
function extractSoapFaultMessage(responseData: string | undefined): string {
  if (!responseData) return 'Error desconocido del servicio legacy';
  const faultMatch = responseData.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
  return faultMatch ? faultMatch[1] : 'Error del servicio interno';
}

/** Escape special XML characters */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
