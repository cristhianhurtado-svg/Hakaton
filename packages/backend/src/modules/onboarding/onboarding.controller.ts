import { Request, Response, NextFunction } from 'express';
import { onboardingService } from './onboarding.service';

/** Onboarding controller — request handling */
export const onboardingController = {
  /** POST /v1/api/onboarding/register */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardingService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** POST /v1/api/onboarding/verify-email */
  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardingService.verifyEmail(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** GET /v1/api/onboarding/progress */
  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await onboardingService.getProgress(req.partnerId!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /** POST /v1/api/onboarding/complete-step */
  async completeStep(req: Request, res: Response, next: NextFunction) {
    try {
      const { stepId } = req.body;
      const result = await onboardingService.completeStep(req.partnerId!, stepId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
};
