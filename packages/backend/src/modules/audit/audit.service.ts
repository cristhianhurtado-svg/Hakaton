import { query } from '../../db/pool';
import { AUDIT } from '@conecta2/shared';
import type { AuditReportRequest } from '@conecta2/shared';
import { logger } from '../../lib/logger';
import { getMockTable } from '../../db/mock-pool';
import { config } from '../../config';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

/**
 * Audit Engine — Req 16
 * API consumption recording, report generation, anomaly detection.
 */
export const auditService = {
  /** Record an API call — Req 16.1 */
  async recordApiCall(entry: {
    partnerId: string;
    applicationId: string;
    apiEndpoint: string;
    httpMethod: string;
    responseStatus: number;
    correlationId: string;
    responseTimeMs: number;
    requestMetadata?: Record<string, unknown>;
  }) {
    await query(
      `INSERT INTO audit.audit_logs (partner_id, application_id, api_endpoint, http_method, response_status, correlation_id, response_time_ms, request_metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        entry.partnerId,
        entry.applicationId,
        entry.apiEndpoint,
        entry.httpMethod,
        entry.responseStatus,
        entry.correlationId,
        entry.responseTimeMs,
        entry.requestMetadata ? JSON.stringify(entry.requestMetadata) : null,
      ]
    );
  },

  /** Generate audit report — Req 16.2, 16.3 */
  async generateReport(input: AuditReportRequest) {
    if (USE_MOCK) {
      const logs = getMockTable('audit.audit_logs');
      if (input.format === 'csv') {
        return { format: 'csv', data: convertToCsv(logs), rowCount: logs.length };
      }
      return { format: 'json', data: logs, rowCount: logs.length };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (input.partnerId) {
      conditions.push(`partner_id = $${idx++}`);
      params.push(input.partnerId);
    }
    conditions.push(`created_at >= $${idx++}`);
    params.push(input.startDate);
    conditions.push(`created_at <= $${idx++}`);
    params.push(input.endDate);

    const whereClause = conditions.join(' AND ');

    const rows = await query(
      `SELECT * FROM audit.audit_logs WHERE ${whereClause} ORDER BY created_at DESC LIMIT 10000`,
      params
    );

    if (input.format === 'csv') {
      return { format: 'csv', data: convertToCsv(rows as Record<string, unknown>[]), rowCount: rows.length };
    }
    return { format: 'json', data: rows, rowCount: rows.length };
  },

  /** Get real-time dashboard — Req 16.5 */
  async getDashboard() {
    if (USE_MOCK) {
      return computeMockAuditDashboard();
    }

    const summary = await query<Record<string, unknown>>(
      `SELECT
         COUNT(*) as total_calls,
         COUNT(DISTINCT partner_id) as unique_partners,
         AVG(response_time_ms) as avg_response_time,
         COUNT(*) FILTER (WHERE response_status >= 400)::float / NULLIF(COUNT(*), 0) * 100 as error_rate
       FROM audit.audit_logs
       WHERE created_at >= NOW() - INTERVAL '24 hours'`
    );

    const topEndpoints = await query(
      `SELECT api_endpoint as endpoint, COUNT(*) as call_count, AVG(response_time_ms) as avg_latency
       FROM audit.audit_logs
       WHERE created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY api_endpoint ORDER BY call_count DESC LIMIT 10`
    );

    const topPartners = await query(
      `SELECT al.partner_id, p.company_name, COUNT(*) as call_count
       FROM audit.audit_logs al
       LEFT JOIN portal.partners p ON p.id = al.partner_id
       WHERE al.created_at >= NOW() - INTERVAL '24 hours'
       GROUP BY al.partner_id, p.company_name ORDER BY call_count DESC LIMIT 10`
    );

    const row = summary[0] || {};
    return {
      totalCalls: Number(row.total_calls) || 0,
      uniquePartners: Number(row.unique_partners) || 0,
      avgResponseTime: Number(row.avg_response_time) || 0,
      errorRate: Number(row.error_rate) || 0,
      topEndpoints,
      topPartners,
    };
  },

  /** Detect anomalies — Req 16.6 */
  async getAnomalies() {
    if (USE_MOCK) {
      return [];
    }

    const anomalies = await query(
      `WITH daily_avg AS (
         SELECT partner_id, AVG(daily_count) as avg_daily
         FROM (
           SELECT partner_id, DATE(created_at) as day, COUNT(*) as daily_count
           FROM audit.audit_logs
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY partner_id, DATE(created_at)
         ) daily
         GROUP BY partner_id
       ),
       today_count AS (
         SELECT partner_id, COUNT(*) as today_calls
         FROM audit.audit_logs
         WHERE created_at >= CURRENT_DATE
         GROUP BY partner_id
       )
       SELECT tc.partner_id, p.company_name, tc.today_calls, da.avg_daily,
              (tc.today_calls::float / NULLIF(da.avg_daily, 0) * 100) as percentage
       FROM today_count tc
       JOIN daily_avg da ON da.partner_id = tc.partner_id
       LEFT JOIN portal.partners p ON p.id = tc.partner_id
       WHERE tc.today_calls > da.avg_daily * ${AUDIT.ANOMALY_THRESHOLD_PERCENT / 100}`
    );

    return anomalies;
  },
};

/** Compute audit dashboard from in-memory mock data */
function computeMockAuditDashboard() {
  const logs = getMockTable('audit.audit_logs');
  const partners = getMockTable('portal.partners');

  const totalCalls = logs.length;
  const uniquePartnerIds = new Set(logs.map((l) => l.partner_id));
  const latencies = logs.map((l) => Number(l.response_time_ms));
  const avgResponseTime = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : 0;
  const errorCount = logs.filter((l) => Number(l.response_status) >= 400).length;
  const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;

  // Top endpoints
  const endpointCounts = new Map<string, { count: number; latencySum: number }>();
  for (const log of logs) {
    const ep = log.api_endpoint as string;
    const entry = endpointCounts.get(ep) || { count: 0, latencySum: 0 };
    entry.count++;
    entry.latencySum += Number(log.response_time_ms);
    endpointCounts.set(ep, entry);
  }
  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      call_count: data.count,
      avg_latency: Math.round(data.latencySum / data.count),
    }))
    .sort((a, b) => b.call_count - a.call_count)
    .slice(0, 10);

  // Top partners
  const partnerCounts = new Map<string, number>();
  for (const log of logs) {
    const pid = log.partner_id as string;
    partnerCounts.set(pid, (partnerCounts.get(pid) || 0) + 1);
  }
  const topPartners = Array.from(partnerCounts.entries())
    .map(([partnerId, count]) => {
      const partner = partners.find((p) => p.id === partnerId);
      return {
        partner_id: partnerId,
        company_name: (partner?.company_name as string) || 'Desconocido',
        call_count: count,
      };
    })
    .sort((a, b) => b.call_count - a.call_count)
    .slice(0, 10);

  return {
    totalCalls,
    uniquePartners: uniquePartnerIds.size,
    avgResponseTime,
    errorRate: Math.round(errorRate * 10) / 10,
    topEndpoints,
    topPartners,
  };
}

function convertToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ].join('\n');
}
