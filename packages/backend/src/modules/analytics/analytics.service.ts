import { query } from '../../db/pool';
import { redis } from '../../lib/redis';
import { ANALYTICS } from '@conecta2/shared';
import type { AnalyticsQueryInput, ExportMetricsInput } from '@conecta2/shared';
import { logger } from '../../lib/logger';
import { getMockTable } from '../../db/mock-pool';
import { config } from '../../config';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

export const analyticsService = {
  /** Get dashboard metrics — Req 6.1, 6.2 */
  async getDashboardMetrics(partnerId: string) {
    const now = new Date();
    const startDate = new Date(now.getTime() - ANALYTICS.DEFAULT_DASHBOARD_HOURS * 60 * 60 * 1000);

    // In mock mode, compute metrics directly from in-memory data
    if (USE_MOCK) {
      return computeMockDashboard(partnerId, startDate, now);
    }

    const metrics = await query<Record<string, unknown>>(
      `SELECT
         COUNT(*) as total_calls,
         COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 400) as success_count,
         PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time_ms) as p50,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95,
         PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99,
         COUNT(*) FILTER (WHERE response_status >= 400) as error_count
       FROM audit.audit_logs
       WHERE partner_id = $1 AND created_at >= $2`,
      [partnerId, startDate]
    );

    const row = metrics[0] || {};
    const totalCalls = Number(row.total_calls) || 0;
    const successCount = Number(row.success_count) || 0;
    const errorCount = Number(row.error_count) || 0;

    return {
      totalCalls,
      successRate: totalCalls > 0 ? (successCount / totalCalls) * 100 : 100,
      latency: {
        p50: Number(row.p50) || 0,
        p95: Number(row.p95) || 0,
        p99: Number(row.p99) || 0,
      },
      errorRate: totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0,
      errorsByType: {},
      quotaConsumption: { used: totalCalls, limit: 0, percentage: 0 },
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
    };
  },

  /** Get metrics with custom date range — Req 6.3 */
  async getMetrics(partnerId: string, input: AnalyticsQueryInput) {
    if (USE_MOCK) {
      return computeMockTimeline(partnerId);
    }

    const conditions: string[] = ['partner_id = $1'];
    const params: unknown[] = [partnerId];
    let idx = 2;

    if (input.startDate) {
      conditions.push(`created_at >= $${idx++}`);
      params.push(input.startDate);
    }
    if (input.endDate) {
      conditions.push(`created_at <= $${idx++}`);
      params.push(input.endDate);
    }

    const whereClause = conditions.join(' AND ');

    return query(
      `SELECT
         DATE_TRUNC('hour', created_at) as time_bucket,
         COUNT(*) as total_calls,
         AVG(response_time_ms) as avg_latency,
         COUNT(*) FILTER (WHERE response_status >= 400) as errors
       FROM audit.audit_logs
       WHERE ${whereClause}
       GROUP BY time_bucket
       ORDER BY time_bucket ASC`,
      params
    );
  },

  /** Check error rate alerts — Req 6.4 */
  async checkAlerts(partnerId: string) {
    if (USE_MOCK) {
      return computeMockAlerts();
    }

    const windowStart = new Date(
      Date.now() - ANALYTICS.ERROR_RATE_WINDOW_MINUTES * 60 * 1000
    );

    const result = await query<{ total: string; errors: string }>(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE response_status >= 400) as errors
       FROM audit.audit_logs
       WHERE partner_id = $1 AND created_at >= $2`,
      [partnerId, windowStart]
    );

    const total = Number(result[0]?.total) || 0;
    const errors = Number(result[0]?.errors) || 0;
    const errorRate = total > 0 ? (errors / total) * 100 : 0;

    const alerts = [];
    if (errorRate > ANALYTICS.ERROR_RATE_ALERT_THRESHOLD) {
      alerts.push({
        type: 'high_error_rate',
        message: `Tasa de error ${errorRate.toFixed(1)}% excede el umbral de ${ANALYTICS.ERROR_RATE_ALERT_THRESHOLD}%`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  },

  /** Export metrics — Req 6.6 */
  async exportMetrics(partnerId: string, input: ExportMetricsInput) {
    if (USE_MOCK) {
      const logs = getMockTable('audit.audit_logs');
      if (input.format === 'csv') {
        return { format: 'csv', data: convertToCsv(logs), rowCount: logs.length };
      }
      return { format: 'json', data: logs, rowCount: logs.length };
    }

    const rows = await query(
      `SELECT * FROM audit.audit_logs
       WHERE partner_id = $1 AND created_at >= $2 AND created_at <= $3
       ORDER BY created_at DESC`,
      [partnerId, input.startDate, input.endDate]
    );

    if (input.format === 'csv') {
      return { format: 'csv', data: convertToCsv(rows), rowCount: rows.length };
    }
    return { format: 'json', data: rows, rowCount: rows.length };
  },
};

// ─── Mock Computation Helpers ─────────────────────────────────

function computeMockDashboard(partnerId: string, startDate: Date, endDate: Date) {
  const allLogs = getMockTable('audit.audit_logs');

  // Use ALL logs (not filtered by partnerId) so admin sees global metrics
  const logs = allLogs.filter((log) => {
    const createdAt = new Date(log.created_at as string);
    return createdAt >= startDate && createdAt <= endDate;
  });

  const totalCalls = logs.length;
  const successCount = logs.filter((l) => {
    const s = Number(l.response_status);
    return s >= 200 && s < 400;
  }).length;
  const errorCount = totalCalls - successCount;

  // Calculate percentiles
  const latencies = logs.map((l) => Number(l.response_time_ms)).sort((a, b) => a - b);
  const p50 = percentile(latencies, 0.50);
  const p95 = percentile(latencies, 0.95);
  const p99 = percentile(latencies, 0.99);

  // Quota: based on profile
  const quotaLimit = 10000;
  const quotaUsed = totalCalls;
  const quotaPercentage = quotaLimit > 0 ? Math.min(100, (quotaUsed / quotaLimit) * 100) : 0;

  return {
    totalCalls,
    successRate: totalCalls > 0 ? (successCount / totalCalls) * 100 : 100,
    latency: { p50, p95, p99 },
    errorRate: totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0,
    errorsByType: computeErrorsByType(logs),
    quotaConsumption: {
      used: quotaUsed,
      limit: quotaLimit,
      percentage: Math.round(quotaPercentage),
    },
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

function computeMockTimeline(partnerId: string) {
  const allLogs = getMockTable('audit.audit_logs');
  const buckets = new Map<string, { total: number; errors: number; latencySum: number }>();

  for (const log of allLogs) {
    const date = new Date(log.created_at as string);
    const hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();

    if (!buckets.has(hour)) {
      buckets.set(hour, { total: 0, errors: 0, latencySum: 0 });
    }
    const bucket = buckets.get(hour)!;
    bucket.total++;
    bucket.latencySum += Number(log.response_time_ms);
    if (Number(log.response_status) >= 400) bucket.errors++;
  }

  return Array.from(buckets.entries())
    .map(([time, data]) => ({
      time_bucket: time,
      total_calls: data.total,
      avg_latency: Math.round(data.latencySum / data.total),
      errors: data.errors,
    }))
    .sort((a, b) => a.time_bucket.localeCompare(b.time_bucket));
}

function computeMockAlerts() {
  const allLogs = getMockTable('audit.audit_logs');
  const recentLogs = allLogs.filter((l) => {
    const created = new Date(l.created_at as string);
    return created >= new Date(Date.now() - 5 * 60 * 1000);
  });

  const total = recentLogs.length;
  const errors = recentLogs.filter((l) => Number(l.response_status) >= 400).length;
  const errorRate = total > 0 ? (errors / total) * 100 : 0;

  const alerts = [];
  if (errorRate > ANALYTICS.ERROR_RATE_ALERT_THRESHOLD) {
    alerts.push({
      type: 'high_error_rate',
      message: `Tasa de error ${errorRate.toFixed(1)}% excede el umbral de ${ANALYTICS.ERROR_RATE_ALERT_THRESHOLD}%`,
      severity: 'warning',
      timestamp: new Date().toISOString(),
    });
  }
  return alerts;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(p * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, idx)]);
}

function computeErrorsByType(logs: Record<string, unknown>[]): Record<string, number> {
  const errors: Record<string, number> = {};
  for (const log of logs) {
    const status = Number(log.response_status);
    if (status >= 400) {
      const key = `${status}`;
      errors[key] = (errors[key] || 0) + 1;
    }
  }
  return errors;
}

function convertToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
  ];
  return lines.join('\n');
}
