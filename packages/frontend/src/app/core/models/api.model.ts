/** Profile support for APIs */
export type ProfileSupport = 'agil' | 'corporativo' | 'both';

/** API lifecycle statuses */
export type LifecycleStatus = 'draft' | 'staging' | 'active' | 'deprecated' | 'sunset';

/** API category */
export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  businessDomain?: string;
  business_domain?: string;
  sortOrder?: number;
  sort_order?: number;
}

/** API definition — supports both camelCase and snake_case from backend */
export interface ApiDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId?: string;
  category_id?: string;
  profileSupport?: ProfileSupport;
  profile_support?: string;
  acordCompatible?: boolean;
  acord_compatible?: boolean;
  acordMessageTypes?: string[] | null;
  acord_message_types?: string[] | null;
  currentVersion?: string | null;
  current_version?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  // Extra fields from mock
  category_name?: string;
  [key: string]: unknown;
}

/** API version — supports both camelCase and snake_case */
export interface ApiVersion {
  id: string;
  apiDefinitionId?: string;
  api_definition_id?: string;
  versionNumber?: string;
  version_number?: string;
  lifecycleStatus?: LifecycleStatus;
  lifecycle_status?: string;
  publishedAt?: string | null;
  published_at?: string | null;
  deprecatedAt?: string | null;
  deprecated_at?: string | null;
  sunsetDate?: string | null;
  sunset_date?: string | null;
  consumerCount?: number;
  consumer_count?: number;
  createdAt?: string;
  created_at?: string;
  api_name?: string;
  [key: string]: unknown;
}

/** Sunset plan */
export interface SunsetPlan {
  id: string;
  apiVersionId: string;
  targetVersionId: string;
  sunsetDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  migrationGuide: Record<string, unknown> | null;
  activatedAt: string | null;
  createdAt: string;
}

/** Dashboard metrics */
export interface DashboardMetrics {
  totalCalls: number;
  successRate: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  errorsByType: Record<string, number>;
  quotaConsumption: {
    used: number;
    limit: number;
    percentage: number;
  };
  period: {
    start: string;
    end: string;
  };
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

/** Parsed API endpoint */
export interface ApiEndpoint {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: ApiParameter[];
  requestBody?: Record<string, unknown>;
  responses: Record<string, unknown>;
}

/** API parameter */
export interface ApiParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required: boolean;
  schema: Record<string, unknown>;
}

/** Parsed API definition (from OpenAPI spec) */
export interface ParsedApiDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  endpoints: ApiEndpoint[];
  schemas: Record<string, unknown>;
}
