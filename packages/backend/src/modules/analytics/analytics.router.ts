import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { analyticsQuerySchema, exportMetricsSchema, ROLES } from '@conecta2/shared';
import { analyticsService } from './analytics.service';

const router = Router();
router.use(authenticate);

/** GET /v1/api/analytics/dashboard — Req 6.2 */
router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.getDashboardMetrics(req.partnerId!);
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/api/analytics/metrics — Req 6.3 */
router.get('/metrics',
  validate(analyticsQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await analyticsService.getMetrics(
        req.partnerId!,
        (req as unknown as Record<string, unknown>).validatedQuery as never
      );
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** GET /v1/api/analytics/alerts — Req 6.4 */
router.get('/alerts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await analyticsService.checkAlerts(req.partnerId!);
    res.json(result);
  } catch (error) { next(error); }
});

/** POST /v1/api/analytics/export — Req 6.6 */
router.post('/export',
  validate(exportMetricsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await analyticsService.exportMetrics(req.partnerId!, req.body);
      res.json(result);
    } catch (error) { next(error); }
  }
);

export { router as analyticsRouter };
