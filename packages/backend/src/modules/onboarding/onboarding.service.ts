import { v4 as uuidv4 } from 'uuid';
import type { RegisterPartnerInput, VerifyEmailInput } from '@conecta2/shared';
import { onboardingRepository } from './onboarding.repository';
import { ConflictError, NotFoundError, AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';

/** Onboarding service — business logic for partner registration and onboarding */
export const onboardingService = {
  /**
   * Register a new partner — Req 1.1, 1.6, 1.7
   * Creates pending account and sends verification email within 5 seconds.
   */
  async register(input: RegisterPartnerInput) {
    const emailDomain = input.email.split('@')[1];

    // Check for existing domain — Req 1.7
    const existing = await onboardingRepository.findByEmailDomain(emailDomain);
    if (existing) {
      throw new ConflictError(
        `El dominio ${emailDomain} ya está asociado a una cuenta existente. ` +
        'Contacte al administrador de la cuenta existente.'
      );
    }

    const verificationToken = uuidv4();
    const partner = await onboardingRepository.createPartner(input, verificationToken);

    // Send verification email (async, within 5 seconds) — Req 1.1
    setImmediate(async () => {
      try {
        await sendVerificationEmail(partner.email, verificationToken);
        logger.info('Verification email sent', {
          partnerId: partner.id,
          email: partner.email,
        });
      } catch (error) {
        logger.error('Failed to send verification email', {
          partnerId: partner.id,
          error: (error as Error).message,
        });
      }
    });

    return {
      id: partner.id,
      companyName: partner.companyName,
      email: partner.email,
      profileType: partner.profileType,
      status: partner.status,
      message: 'Registro exitoso. Revise su correo electrónico para verificar su cuenta.',
    };
  },

  /**
   * Verify email and activate account — Req 1.2
   * Activates account and initializes profile-specific onboarding flow.
   */
  async verifyEmail(input: VerifyEmailInput) {
    const partner = await onboardingRepository.findByVerificationToken(input.token);
    if (!partner) {
      throw new NotFoundError('Token de verificación inválido o expirado');
    }

    const activated = await onboardingRepository.activatePartner(partner.id);
    if (!activated) {
      throw new AppError({
        status: 500,
        title: 'Error de activación',
        detail: 'No se pudo activar la cuenta',
      });
    }

    // Initialize onboarding progress — Req 1.2
    await onboardingRepository.createOnboardingProgress(
      partner.id,
      partner.profileType
    );

    logger.info('Partner account activated', {
      partnerId: partner.id,
      profileType: partner.profileType,
    });

    return {
      partnerId: partner.id,
      profileType: partner.profileType,
      message: 'Cuenta verificada exitosamente. Bienvenido a Conecta 2.0.',
    };
  },

  /**
   * Get onboarding progress — Req 1.3
   */
  async getProgress(partnerId: string) {
    const progress = await onboardingRepository.getProgress(partnerId);
    if (!progress) {
      throw new NotFoundError('Progreso de onboarding', partnerId);
    }
    return progress;
  },

  /**
   * Complete an onboarding step — Req 1.3, 1.4, 1.5
   */
  async completeStep(partnerId: string, stepId: string) {
    const progress = await onboardingRepository.completeStep(partnerId, stepId);
    if (!progress) {
      throw new NotFoundError('Progreso de onboarding', partnerId);
    }

    const partner = await onboardingRepository.findById(partnerId);

    // Auto-provision for Ágil on completion — Req 1.4
    if (
      partner?.profileType === 'agil' &&
      stepId === 'first-api-call'
    ) {
      logger.info('Partner_Agil onboarding completed, auto-provisioning credentials', {
        partnerId,
      });
      // Credential provisioning would be triggered here
    }

    // Create approval request for Corporativo — Req 1.5
    if (
      partner?.profileType === 'corporativo' &&
      stepId === 'request-mtls'
    ) {
      logger.info('Partner_Corporativo credential request created for admin approval', {
        partnerId,
      });
      // Admin notification would be triggered here
    }

    return progress;
  },
};

/** Placeholder for email sending (would use AWS SES in production) */
async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  logger.info('Sending verification email', { email, token: token.substring(0, 8) + '...' });
  // In production: AWS SES or SMTP integration
}
