import { z } from 'zod';

/** API search schema — Req 2.2 */
export const searchApisSchema = z.object({
  query: z.string().min(1, 'Término de búsqueda requerido').max(200),
  category: z.string().uuid().optional(),
  profileSupport: z.enum(['agil', 'corporativo', 'both']).optional(),
  acordCompatible: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type SearchApisInput = z.infer<typeof searchApisSchema>;

/** API list filters schema */
export const listApisSchema = z.object({
  category: z.string().uuid().optional(),
  profileSupport: z.enum(['agil', 'corporativo', 'both']).optional(),
  lifecycleStatus: z.enum(['draft', 'staging', 'active', 'deprecated', 'sunset']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ListApisInput = z.infer<typeof listApisSchema>;

/** API category schema */
export const apiCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  businessDomain: z.string(),
  sortOrder: z.number().int(),
});

export type ApiCategory = z.infer<typeof apiCategorySchema>;

/** API definition response */
export const apiDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  categoryId: z.string().uuid(),
  profileSupport: z.enum(['agil', 'corporativo', 'both']),
  acordCompatible: z.boolean(),
  acordMessageTypes: z.array(z.string()).nullable(),
  currentVersion: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ApiDefinition = z.infer<typeof apiDefinitionSchema>;
