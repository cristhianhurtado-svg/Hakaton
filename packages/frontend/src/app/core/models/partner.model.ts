/** Partner profile types */
export type ProfileType = 'agil' | 'corporativo' | 'dual';

/** Partner statuses */
export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'revoked';

/** Application statuses */
export type AppStatus = 'active' | 'suspended' | 'revoked';

/** Environment types */
export type EnvironmentType = 'sandbox' | 'production';

/** Partner summary (list view) */
export interface PartnerSummary {
  id: string;
  companyName: string;
  email: string;
  profileType: ProfileType;
  status: PartnerStatus;
  applicationCount: number;
  lastActivityAt: string | null;
  createdAt: string;
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
