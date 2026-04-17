import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { ROLES } from '@conecta2/shared';
import { sdkGeneratorService } from './sdk-generator.service';

const router = Router();

/** POST /v1/api/admin/sdks/generate — Admin only — Req 13.3 */
router.post('/generate',
  authenticate,
  authorize(ROLES.SB_ADMIN, ROLES.SB_SUPER_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sdkGeneratorService.generateSdks(req.body.specId);
      res.status(202).json(result);
    } catch (error) { next(error); }
  }
);

/** GET /v1/api/sdks — Authenticated — Req 13.4 */
router.get('/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sdkGeneratorService.listSdks(req.query.apiId as string);
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** GET /v1/api/sdks/:sdkId/download */
router.get('/:sdkId/download',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await sdkGeneratorService.getSdkDownload(req.params.sdkId);
      res.json(result);
    } catch (error) { next(error); }
  }
);

export { router as sdkGeneratorRouter };
