import { z } from 'zod';

/** Create API version — Req 17.1 */
export const createApiVersionSchema = z.object({
  apiDefinitionId: z.string().uuid(),
  versionNumber: z.string().regex(/^\d+\.\d+\.\d+$/, 'Formato de versión inválido (use semver: x.y.z)'),
  openapiSpec: z.record(z.unknown()),
});

export type CreateApiVersionInput = z.infer<typeof createApiVersionSchema>;

/** Promote version — Req 17.1 */
export const promoteVersionSchema = z.object({
  targetStatus: z.enum(['staging', 'active']),
});

export type PromoteVersionInput = z.infer<typeof promoteVersionSchema>;

/** Create sunset plan — Req 17.2 */
export const createSunsetPlanSchema = z.object({
  sunsetDate: z.string().datetime(),
  targetVersionId: z.string().uuid('Debe seleccionar una versión de migración'),
  migrationNotes: z.string().max(5000).optional(),
});

export type CreateSunsetPlanInput = z.infer<typeof createSunsetPlanSchema>;

/** API version response */
export const apiVersionSchema = z.object({
  id: z.string().uuid(),
  apiDefinitionId: z.string().uuid(),
  versionNumber: z.string(),
  lifecycleStatus: z.enum(['draft', 'staging', 'active', 'deprecated', 'sunset']),
  publishedAt: z.string().datetime().nullable(),
  deprecatedAt: z.string().datetime().nullable(),
  sunsetDate: z.string().datetime().nullable(),
  consumerCount: z.number().int().optional(),
  createdAt: z.string().datetime(),
});

export type ApiVersion = z.infer<typeof apiVersionSchema>;

/** Sunset plan response */
export const sunsetPlanSchema = z.object({
  id: z.string().uuid(),
  apiVersionId: z.string().uuid(),
  targetVersionId: z.string().uuid(),
  sunsetDate: z.string().datetime(),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  migrationGuide: z.record(z.unknown()).nullable(),
  activatedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type SunsetPlan = z.infer<typeof sunsetPlanSchema>;
