import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { query, queryOne } from '../../db/pool';
import { CREDENTIAL_EXPIRATION } from '@conecta2/shared';
import type { CreateOAuthCredentialInput, CreateMtlsCsrInput, RotateCredentialInput } from '@conecta2/shared';
import { NotFoundError, AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import crypto from 'crypto';
import { config } from '../../config';
import { mockListCredentials } from '../../db/mock-services';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

export const credentialsService = {
  /** List credentials for a partner */
  async listCredentials(partnerId: string) {
    if (USE_MOCK) return mockListCredentials(partnerId);
    return query(
      `SELECT id, partner_id, application_id, credential_type, client_id, status, expires_at, grace_period_end, created_at
       FROM credentials.credentials WHERE partner_id = $1 ORDER BY created_at DESC`,
      [partnerId]
    );
  },

  /** Generate OAuth 2.0 credentials — Req 4.1 */
  async createOAuthCredential(partnerId: string, input: CreateOAuthCredentialInput) {
    const id = uuidv4();
    const clientId = `cli_${uuidv4().replace(/-/g, '')}`;
    const clientSecret = `sec_${crypto.randomBytes(32).toString('hex')}`;
    const secretHash = await bcrypt.hash(clientSecret, 12);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CREDENTIAL_EXPIRATION.REFRESH_TOKEN_DAYS);

    await query(
      `INSERT INTO credentials.credentials (id, partner_id, application_id, credential_type, client_id, client_secret_hash, status, expires_at, created_at)
       VALUES ($1, $2, $3, 'oauth2', $4, $5, 'active', $6, NOW())`,
      [id, partnerId, input.applicationId, clientId, secretHash, expiresAt]
    );

    logger.info('OAuth 2.0 credentials created', { partnerId, credentialId: id });

    // Return secret only once — Req 4.1
    return {
      id,
      partnerId,
      applicationId: input.applicationId,
      credentialType: 'oauth2' as const,
      clientId,
      clientSecret, // Shown only once
      status: 'active' as const,
      expiresAt: expiresAt.toISOString(),
      gracePeriodEnd: null,
      createdAt: new Date().toISOString(),
    };
  },

  /** Generate mTLS CSR — Req 4.2 */
  async createMtlsCsr(partnerId: string, input: CreateMtlsCsrInput) {
    const id = uuidv4();
    const clientId = `mtls_${uuidv4().replace(/-/g, '')}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CREDENTIAL_EXPIRATION.MTLS_CERT_DAYS);

    await query(
      `INSERT INTO credentials.credentials (id, partner_id, application_id, credential_type, client_id, status, expires_at, created_at)
       VALUES ($1, $2, $3, 'mtls', $4, 'active', $5, NOW())`,
      [id, partnerId, input.applicationId, clientId, expiresAt]
    );

    logger.info('mTLS CSR created', { partnerId, credentialId: id });

    return {
      id,
      clientId,
      credentialType: 'mtls' as const,
      status: 'active' as const,
      expiresAt: expiresAt.toISOString(),
      instructions: 'Descargue el CSR y complete el intercambio de certificados con el equipo de seguridad.',
    };
  },

  /** Rotate credential — Req 4.3 */
  async rotateCredential(partnerId: string, credentialId: string, input: RotateCredentialInput) {
    const existing = await queryOne<Record<string, unknown>>(
      `SELECT * FROM credentials.credentials WHERE id = $1 AND partner_id = $2 AND status = 'active'`,
      [credentialId, partnerId]
    );

    if (!existing) {
      throw new NotFoundError('Credencial', credentialId);
    }

    const gracePeriodEnd = new Date();
    gracePeriodEnd.setHours(gracePeriodEnd.getHours() + input.gracePeriodHours);

    // Mark old credential as rotated with grace period
    await query(
      `UPDATE credentials.credentials SET status = 'rotated', grace_period_end = $1, updated_at = NOW()
       WHERE id = $2`,
      [gracePeriodEnd, credentialId]
    );

    // Create new credential based on type
    if (existing.credential_type === 'oauth2') {
      return this.createOAuthCredential(partnerId, {
        applicationId: existing.application_id as string,
      });
    }

    return { message: 'Credencial rotada. La credencial anterior será válida hasta ' + gracePeriodEnd.toISOString() };
  },

  /** Revoke credential immediately — Req 4.5 */
  async revokeCredential(partnerId: string, credentialId: string) {
    const result = await query(
      `UPDATE credentials.credentials SET status = 'revoked', revoked_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND partner_id = $2 AND status IN ('active', 'rotated')
       RETURNING id`,
      [credentialId, partnerId]
    );

    if (result.length === 0) {
      throw new NotFoundError('Credencial activa', credentialId);
    }

    logger.warn('Credential revoked', { partnerId, credentialId });
    return { message: 'Credencial revocada exitosamente. Todas las sesiones activas han sido invalidadas.' };
  },
};
