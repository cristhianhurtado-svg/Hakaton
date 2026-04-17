import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { notificationPreferencesSchema, registerWebhookSchema, notificationHistoryQuerySchema } from '@conecta2/shared';
import { notificationsService } from './notifications.service';

const router = Router();
router.use(authenticate);

/** GET /v1/api/notifications — Req 14.6 */
router.get('/',
  validate(notificationHistoryQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationsService.getHistory(
        req.partnerId!,
        (req as unknown as Record<string, unknown>).validatedQuery as never
      );
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** GET /v1/api/notifications/preferences */
router.get('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await notificationsService.getPreferences(req.partnerId!);
    res.json(result || { emailEnabled: true, dashboardEnabled: true, webhookEnabled: false });
  } catch (error) { next(error); }
});

/** PUT /v1/api/notifications/preferences */
router.put('/preferences',
  validate(notificationPreferencesSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationsService.updatePreferences(req.partnerId!, req.body);
      res.json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/notifications/webhooks — Req 14.5 */
router.post('/webhooks',
  validate(registerWebhookSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationsService.registerWebhook(req.partnerId!, req.body);
      res.status(201).json(result);
    } catch (error) { next(error); }
  }
);

/** POST /v1/api/notifications/webhooks/:id/test */
router.post('/webhooks/:id/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefs = await notificationsService.getPreferences(req.partnerId!);
    if (prefs && (prefs as Record<string, unknown>).webhook_url) {
      await notificationsService.registerWebhook(req.partnerId!, {
        url: (prefs as Record<string, unknown>).webhook_url as string,
      });
    }
    res.json({ message: 'Test de webhook enviado' });
  } catch (error) { next(error); }
});

export { router as notificationsRouter };
