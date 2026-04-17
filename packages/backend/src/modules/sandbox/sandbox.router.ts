import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { rateLimiter } from '../../middleware/rate-limiter';
import { sandboxService } from './sandbox.service';

const router = Router();

router.use(authenticate);
router.use(rateLimiter('sandbox'));

/** ALL /v1/sandbox/* — Req 3.1 */
router.all('/*', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await sandboxService.processRequest(
      req.partnerId!,
      req.method,
      req.path,
      req.body,
      req.correlationId
    );
    res.json(result);
  } catch (error) { next(error); }
});

export { router as sandboxRouter };

/** Sandbox logs router (separate) */
const logsRouter = Router();
logsRouter.use(authenticate);

/** GET /v1/api/sandbox/logs — Req 3.3 */
logsRouter.get('/logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await sandboxService.getLogs(req.partnerId!, page, pageSize);
    res.json(result);
  } catch (error) { next(error); }
});

export { logsRouter as sandboxLogsRouter };
