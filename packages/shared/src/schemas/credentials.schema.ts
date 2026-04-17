import { z } from 'zod';

/** Create OAuth 2.0 credentials — Req 4.1 */
export const createOAuthCredentialSchema = z.object({
  applicationId: z.string().uuid('ID de aplicación inválido'),
  description: z.string().max(500).optional(),
});

export type CreateOAuthCredentialInput = z.infer<typeof createOAuthCredentialSchema>;

/** Create mTLS CSR — Req 4.2 */
export const createMtlsCsrSchema = z.object({
  applicationId: z.string().uuid('ID de aplicación inválido'),
  commonName: z.string().min(1, 'Common Name requerido'),
  organization: z.string().min(1, 'Organización requerida'),
  country: z.string().length(2, 'Código de país debe ser de 2 caracteres'),
});

export type CreateMtlsCsrInput = z.infer<typeof createMtlsCsrSchema>;

/** Rotate credential — Req 4.3 */
export const rotateCredentialSchema = z.object({
  gracePeriodHours: z.number().int().positive().max(168).default(24),
});

export type RotateCredentialInput = z.infer<typeof rotateCredentialSchema>;

/** Credential response */
export const credentialResponseSchema = z.object({
  id: z.string().uuid(),
  partnerId: z.string().uuid(),
  applicationId: z.string().uuid(),
  credentialType: z.enum(['oauth2', 'mtls']),
  clientId: z.string(),
  status: z.enum(['active', 'rotated', 'revoked', 'expired']),
  expiresAt: z.string().datetime(),
  gracePeriodEnd: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type CredentialResponse = z.infer<typeof credentialResponseSchema>;

/** OAuth credential creation response (includes secret shown once) */
export const oauthCreatedResponseSchema = credentialResponseSchema.extend({
  clientSecret: z.string(),
});

export type OAuthCreatedResponse = z.infer<typeof oauthCreatedResponseSchema>;
