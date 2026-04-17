import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';
import type { Role } from '@conecta2/shared';

/**
 * RBAC Authorization middleware — Req 8.5
 * Validates that the authenticated user has the required role(s).
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.roles || req.roles.length === 0) {
      return next(new UnauthorizedError('No se encontraron roles en el token'));
    }

    const hasRole = req.roles.some((role) => allowedRoles.includes(role as Role));

    if (!hasRole) {
      return next(
        new ForbiddenError(
          `Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
}
