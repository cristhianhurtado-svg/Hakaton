import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { RATE_LIMITS } from '@conecta2/shared';
import { TooManyRequestsError } from '../lib/errors';
import { logger } from '../lib/logger';

/**
 * Rate Limiter middleware — Req 7.1, 7.2
 * Token bucket per Partner ID backed by Redis.
 */
export function rateLimiter(environment: 'production' | 'sandbox' = 'production') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const partnerId = req.partnerId;
    if (!partnerId) {
      return next();
    }

    const profile = req.partnerProfile || 'agil';
    const limits = environment === 'sandbox' ? RATE_LIMITS.SANDBOX : RATE_LIMITS.PRODUCTION;
    const limit = profile === 'corporativo' ? limits.CORPORATIVO : limits.AGIL;

    const key = `ratelimit:${partnerId}`;
    const windowSeconds = 60;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, limit - current);
      const ttl = await redis.ttl(key);

      _res.setHeader('X-RateLimit-Limit', limit);
      _res.setHeader('X-RateLimit-Remaining', remaining);
      _res.setHeader('X-RateLimit-Reset', ttl);

      if (current > limit) {
        logger.warn('Rate limit exceeded', {
          partnerId,
          profile,
          current,
          limit,
          correlationId: req.correlationId,
        });
        const retryAfter = Math.max(1, ttl);
        _res.setHeader('Retry-After', retryAfter);
        return next(new TooManyRequestsError(retryAfter));
      }

      next();
    } catch (error) {
      // If Redis is unavailable, allow the request (fail open)
      logger.warn('Rate limiter Redis error, allowing request', {
        error: (error as Error).message,
        correlationId: req.correlationId,
      });
      next();
    }
  };
}

/**
 * Dynamic per-IP throttler — Req 7.8
 * Mitigates DoS attacks without affecting other Partners.
 */
export function dynamicThrottler(maxPerMinute = 300) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `throttle:${ip}`;

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, 60);
      }

      if (current > maxPerMinute) {
        logger.warn('IP throttle exceeded', {
          ip,
          current,
          limit: maxPerMinute,
          correlationId: req.correlationId,
        });
        const ttl = await redis.ttl(key);
        _res.setHeader('Retry-After', Math.max(1, ttl));
        return next(new TooManyRequestsError(Math.max(1, ttl)));
      }

      next();
    } catch {
      next();
    }
  };
}
