import winston from 'winston';
import { config } from '../config';

/**
 * Structured JSON logger — Req 12.2
 * Fields: timestamp, level, service, correlation-id, message
 */
export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'ISO' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'conecta2-api' },
  transports: [
    new winston.transports.Console({
      format:
        config.nodeEnv === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
    }),
  ],
});

/** Create a child logger with correlation ID */
export function createRequestLogger(correlationId: string) {
  return logger.child({ correlationId });
}
