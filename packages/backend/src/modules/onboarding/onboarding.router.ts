import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { registerPartnerSchema, verifyEmailSchema } from './onboarding.schema';

const router = Router();

/** POST /v1/api/onboarding/register — Public */
router.post(
  '/register',
  validate(registerPartnerSchema),
  onboardingController.register
);

/** POST /v1/api/onboarding/verify-email — Public */
router.post(
  '/verify-email',
  validate(verifyEmailSchema),
  onboardingController.verifyEmail
);

/** GET /v1/api/onboarding/progress — Authenticated */
router.get(
  '/progress',
  authenticate,
  onboardingController.getProgress
);

/** POST /v1/api/onboarding/complete-step — Authenticated */
router.post(
  '/complete-step',
  authenticate,
  onboardingController.completeStep
);

export { router as onboardingRouter };
