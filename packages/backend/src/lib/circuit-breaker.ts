import { CIRCUIT_BREAKER } from '@conecta2/shared';
import { logger } from './logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  cooldownMs?: number;
  name: string;
}

/**
 * Circuit Breaker — Req 5.4, 12.4
 * States: CLOSED -> OPEN -> HALF_OPEN -> CLOSED
 */
export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly name: string;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.failureThreshold = options.failureThreshold ?? CIRCUIT_BREAKER.FAILURE_THRESHOLD;
    this.cooldownMs = (options.cooldownMs ?? CIRCUIT_BREAKER.COOLDOWN_SECONDS) * 1000;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.cooldownMs) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit breaker [${this.name}] transitioning to HALF_OPEN`);
      } else {
        throw new CircuitBreakerOpenError(this.name, this.retryAfterSeconds());
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      logger.info(`Circuit breaker [${this.name}] closing after successful probe`);
    }
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold || this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      logger.warn(`Circuit breaker [${this.name}] opened after ${this.failureCount} failures`);
    }
  }

  private retryAfterSeconds(): number {
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(1, Math.ceil((this.cooldownMs - elapsed) / 1000));
  }

  getState(): CircuitState {
    return this.state;
  }
}

export class CircuitBreakerOpenError extends Error {
  public readonly retryAfter: number;

  constructor(serviceName: string, retryAfter: number) {
    super(`Circuit breaker [${serviceName}] is OPEN. Retry after ${retryAfter}s`);
    this.name = 'CircuitBreakerOpenError';
    this.retryAfter = retryAfter;
  }
}
