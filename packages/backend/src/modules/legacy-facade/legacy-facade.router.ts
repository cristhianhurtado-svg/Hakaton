import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { legacyFacadeService } from './legacy-facade.service';

const router = Router();
router.use(authenticate);

/** ALL /v1/api/legacy/* — Req 5 */
router.all('/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await legacyFacadeService.forwardRequest(
      req.path,
      req.method,
      req.body,
      req.correlationId
    );

    if (result && (result as Record<string, unknown>).error) {
      const status = (result as Record<string, unknown>).status as number;
      res.status(status).json({
        title: 'Error del servicio legacy',
        status,
        detail: (result as Record<string, unknown>).detail,
        correlationId: req.correlationId,
      });
      return;
    }

    res.json(result);
  } catch (error) { next(error); }
});

export { router as legacyFacadeRouter };
