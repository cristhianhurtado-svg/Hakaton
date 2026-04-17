import { z } from 'zod';

/** Upload OpenAPI spec — Req 10.1 */
export const uploadSpecSchema = z.object({
  name: z.string().min(2, 'Nombre de la API requerido'),
  categoryId: z.string().uuid('Categoría inválida'),
  profileSupport: z.enum(['agil', 'corporativo', 'both']),
  acordCompatible: z.boolean().default(false),
  spec: z.string().min(10, 'Especificación OpenAPI requerida'),
  format: z.enum(['yaml', 'json']),
});

export type UploadSpecInput = z.infer<typeof uploadSpecSchema>;

/** Spec validation error */
export const specValidationErrorSchema = z.object({
  path: z.string(),
  message: z.string(),
  suggestedFix: z.string().optional(),
});

export type SpecValidationError = z.infer<typeof specValidationErrorSchema>;

/** Parsed API definition */
export const parsedApiDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  endpoints: z.array(z.object({
    path: z.string(),
    method: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()),
    parameters: z.array(z.object({
      name: z.string(),
      in: z.enum(['query', 'header', 'path', 'cookie']),
      required: z.boolean(),
      schema: z.record(z.unknown()),
    })),
    requestBody: z.record(z.unknown()).optional(),
    responses: z.record(z.unknown()),
  })),
  schemas: z.record(z.unknown()),
});

export type ParsedApiDefinition = z.infer<typeof parsedApiDefinitionSchema>;
