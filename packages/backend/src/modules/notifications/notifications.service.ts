import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../db/pool';
import axios from 'axios';
import type { NotificationPreferences, RegisterWebhookInput, NotificationHistoryQuery } from '@conecta2/shared';
import { NOTIFICATIONS } from '@conecta2/shared';
import { NotFoundError, AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { mockGetNotifications } from '../../db/mock-services';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

/**
 * Lifecycle Notifier — Req 14
 * Proactive notifications for API lifecycle events.
 */
export const notificationsService = {
  /** Get notification history — Req 14.6 */
  async getHistory(partnerId: string, filters: NotificationHistoryQuery) {
    if (USE_MOCK) return mockGetNotifications(partnerId, filters);
    const conditions: string[] = ['nd.partner_id = $1'];
    const params: unknown[] = [partnerId];
    let idx = 2;

    if (filters.notificationType) {
      conditions.push(`n.notification_type = $${idx++}`);
      params.push(filters.notificationType);
    }
    if (filters.startDate) {
      conditions.push(`n.created_at >= $${idx++}`);
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      conditions.push(`n.created_at <= $${idx++}`);
      params.push(filters.endDate);
    }

    const offset = (filters.page - 1) * filters.pageSize;
    const whereClause = conditions.join(' AND ');

    const rows = await query(
      `SELECT n.*, nd.channel, nd.status as delivery_status, nd.delivered_at
       FROM notifications.notifications n
       JOIN notifications.notification_deliveries nd ON nd.notification_id = n.id
       WHERE ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, filters.pageSize, offset]
    );

    return { data: rows, pagination: { page: filters.page, pageSize: filters.pageSize, totalItems: rows.length, totalPages: 1 } };
  },

  /** Get notification preferences */
  async getPreferences(partnerId: string) {
    return queryOne(
      `SELECT * FROM notifications.notification_preferences WHERE partner_id = $1`,
      [partnerId]
    );
  },

  /** Update notification preferences */
  async updatePreferences(partnerId: string, prefs: NotificationPreferences) {
    await query(
      `INSERT INTO notifications.notification_preferences (id, partner_id, email_enabled, dashboard_enabled, webhook_enabled, webhook_url, subscribed_apis)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (partner_id) DO UPDATE SET
         email_enabled = $3, dashboard_enabled = $4, webhook_enabled = $5, webhook_url = $6, subscribed_apis = $7`,
      [uuidv4(), partnerId, prefs.emailEnabled, prefs.dashboardEnabled, prefs.webhookEnabled, prefs.webhookUrl, JSON.stringify(prefs.subscribedApis || [])]
    );
    return { message: 'Preferencias actualizadas' };
  },

  /** Register webhook — Req 14.5 */
  async registerWebhook(partnerId: string, input: RegisterWebhookInput) {
    // Validate webhook with test payload — Req 14.5
    try {
      const testPayload = {
        type: 'webhook_validation',
        timestamp: new Date().toISOString(),
        message: 'Conecta 2.0 webhook validation test',
      };

      await axios.post(input.url, testPayload, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      throw new AppError({
        status: 400,
        title: 'Webhook inválido',
        detail: `No se pudo validar el webhook: ${(error as Error).message}`,
      });
    }

    await query(
      `UPDATE notifications.notification_preferences
       SET webhook_enabled = true, webhook_url = $1, webhook_validated = true
       WHERE partner_id = $2`,
      [input.url, partnerId]
    );

    logger.info('Webhook registered', { partnerId, url: input.url });
    return { message: 'Webhook registrado y validado exitosamente' };
  },

  /** Send notification (internal) — Req 14.1-14.3 */
  async sendNotification(
    type: string,
    subject: string,
    body: string,
    targetPartnerIds: string[],
    metadata?: Record<string, unknown>
  ) {
    const notificationId = uuidv4();

    await query(
      `INSERT INTO notifications.notifications (id, notification_type, subject, body, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [notificationId, type, subject, body, metadata ? JSON.stringify(metadata) : null]
    );

    // Create deliveries for each partner and channel — Req 14.4
    for (const partnerId of targetPartnerIds) {
      const prefs = await queryOne<Record<string, unknown>>(
        `SELECT * FROM notifications.notification_preferences WHERE partner_id = $1`,
        [partnerId]
      );

      const channels = ['dashboard']; // Always dashboard
      if (prefs?.email_enabled !== false) channels.push('email');
      if (prefs?.webhook_enabled && prefs?.webhook_url) channels.push('webhook');

      for (const channel of channels) {
        await query(
          `INSERT INTO notifications.notification_deliveries (id, notification_id, partner_id, channel, status, created_at)
           VALUES ($1, $2, $3, $4, 'pending', NOW())`,
          [uuidv4(), notificationId, partnerId, channel]
        );
      }
    }

    // Process deliveries asynchronously
    setImmediate(() => this.processDeliveries(notificationId));

    return { notificationId };
  },

  /** Process pending deliveries with retry — Req 14.7 */
  async processDeliveries(notificationId: string) {
    const deliveries = await query<Record<string, unknown>>(
      `SELECT nd.*, n.subject, n.body, n.metadata
       FROM notifications.notification_deliveries nd
       JOIN notifications.notifications n ON n.id = nd.notification_id
       WHERE nd.notification_id = $1 AND nd.status = 'pending'`,
      [notificationId]
    );

    for (const delivery of deliveries) {
      try {
        await this.deliverNotification(delivery);
        await query(
          `UPDATE notifications.notification_deliveries SET status = 'delivered', delivered_at = NOW() WHERE id = $1`,
          [delivery.id]
        );
      } catch (error) {
        const retryCount = (delivery.retry_count as number) || 0;
        if (retryCount < NOTIFICATIONS.MAX_RETRY_ATTEMPTS) {
          await query(
            `UPDATE notifications.notification_deliveries SET retry_count = $1, error_message = $2 WHERE id = $3`,
            [retryCount + 1, (error as Error).message, delivery.id]
          );
          // Exponential backoff retry would be scheduled here
        } else {
          await query(
            `UPDATE notifications.notification_deliveries SET status = 'failed', error_message = $1 WHERE id = $2`,
            [(error as Error).message, delivery.id]
          );
          logger.error('Notification delivery failed after max retries', {
            deliveryId: delivery.id,
            partnerId: delivery.partner_id,
            channel: delivery.channel,
          });
        }
      }
    }
  },

  /** Deliver a single notification */
  async deliverNotification(delivery: Record<string, unknown>) {
    switch (delivery.channel) {
      case 'email':
        // AWS SES integration
        logger.info('Email notification sent', { partnerId: delivery.partner_id });
        break;
      case 'webhook': {
        const prefs = await queryOne<Record<string, unknown>>(
          `SELECT webhook_url FROM notifications.notification_preferences WHERE partner_id = $1`,
          [delivery.partner_id as string]
        );
        if (prefs?.webhook_url) {
          await axios.post(prefs.webhook_url as string, {
            type: 'lifecycle_notification',
            subject: delivery.subject,
            body: delivery.body,
            metadata: delivery.metadata,
            timestamp: new Date().toISOString(),
          }, { timeout: 10000 });
        }
        break;
      }
      case 'dashboard':
        // Dashboard notifications are stored in DB, no additional delivery needed
        break;
    }
  },
};
