import Redis from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

/** In-memory Redis mock for local development */
class MockRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const current = entry ? parseInt(entry.value, 10) : 0;
    const next = current + 1;
    this.store.set(key, {
      value: String(next),
      expiresAt: entry?.expiresAt,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + seconds * 1000;
    }
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || !entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    if (remaining <= 0) {
      this.store.delete(key);
      return -2;
    }
    return remaining;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ...args: unknown[]): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (args[0] === 'EX' && typeof args[1] === 'number') {
      expiresAt = Date.now() + args[1] * 1000;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async connect(): Promise<void> {
    logger.info('Mock Redis connected (in-memory)');
  }

  disconnect(): void {
    this.store.clear();
    logger.info('Mock Redis disconnected');
  }

  on(_event: string, _handler: (...args: unknown[]) => void): this {
    return this;
  }
}

/** Redis client — Rate limiting, caching, queues */
export const redis: Redis | MockRedis = USE_MOCK
  ? new MockRedis()
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
      lazyConnect: true,
    });

if (!USE_MOCK) {
  (redis as Redis).on('connect', () => {
    logger.info('Redis connected');
  });

  (redis as Redis).on('error', (err) => {
    logger.error('Redis connection error', { error: err.message });
  });
}

/** Connect to Redis (call on startup) */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', {
      error: (error as Error).message,
    });
  }
}
