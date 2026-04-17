/** Credential types */
export type CredentialType = 'oauth2' | 'mtls';

/** Credential statuses */
export type CredentialStatus = 'active' | 'rotated' | 'revoked' | 'expired';

/** Credential response — supports both camelCase and snake_case */
export interface Credential {
  id: string;
  partnerId?: string;
  partner_id?: string;
  applicationId?: string;
  application_id?: string;
  credentialType?: CredentialType;
  credential_type?: string;
  clientId?: string;
  client_id?: string;
  status: CredentialStatus;
  expiresAt?: string;
  expires_at?: string;
  gracePeriodEnd?: string | null;
  grace_period_end?: string | null;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

/** OAuth credential creation response (includes secret shown once) */
export interface OAuthCreatedResponse extends Credential {
  clientSecret: string;
}

/** Create OAuth input */
export interface CreateOAuthCredentialInput {
  applicationId: string;
  description?: string;
}

/** Create mTLS CSR input */
export interface CreateMtlsCsrInput {
  applicationId: string;
  commonName: string;
  organization: string;
  country: string;
}

/** Rotate credential input */
export interface RotateCredentialInput {
  gracePeriodHours?: number;
}
