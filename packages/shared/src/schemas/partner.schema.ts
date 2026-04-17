import { z } from 'zod';

/** Partner status change — Req 15.1, 15.2 */
export const changePartnerStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'revoked']),
  reason: z.string().min(10, 'Debe proporcionar una razón de al menos 10 caracteres'),
});

export type ChangePartnerStatusInput = z.infer<typeof changePartnerStatusSchema>;

/** Bulk action schema — Req 15.4 */
export const bulkActionSchema = z.object({
  action: z.enum(['suspend', 'reactivate']),
  entityType: z.enum(['partner', 'application']),
  entityIds: z.array(z.string().uuid()).min(1, 'Debe seleccionar al menos una entidad'),
  reason: z.string().min(10, 'Debe proporcionar una razón de al menos 10 caracteres'),
});

export type BulkActionInput = z.infer<typeof bulkActionSchema>;

/** Partner list response */
export const partnerSummarySchema = z.object({
  id: z.string().uuid(),
  companyName: z.string(),
  email: z.string().email(),
  profileType: z.enum(['agil', 'corporativo', 'dual']),
  status: z.enum(['pending', 'active', 'suspended', 'revoked']),
  applicationCount: z.number().int(),
  lastActivityAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type PartnerSummary = z.infer<typeof partnerSummarySchema>;

/** Application schema */
export const applicationSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['active', 'suspended', 'revoked']),
  environment: z.enum(['sandbox', 'production']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Application = z.infer<typeof applicationSchema>;

/** Create application schema */
export const createApplicationSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(500).optional(),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
