import { z } from 'zod';

/** Notification preferences — Req 14.4 */
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  dashboardEnabled: z.boolean().default(true),
  webhookEnabled: z.boolean().default(false),
  webhookUrl: z.string().url('URL de webhook inválida').optional(),
  subscribedApis: z.array(z.string().uuid()).optional(),
});

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

/** Register webhook — Req 14.5 */
export const registerWebhookSchema = z.object({
  url: z.string().url('URL de webhook inválida'),
  secret: z.string().min(16, 'El secreto debe tener al menos 16 caracteres').optional(),
});

export type RegisterWebhookInput = z.infer<typeof registerWebhookSchema>;

/** Notification response */
export const notificationSchema = z.object({
  id: z.string().uuid(),
  notificationType: z.enum([
    'new_version',
    'maintenance',
    'deprecation',
    'credential_expiry',
    'access_change',
  ]),
  subject: z.string(),
  body: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  scheduledAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

/** Notification history query */
export const notificationHistoryQuerySchema = z.object({
  notificationType: z.enum([
    'new_version',
    'maintenance',
    'deprecation',
    'credential_expiry',
    'access_change',
  ]).optional(),
  apiId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type NotificationHistoryQuery = z.infer<typeof notificationHistoryQuerySchema>;
