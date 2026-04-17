import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../lib/errors';

/**
 * Zod validation middleware — Req 8.2
 * Validates request body, query, or params against a Zod schema.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Replace with parsed (and coerced) data
      if (source === 'body') req.body = data;
      if (source === 'query') (req as unknown as Record<string, unknown>).validatedQuery = data;
      if (source === 'params') (req as unknown as Record<string, unknown>).validatedParams = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return next(new ValidationError(fieldErrors));
      }
      next(error);
    }
  };
}
