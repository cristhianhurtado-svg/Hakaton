/** Notification types */
export type NotificationType =
  | 'new_version'
  | 'maintenance'
  | 'deprecation'
  | 'credential_expiry'
  | 'access_change';

/** Notification */
export interface Notification {
  id: string;
  notificationType: NotificationType;
  subject: string;
  body: string;
  metadata: Record<string, unknown> | null;
  scheduledAt: string | null;
  createdAt: string;
}

/** Notification preferences */
export interface NotificationPreferences {
  emailEnabled: boolean;
  dashboardEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl?: string;
  subscribedApis?: string[];
}

/** Audit log entry */
export interface AuditLogEntry {
  id: number;
  partnerId: string;
  applicationId: string;
  apiEndpoint: string;
  httpMethod: string;
  responseStatus: number;
  correlationId: string;
  responseTimeMs: number;
  requestMetadata: Record<string, unknown> | null;
  createdAt: string;
}

/** Audit dashboard summary */
export interface AuditDashboard {
  totalCalls: number;
  uniquePartners: number;
  avgResponseTime: number;
  errorRate: number;
  topEndpoints: {
    endpoint: string;
    callCount: number;
    avgLatency: number;
  }[];
  topPartners: {
    partnerId: string;
    companyName: string;
    callCount: number;
  }[];
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
