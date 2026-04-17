import { z } from 'zod';

/** Audit report request — Req 16.2 */
export const auditReportRequestSchema = z.object({
  partnerId: z.string().uuid().optional(),
  apiEndpoint: z.string().optional(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  statusCode: z.coerce.number().int().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['csv', 'json']).default('json'),
});

export type AuditReportRequest = z.infer<typeof auditReportRequestSchema>;

/** Audit log entry */
export const auditLogEntrySchema = z.object({
  id: z.number(),
  partnerId: z.string().uuid(),
  applicationId: z.string().uuid(),
  apiEndpoint: z.string(),
  httpMethod: z.string(),
  responseStatus: z.number(),
  correlationId: z.string().uuid(),
  responseTimeMs: z.number(),
  requestMetadata: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime(),
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;

/** Audit dashboard summary */
export const auditDashboardSchema = z.object({
  totalCalls: z.number(),
  uniquePartners: z.number(),
  avgResponseTime: z.number(),
  errorRate: z.number(),
  topEndpoints: z.array(z.object({
    endpoint: z.string(),
    callCount: z.number(),
    avgLatency: z.number(),
  })),
  topPartners: z.array(z.object({
    partnerId: z.string().uuid(),
    companyName: z.string(),
    callCount: z.number(),
  })),
});

export type AuditDashboard = z.infer<typeof auditDashboardSchema>;
