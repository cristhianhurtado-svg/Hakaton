/** Partner profile types */
export type ProfileType = 'agil' | 'corporativo' | 'dual';

/** Partner statuses */
export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'revoked';

/** Application statuses */
export type AppStatus = 'active' | 'suspended' | 'revoked';

/** Environment types */
export type EnvironmentType = 'sandbox' | 'production';

/** Partner summary (list view) — supports snake_case from backend */
export interface PartnerSummary {
  id: string;
  companyName?: string;
  company_name?: string;
  email: string;
  profileType?: ProfileType;
  profile_type?: string;
  status: PartnerStatus;
  applicationCount?: number;
  application_count?: number;
  lastActivityAt?: string | null;
  last_activity_at?: string | null;
  createdAt?: string;
  created_at?: string;
  [key: string]: unknown;
}

/** Application */
export interface Application {
  id: string;
  partnerId: string;
  name: string;
  description?: string;
  status: AppStatus;
  environment: EnvironmentType;
  createdAt: string;
  updatedAt: string;
}

/** Create application input */
export interface CreateApplicationInput {
  name: string;
  description?: string;
  environment?: EnvironmentType;
}

/** Change partner status input */
export interface ChangePartnerStatusInput {
  status: 'active' | 'suspended' | 'revoked';
  reason: string;
}

/** Bulk action input */
export interface BulkActionInput {
  action: 'suspend' | 'reactivate';
  entityType: 'partner' | 'application';
  entityIds: string[];
  reason: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
