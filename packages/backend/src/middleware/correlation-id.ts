import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Correlation ID middleware — Req 7.4
 * Injects a unique Correlation-ID into every request and propagates it.
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();
  req.correlationId = correlationId;
  res.setHeader(CORRELATION_ID_HEADER, correlationId);
  next();
}

/** Extend Express Request type */
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      partnerId?: string;
      partnerProfile?: string;
      roles?: string[];
    }
  }
}
