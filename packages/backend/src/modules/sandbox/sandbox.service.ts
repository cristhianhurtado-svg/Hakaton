import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../lib/logger';

/**
 * Sandbox Engine — Req 3
 * Processes requests with fictional data, 100% PII masking.
 */
export const sandboxService = {
  /** Process a sandbox request — Req 3.1, 3.2, 3.4 */
  async processRequest(
    partnerId: string,
    method: string,
    path: string,
    body: unknown,
    correlationId: string
  ) {
    const startTime = Date.now();

    // Generate fictional response based on the endpoint
    const response = generateFictionalResponse(path, method, body);

    const responseTime = Date.now() - startTime;

    logger.info('Sandbox request processed', {
      partnerId,
      method,
      path,
      correlationId,
      responseTime,
    });

    return {
      data: response,
      metadata: {
        correlationId,
        environment: 'sandbox',
        responseTimeMs: responseTime,
        dataDisclaimer: 'Todos los datos son ficticios y no representan información real.',
      },
    };
  },

  /** Get sandbox logs for a partner — Req 3.3 */
  async getLogs(partnerId: string, page: number, pageSize: number) {
    // In production, this would query from the audit_logs table
    return {
      data: [],
      pagination: { page, pageSize, totalItems: 0, totalPages: 0 },
    };
  },
};

/** Generate fictional data with PII masking — Req 3.2 */
function generateFictionalResponse(path: string, method: string, body: unknown): Record<string, unknown> {
  // Base fictional response
  const baseResponse: Record<string, unknown> = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    status: 'success',
  };

  // Route-specific fictional data
  if (path.includes('cotizacion') || path.includes('quote')) {
    return {
      ...baseResponse,
      quoteId: `QT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      product: 'Seguro de Vida',
      premium: Math.floor(Math.random() * 500000) + 50000,
      currency: 'COP',
      coverage: Math.floor(Math.random() * 100000000) + 10000000,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      insured: {
        name: 'Juan Pérez Ficticio',
        documentType: 'CC',
        documentNumber: '***masked***',
        email: 'j***@example.com',
        phone: '***-***-****',
      },
    };
  }

  if (path.includes('emision') || path.includes('policy')) {
    return {
      ...baseResponse,
      policyNumber: `POL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      product: 'Seguro de Hogar',
      status: 'emitida',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      holder: {
        name: 'María García Ficticia',
        documentNumber: '***masked***',
      },
    };
  }

  if (path.includes('siniestro') || path.includes('claim')) {
    return {
      ...baseResponse,
      claimId: `CLM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      policyNumber: 'POL-XXXXXXXX',
      type: 'Daño material',
      status: 'en_proceso',
      reportDate: new Date().toISOString(),
      estimatedAmount: Math.floor(Math.random() * 10000000) + 1000000,
      currency: 'COP',
    };
  }

  return {
    ...baseResponse,
    message: 'Respuesta de sandbox con datos ficticios',
    data: maskPII(body as Record<string, unknown>),
  };
}

/** Mask PII in request/response data — Req 3.2 */
function maskPII(data: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};

  const sensitiveFields = [
    'documentNumber', 'cedula', 'nit', 'phone', 'telefono',
    'email', 'correo', 'address', 'direccion', 'accountNumber',
    'creditCard', 'tarjeta', 'ssn', 'healthData',
  ];

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      masked[key] = '***masked***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskPII(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}
