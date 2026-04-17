import { Request, Response, NextFunction } from 'express';
import { AppError, TooManyRequestsError, ServiceUnavailableError } from '../lib/errors';
import { CircuitBreakerOpenError } from '../lib/circuit-breaker';
import { logger } from '../lib/logger';
import type { ProblemDetails } from '@conecta2/shared';

/**
 * Global error handler — RFC 7807 Problem Details — Req 3.6
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const correlationId = req.correlationId;

  // Circuit breaker open → 503
  if (err instanceof CircuitBreakerOpenError) {
    const problem: ProblemDetails = {
      title: 'Servicio no disponible',
      status: 503,
      detail: err.message,
      correlationId,
    };
    res.setHeader('Retry-After', err.retryAfter);
    res.status(503).json(problem);
    return;
  }

  // Application errors
  if (err instanceof AppError) {
    if (err instanceof TooManyRequestsError) {
      res.setHeader('Retry-After', err.retryAfter);
    }
    if (err instanceof ServiceUnavailableError) {
      res.setHeader('Retry-After', err.retryAfter);
    }

    const problem = err.toProblemDetails(correlationId);
    res.status(err.status).json(problem);

    if (err.status >= 500) {
      logger.error('Server error', {
        correlationId,
        error: err.message,
        stack: err.stack,
        status: err.status,
      });
    }
    return;
  }

  // Unexpected errors
  logger.error('Unhandled error', {
    correlationId,
    error: err.message,
    stack: err.stack,
  });

  const problem: ProblemDetails = {
    title: 'Error interno del servidor',
    status: 500,
    detail: 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.',
    correlationId,
  };

  res.status(500).json(problem);
}
