import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { mcpService } from './mcp.service';

const router = Router();
router.use(authenticate);

/** POST /v1/mcp/discover — Req 9.2 */
router.post('/discover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mcpService.discover();
    res.json(result);
  } catch (error) { next(error); }
});

/** POST /v1/mcp/execute — Req 9.3 */
router.post('/execute', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiId, operation, params } = req.body;
    const result = await mcpService.execute(apiId, operation, params, req.correlationId);
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/mcp/schema — Req 9.6 */
router.get('/schema', (_req: Request, res: Response) => {
  res.json(mcpService.getSchema());
});

export { router as mcpRouter };
