import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * JWT Authentication middleware — Req 8.4, 8.6
 * Validates OAuth 2.0 / OIDC tokens against the identity provider.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticación requerido'));
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      issuer: config.auth.idpIssuer,
    }) as jwt.JwtPayload;

    req.partnerId = decoded.partnerId as string;
    req.partnerProfile = decoded.profileType as string;
    req.roles = decoded.roles as string[];

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', { correlationId: req.correlationId });
      return next(new UnauthorizedError('Token expirado'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', {
        correlationId: req.correlationId,
        error: (error as Error).message,
      });
      return next(new UnauthorizedError('Token inválido'));
    }
    next(new UnauthorizedError());
  }
}

/**
 * Optional authentication — allows unauthenticated access but populates user if token present
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as jwt.JwtPayload;
    req.partnerId = decoded.partnerId as string;
    req.partnerProfile = decoded.profileType as string;
    req.roles = decoded.roles as string[];
  } catch {
    // Token invalid but endpoint allows unauthenticated access
  }

  next();
}
