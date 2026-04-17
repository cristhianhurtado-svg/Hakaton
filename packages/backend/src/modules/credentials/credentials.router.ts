import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createOAuthCredentialSchema, createMtlsCsrSchema, rotateCredentialSchema } from '@conecta2/shared';
import { credentialsService } from './credentials.service';

const router = Router();

router.use(authenticate);

/** GET /v1/api/credentials */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await credentialsService.listCredentials(req.partnerId!);
    res.json(result);
  } catch (error) { next(error); }
});

/** POST /v1/api/credentials/oauth — Req 4.1 */
router.post('/oauth',
  validate(createOAuthCredentialSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await credentialsService.createOAuthCredential(req.partnerId!, req.body);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/credentials/mtls/csr — Req 4.2 */
router.post('/mtls/csr',
  validate(createMtlsCsrSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await credentialsService.createMtlsCsr(req.partnerId!, req.body);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/credentials/:credId/rotate — Req 4.3 */
router.post('/:credId/rotate',
  validate(rotateCredentialSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await credentialsService.rotateCredential(req.partnerId!, req.params.credId, req.body);
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/credentials/:credId/revoke — Req 4.5 */
router.post('/:credId/revoke',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await credentialsService.revokeCredential(req.partnerId!, req.params.credId);
      res.json(result);
    } catch (error) { next(error); }
  }
);

export { router as credentialsRouter };
