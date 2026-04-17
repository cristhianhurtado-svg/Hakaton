import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createApiVersionSchema, promoteVersionSchema, createSunsetPlanSchema, ROLES } from '@conecta2/shared';
import { versionGovernorService } from './version-governor.service';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SB_ADMIN, ROLES.SB_SUPER_ADMIN));

/** GET /v1/api/admin/versions — Req 17.5 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await versionGovernorService.listVersions();
    res.json(result);
  } catch (error) { next(error); }
});

/** POST /v1/api/admin/versions — Req 17.1 */
router.post('/',
  validate(createApiVersionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await versionGovernorService.createVersion(req.body, req.partnerId!);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/admin/versions/:id/promote — Req 17.1 */
router.post('/:id/promote',
  validate(promoteVersionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await versionGovernorService.promoteVersion(req.params.id, req.body, req.partnerId!);
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/admin/versions/:id/sunset — Req 17.2 */
router.post('/:id/sunset',
  validate(createSunsetPlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await versionGovernorService.createSunsetPlan(req.params.id, req.body, req.partnerId!);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/admin/versions/:id/sunset/activate — Req 17.3 */
router.post('/:id/sunset/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const planId = req.query.planId as string;
    const result = await versionGovernorService.activateSunsetPlan(req.params.id, planId);
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/api/admin/versions/:id/migration-guide — Req 17.4 */
router.get('/:id/migration-guide', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await versionGovernorService.getMigrationGuide(req.params.id);
    res.json(result);
  } catch (error) { next(error); }
});

export { router as versionGovernorRouter };
