import { z } from 'zod';

/** Analytics query schema — Req 6 */
export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  apiId: z.string().uuid().optional(),
  endpoint: z.string().optional(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  statusCode: z.coerce.number().int().optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

/** Dashboard metrics response — Req 6.1 */
export const dashboardMetricsSchema = z.object({
  totalCalls: z.number(),
  successRate: z.number(),
  latency: z.object({
    p50: z.number(),
    p95: z.number(),
    p99: z.number(),
  }),
  errorRate: z.number(),
  errorsByType: z.record(z.string(), z.number()),
  quotaConsumption: z.object({
    used: z.number(),
    limit: z.number(),
    percentage: z.number(),
  }),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;

/** Export request schema — Req 6.6 */
export const exportMetricsSchema = z.object({
  format: z.enum(['csv', 'json']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  apiId: z.string().uuid().optional(),
});

export type ExportMetricsInput = z.infer<typeof exportMetricsSchema>;
