import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../lib/logger';
import { mockPool } from './mock-pool';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

/** PostgreSQL connection pool — Req 12.7 */
const pgPool = USE_MOCK
  ? null
  : new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : false,
      max: config.db.maxConnections,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

if (pgPool) {
  pgPool.on('error', (err) => {
    logger.error('Unexpected PostgreSQL pool error', { error: err.message });
  });

  pgPool.on('connect', () => {
    logger.debug('New PostgreSQL client connected');
  });
}

/** Unified pool interface */
export const pool = USE_MOCK
  ? (mockPool as unknown as Pool)
  : pgPool!;

if (USE_MOCK) {
  logger.info('Using in-memory mock database (USE_MOCK_DB=true)');
}

/** Execute a query with automatic client management */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();

  if (USE_MOCK) {
    const result = await mockPool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Mock query executed', {
      query: text.substring(0, 100),
      duration,
      rows: result.rowCount,
    });
    return result.rows as T[];
  }

  const result = await pgPool!.query(text, params);
  const duration = Date.now() - start;

  logger.debug('Query executed', {
    query: text.substring(0, 100),
    duration,
    rows: result.rowCount,
  });

  return result.rows as T[];
}

/** Execute a query returning a single row */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/** Execute within a transaction */
export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  if (USE_MOCK) {
    // Mock transactions just execute directly
    const mockClient = {
      query: async (text: string, params?: unknown[]) => {
        const result = await mockPool.query(text, params);
        return result;
      },
      release: () => {},
    };
    return fn(mockClient as unknown as import('pg').PoolClient);
  }

  const client = await pgPool!.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
