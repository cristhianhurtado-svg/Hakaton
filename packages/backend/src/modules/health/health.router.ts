import { Router, Request, Response } from 'express';
import { pool } from '../../db/pool';
import { redis } from '../../lib/redis';

const router = Router();

/** Liveness probe — Req 12.3 */
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Readiness probe — Req 12.3 */
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch {
    checks.redis = 'error';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRouter };
