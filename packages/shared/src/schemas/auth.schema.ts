import { z } from 'zod';

/** Registration form schema — Req 1.1, 1.6 */
export const registerPartnerSchema = z.object({
  companyName: z
    .string()
    .min(2, 'El nombre de la empresa debe tener al menos 2 caracteres')
    .max(200, 'El nombre de la empresa no puede exceder 200 caracteres'),
  email: z
    .string()
    .email('Correo electrónico inválido'),
  profileType: z.enum(['agil', 'corporativo'], {
    errorMap: () => ({ message: 'Seleccione un perfil: Ágil o Corporativo' }),
  }),
  contactName: z
    .string()
    .min(2, 'El nombre de contacto debe tener al menos 2 caracteres')
    .max(100, 'El nombre de contacto no puede exceder 100 caracteres'),
  contactPhone: z
    .string()
    .regex(/^\+?[\d\s-]{7,20}$/, 'Número de teléfono inválido')
    .optional(),
  companyData: z.object({
    nit: z.string().min(5, 'NIT inválido').max(20),
    sector: z.string().min(2, 'Sector requerido'),
    country: z.string().min(2, 'País requerido').default('Colombia'),
    website: z.string().url('URL inválida').optional(),
  }),
});

export type RegisterPartnerInput = z.infer<typeof registerPartnerSchema>;

/** Email verification schema — Req 1.2 */
export const verifyEmailSchema = z.object({
  token: z.string().uuid('Token de verificación inválido'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** Login schema */
export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** JWT token claims */
export const jwtClaimsSchema = z.object({
  sub: z.string().uuid(),
  partnerId: z.string().uuid(),
  email: z.string().email(),
  roles: z.array(z.string()),
  profileType: z.enum(['agil', 'corporativo', 'dual']),
  iat: z.number(),
  exp: z.number(),
});

export type JwtClaims = z.infer<typeof jwtClaimsSchema>;
