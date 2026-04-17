import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { changePartnerStatusSchema, bulkActionSchema, ROLES } from '@conecta2/shared';
import { partnerManagerService } from './partner-manager.service';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SB_ADMIN, ROLES.SB_SUPER_ADMIN));

/** GET /v1/api/admin/partners — Req 15.7 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await partnerManagerService.listPartners(page, pageSize);
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/api/admin/partners/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await partnerManagerService.getPartner(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
});

/** PUT /v1/api/admin/partners/:id/status — Req 15.1 */
router.put('/:id/status',
  validate(changePartnerStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerManagerService.changePartnerStatus(
        req.params.id, req.body, req.partnerId!
      );
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** PUT /v1/api/admin/partners/:id/apps/:appId/status — Req 15.2 */
router.put('/:id/apps/:appId/status',
  validate(changePartnerStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerManagerService.changeAppStatus(
        req.params.id, req.params.appId, req.body, req.partnerId!
      );
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/admin/partners/bulk-action — Req 15.4 */
router.post('/bulk-action',
  validate(bulkActionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await partnerManagerService.bulkAction(req.body, req.partnerId!);
      res.json(result);
    } catch (error) { next(error); }
  }
);

export { router as partnerManagerRouter };
