import { query, queryOne, withTransaction } from '../../db/pool';
import { v4 as uuidv4 } from 'uuid';
import type { RegisterPartnerInput } from '@conecta2/shared';
import type { PartnerRecord, OnboardingProgress } from './onboarding.types';

/** Onboarding repository — database operations for partner registration */
export const onboardingRepository = {
  /** Check if email domain already exists — Req 1.7 */
  async findByEmailDomain(domain: string): Promise<PartnerRecord | null> {
    return queryOne<PartnerRecord>(
      `SELECT * FROM portal.partners WHERE email_domain = $1 AND status != 'revoked' LIMIT 1`,
      [domain]
    );
  },

  /** Create a new partner with pending status — Req 1.1 */
  async createPartner(
    input: RegisterPartnerInput,
    verificationToken: string
  ): Promise<PartnerRecord> {
    const id = uuidv4();
    const emailDomain = input.email.split('@')[1];
    const roles = ['Partner_Viewer'];

    const rows = await query<PartnerRecord>(
      `INSERT INTO portal.partners (id, company_name, email, email_domain, profile_type, status, company_data, roles, verification_token, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        id,
        input.companyName,
        input.email,
        emailDomain,
        input.profileType,
        JSON.stringify(input.companyData),
        roles,
        verificationToken,
      ]
    );

    return rows[0];
  },

  /** Find partner by verification token — Req 1.2 */
  async findByVerificationToken(token: string): Promise<PartnerRecord | null> {
    return queryOne<PartnerRecord>(
      `SELECT * FROM portal.partners WHERE verification_token = $1 AND status = 'pending'`,
      [token]
    );
  },

  /** Activate partner account — Req 1.2 */
  async activatePartner(partnerId: string): Promise<PartnerRecord | null> {
    const rows = await query<PartnerRecord>(
      `UPDATE portal.partners
       SET status = 'active', verification_token = NULL, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [partnerId]
    );
    return rows[0] || null;
  },

  /** Create onboarding progress — Req 1.3 */
  async createOnboardingProgress(
    partnerId: string,
    profileType: string
  ): Promise<OnboardingProgress> {
    const id = uuidv4();
    const steps = getOnboardingSteps(profileType);

    const rows = await query<OnboardingProgress>(
      `INSERT INTO portal.onboarding_progress (id, partner_id, profile_type, steps_completed, steps_remaining, first_api_call_completed, started_at)
       VALUES ($1, $2, $3, $4, $5, false, NOW())
       RETURNING *`,
      [id, partnerId, profileType, JSON.stringify([]), JSON.stringify(steps)]
    );

    return rows[0];
  },

  /** Get onboarding progress for a partner */
  async getProgress(partnerId: string): Promise<OnboardingProgress | null> {
    return queryOne<OnboardingProgress>(
      `SELECT * FROM portal.onboarding_progress WHERE partner_id = $1`,
      [partnerId]
    );
  },

  /** Complete an onboarding step — Req 1.3 */
  async completeStep(partnerId: string, stepId: string): Promise<OnboardingProgress | null> {
    return withTransaction(async (client) => {
      const result = await client.query(
        `SELECT * FROM portal.onboarding_progress WHERE partner_id = $1 FOR UPDATE`,
        [partnerId]
      );

      const progress = result.rows[0];
      if (!progress) return null;

      const remaining = (progress.steps_remaining as unknown[]) || [];
      const completed = (progress.steps_completed as unknown[]) || [];

      const stepIndex = (remaining as Array<{ id: string }>).findIndex(
        (s) => s.id === stepId
      );
      if (stepIndex === -1) return progress as OnboardingProgress;

      const step = (remaining as Array<Record<string, unknown>>).splice(stepIndex, 1)[0];
      (step as Record<string, unknown>).completed = true;
      (completed as unknown[]).push(step);

      const updateResult = await client.query(
        `UPDATE portal.onboarding_progress
         SET steps_completed = $1, steps_remaining = $2, updated_at = NOW()
         WHERE partner_id = $3
         RETURNING *`,
        [JSON.stringify(completed), JSON.stringify(remaining), partnerId]
      );

      return updateResult.rows[0] as OnboardingProgress;
    });
  },

  /** Find partner by ID */
  async findById(partnerId: string): Promise<PartnerRecord | null> {
    return queryOne<PartnerRecord>(
      `SELECT * FROM portal.partners WHERE id = $1`,
      [partnerId]
    );
  },
};

/** Get profile-specific onboarding steps */
function getOnboardingSteps(profileType: string) {
  const commonSteps = [
    { id: 'verify-email', name: 'Verificar email', description: 'Confirma tu correo electrónico', completed: false, order: 1 },
    { id: 'explore-catalog', name: 'Explorar catálogo', description: 'Descubre las APIs disponibles', completed: false, order: 2 },
  ];

  if (profileType === 'agil') {
    return [
      ...commonSteps,
      { id: 'create-app', name: 'Crear aplicación', description: 'Registra tu primera aplicación', completed: false, order: 3 },
      { id: 'get-credentials', name: 'Obtener credenciales', description: 'Genera tus credenciales OAuth 2.0', completed: false, order: 4 },
      { id: 'first-api-call', name: 'Primera llamada API', description: 'Realiza tu primera llamada en el Sandbox', completed: false, order: 5 },
    ];
  }

  return [
    ...commonSteps,
    { id: 'create-app', name: 'Crear aplicación', description: 'Registra tu primera aplicación', completed: false, order: 3 },
    { id: 'request-mtls', name: 'Solicitar certificado mTLS', description: 'Genera tu CSR para autenticación mTLS', completed: false, order: 4 },
    { id: 'admin-approval', name: 'Aprobación del administrador', description: 'Espera la aprobación de tus credenciales', completed: false, order: 5 },
    { id: 'first-api-call', name: 'Primera llamada API', description: 'Realiza tu primera llamada en el Sandbox', completed: false, order: 6 },
  ];
}
