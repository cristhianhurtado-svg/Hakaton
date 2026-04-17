import type { ProfileType, PartnerStatus } from '@conecta2/shared';

export interface PartnerRecord {
  id: string;
  companyName: string;
  email: string;
  emailDomain: string;
  profileType: ProfileType;
  status: PartnerStatus;
  companyData: Record<string, unknown>;
  roles: string[];
  verificationToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  order: number;
}

export interface OnboardingProgress {
  id: string;
  partnerId: string;
  profileType: ProfileType;
  stepsCompleted: OnboardingStep[];
  stepsRemaining: OnboardingStep[];
  firstApiCallCompleted: boolean;
  startedAt: Date;
  completedAt: Date | null;
}
