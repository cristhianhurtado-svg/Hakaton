/** RBAC Roles — Req 8.5 */
export const ROLES = {
  PARTNER_VIEWER: 'Partner_Viewer',
  PARTNER_ADMIN: 'Partner_Admin',
  SB_ADMIN: 'SB_Admin',
  SB_SUPER_ADMIN: 'SB_SuperAdmin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Partner profile types */
export const PROFILE_TYPES = {
  AGIL: 'agil',
  CORPORATIVO: 'corporativo',
  DUAL: 'dual',
} as const;

export type ProfileType = (typeof PROFILE_TYPES)[keyof typeof PROFILE_TYPES];

/** Partner statuses */
export const PARTNER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
} as const;

export type PartnerStatus = (typeof PARTNER_STATUS)[keyof typeof PARTNER_STATUS];

/** Application statuses */
export const APP_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REVOKED: 'revoked',
} as const;

export type AppStatus = (typeof APP_STATUS)[keyof typeof APP_STATUS];

/** Environment types */
export const ENVIRONMENT_TYPES = {
  SANDBOX: 'sandbox',
  PRODUCTION: 'production',
} as const;

export type EnvironmentType = (typeof ENVIRONMENT_TYPES)[keyof typeof ENVIRONMENT_TYPES];

/** Credential types */
export const CREDENTIAL_TYPES = {
  OAUTH2: 'oauth2',
  MTLS: 'mtls',
} as const;

export type CredentialType = (typeof CREDENTIAL_TYPES)[keyof typeof CREDENTIAL_TYPES];

/** Credential statuses */
export const CREDENTIAL_STATUS = {
  ACTIVE: 'active',
  ROTATED: 'rotated',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
} as const;

export type CredentialStatus = (typeof CREDENTIAL_STATUS)[keyof typeof CREDENTIAL_STATUS];

/** API lifecycle statuses */
export const LIFECYCLE_STATUS = {
  DRAFT: 'draft',
  STAGING: 'staging',
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  SUNSET: 'sunset',
} as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUS)[keyof typeof LIFECYCLE_STATUS];

/** Profile support for APIs */
export const PROFILE_SUPPORT = {
  AGIL: 'agil',
  CORPORATIVO: 'corporativo',
  BOTH: 'both',
} as const;

export type ProfileSupport = (typeof PROFILE_SUPPORT)[keyof typeof PROFILE_SUPPORT];

/** Access tiers */
export const ACCESS_TIERS = {
  BASIC: 'basic',
  STANDARD: 'standard',
  PREMIUM: 'premium',
} as const;

export type AccessTier = (typeof ACCESS_TIERS)[keyof typeof ACCESS_TIERS];

/** Notification types */
export const NOTIFICATION_TYPES = {
  NEW_VERSION: 'new_version',
  MAINTENANCE: 'maintenance',
  DEPRECATION: 'deprecation',
  CREDENTIAL_EXPIRY: 'credential_expiry',
  ACCESS_CHANGE: 'access_change',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/** Notification channels */
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  DASHBOARD: 'dashboard',
  WEBHOOK: 'webhook',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

/** SDK languages */
export const SDK_LANGUAGES = {
  JAVASCRIPT: 'javascript',
  PYTHON: 'python',
  JAVA: 'java',
} as const;

export type SdkLanguage = (typeof SDK_LANGUAGES)[keyof typeof SDK_LANGUAGES];

/** Access actions for audit */
export const ACCESS_ACTIONS = {
  APPROVE: 'approve',
  SUSPEND: 'suspend',
  REVOKE: 'revoke',
  REACTIVATE: 'reactivate',
} as const;

export type AccessAction = (typeof ACCESS_ACTIONS)[keyof typeof ACCESS_ACTIONS];
