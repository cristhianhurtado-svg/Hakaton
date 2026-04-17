import { query, queryOne, withTransaction } from '../../db/pool';
import { v4 as uuidv4 } from 'uuid';
import type { ChangePartnerStatusInput, BulkActionInput } from '@conecta2/shared';
import { NotFoundError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { mockListPartners, mockGetPartner } from '../../db/mock-services';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

/**
 * Partner Manager — Req 15
 * Centralized partner access management with granular controls.
 */
export const partnerManagerService = {
  /** List all partners — Req 15.7 */
  async listPartners(page: number, pageSize: number) {
    if (USE_MOCK) return mockListPartners(page, pageSize);

    const offset = (page - 1) * pageSize;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM portal.partners`
    );
    const totalItems = parseInt(countResult[0]?.count || '0', 10);

    const partners = await query(
      `SELECT p.id, p.company_name, p.email, p.profile_type, p.status, p.last_activity_at, p.created_at,
              (SELECT COUNT(*) FROM portal.applications a WHERE a.partner_id = p.id) as application_count
       FROM portal.partners p
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    return {
      data: partners,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    };
  },

  /** Get partner details */
  async getPartner(partnerId: string) {
    if (USE_MOCK) {
      const partner = mockGetPartner(partnerId);
      if (!partner) throw new NotFoundError('Partner', partnerId);
      return partner;
    }
    const partner = await queryOne(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM portal.applications a WHERE a.partner_id = p.id) as application_count
       FROM portal.partners p WHERE p.id = $1`,
      [partnerId]
    );
    if (!partner) throw new NotFoundError('Partner', partnerId);
    return partner;
  },

  /** Change partner status — Req 15.1, 15.3 */
  async changePartnerStatus(
    partnerId: string,
    input: ChangePartnerStatusInput,
    adminId: string
  ) {
    return withTransaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM portal.partners WHERE id = $1 FOR UPDATE`,
        [partnerId]
      );

      if (current.rows.length === 0) throw new NotFoundError('Partner', partnerId);

      const previousState = { status: current.rows[0].status };

      await client.query(
        `UPDATE portal.partners SET status = $1, updated_at = NOW() WHERE id = $2`,
        [input.status, partnerId]
      );

      // Invalidate credentials on suspension — Req 15.3
      if (input.status === 'suspended' || input.status === 'revoked') {
        await client.query(
          `UPDATE credentials.credentials SET status = 'revoked', revoked_at = NOW()
           WHERE partner_id = $1 AND status = 'active'`,
          [partnerId]
        );
      }

      // Immutable audit trail — Req 15.5
      await client.query(
        `INSERT INTO audit.partner_access_log (id, partner_id, admin_id, action, reason, previous_state, new_state, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          uuidv4(), partnerId, adminId,
          input.status === 'active' ? 'approve' : input.status,
          input.reason,
          JSON.stringify(previousState),
          JSON.stringify({ status: input.status }),
        ]
      );

      logger.info('Partner status changed', { partnerId, newStatus: input.status, adminId });

      return { partnerId, status: input.status, message: `Estado del partner actualizado a ${input.status}` };
    });
  },

  /** Change application status — Req 15.2 */
  async changeAppStatus(
    partnerId: string,
    appId: string,
    input: ChangePartnerStatusInput,
    adminId: string
  ) {
    return withTransaction(async (client) => {
      const current = await client.query(
        `SELECT * FROM portal.applications WHERE id = $1 AND partner_id = $2 FOR UPDATE`,
        [appId, partnerId]
      );

      if (current.rows.length === 0) throw new NotFoundError('Aplicación', appId);

      await client.query(
        `UPDATE portal.applications SET status = $1, updated_at = NOW() WHERE id = $2`,
        [input.status, appId]
      );

      if (input.status === 'suspended' || input.status === 'revoked') {
        await client.query(
          `UPDATE credentials.credentials SET status = 'revoked', revoked_at = NOW()
           WHERE application_id = $1 AND status = 'active'`,
          [appId]
        );
      }

      await client.query(
        `INSERT INTO audit.partner_access_log (id, partner_id, application_id, admin_id, action, reason, previous_state, new_state, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          uuidv4(), partnerId, appId, adminId,
          input.status === 'active' ? 'approve' : input.status,
          input.reason,
          JSON.stringify({ status: current.rows[0].status }),
          JSON.stringify({ status: input.status }),
        ]
      );

      return { appId, status: input.status };
    });
  },

  /** Bulk action — Req 15.4 */
  async bulkAction(input: BulkActionInput, adminId: string) {
    const results = [];
    const targetStatus = input.action === 'suspend' ? 'suspended' : 'active';

    for (const entityId of input.entityIds) {
      try {
        if (input.entityType === 'partner') {
          await this.changePartnerStatus(entityId, { status: targetStatus, reason: input.reason }, adminId);
        }
        results.push({ entityId, success: true });
      } catch (error) {
        results.push({ entityId, success: false, error: (error as Error).message });
      }
    }

    return { results, totalProcessed: results.length, successful: results.filter((r) => r.success).length };
  },
};
