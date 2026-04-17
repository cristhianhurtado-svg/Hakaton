import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { pool } from './db/pool';
import { connectRedis, redis } from './lib/redis';
import { GATEWAY } from '@conecta2/shared';

async function main() {
  const app = createApp();

  // Connect to Redis
  await connectRedis();

  // Verify database connection
  try {
    await pool.query('SELECT NOW()');
    logger.info('PostgreSQL connected');
  } catch (error) {
    logger.error('PostgreSQL connection failed', { error: (error as Error).message });
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`Conecta 2.0 API server running`, {
      port: config.port,
      environment: config.nodeEnv,
    });
  });

  // ─── Graceful Shutdown — Req 12.5 ──────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    server.close(async () => {
      logger.info('HTTP server closed');

      // Complete in-flight requests within 30 seconds
      const shutdownTimeout = setTimeout(() => {
        logger.warn('Graceful shutdown timeout exceeded, forcing exit');
        process.exit(1);
      }, GATEWAY.GRACEFUL_SHUTDOWN_SECONDS * 1000);

      try {
        await pool.end();
        logger.info('PostgreSQL pool closed');

        redis.disconnect();
        logger.info('Redis disconnected');

        clearTimeout(shutdownTimeout);
        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: (error as Error).message });
        clearTimeout(shutdownTimeout);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});
