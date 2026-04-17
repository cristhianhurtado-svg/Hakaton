import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { auditReportRequestSchema, ROLES } from '@conecta2/shared';
import { auditService } from './audit.service';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SB_ADMIN, ROLES.SB_SUPER_ADMIN));

/** POST /v1/api/admin/audit/reports — Req 16.2 */
router.post('/reports',
  validate(auditReportRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await auditService.generateReport(req.body);
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** GET /v1/api/admin/audit/logs — Raw audit logs */
router.get('/logs', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (process.env.USE_MOCK_DB === 'true') {
      const { getMockTable } = await import('../../db/mock-pool');
      const logs = getMockTable('audit.audit_logs')
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 100);
      res.json({ data: logs });
      return;
    }
    res.json({ data: [] });
  } catch (error) { next(error); }
});

/** GET /v1/api/admin/audit/dashboard — Req 16.5 */
router.get('/dashboard', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await auditService.getDashboard();
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/api/admin/audit/anomalies — Req 16.6 */
router.get('/anomalies', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await auditService.getAnomalies();
    res.json(result);
  } catch (error) { next(error); }
});

export { router as auditRouter };
