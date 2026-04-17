import { z } from 'zod';

/** Pagination query params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/** Paginated response wrapper */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      totalItems: z.number(),
      totalPages: z.number(),
    }),
  });

/** Standard API error response — RFC 7807 Problem Details */
export const problemDetailsSchema = z.object({
  type: z.string().url().optional(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  instance: z.string().optional(),
  correlationId: z.string().uuid().optional(),
  errors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;

/** UUID param schema */
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

/** Date range query */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: 'La fecha de inicio debe ser anterior a la fecha de fin' }
);

export type DateRange = z.infer<typeof dateRangeSchema>;
