import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { uploadSpecSchema, ROLES } from '@conecta2/shared';
import { openapiParserService } from './openapi-parser.service';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SB_ADMIN, ROLES.SB_SUPER_ADMIN));

/** POST /v1/api/admin/specs — Req 10.1 */
router.post('/',
  validate(uploadSpecSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await openapiParserService.uploadSpec(req.body);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
);

/** GET /v1/api/admin/specs/:specId */
router.get('/:specId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await openapiParserService.getSpec(req.params.specId);
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/api/admin/specs/:specId/export — Req 10.4 */
router.get('/:specId/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const yamlContent = await openapiParserService.exportSpec(req.params.specId);
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yamlContent);
  } catch (error) { next(error); }
});

/** POST /v1/api/admin/specs/:specId/validate — Req 10.2 */
router.post('/:specId/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { spec, format } = req.body;
    const result = await openapiParserService.validateSpec(spec, format);
    res.json(result);
  } catch (error) { next(error); }
});

/** GET /v1/api/admin/specs/:specId/versions — Req 10.5 */
router.get('/:specId/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await openapiParserService.listVersions(req.params.specId);
    res.json(result);
  } catch (error) { next(error); }
});

export { router as openapiParserRouter };
