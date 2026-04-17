/** Rate limiting — Req 7.1, 3.5 */
export const RATE_LIMITS = {
  /** Production rate limits (requests per minute) */
  PRODUCTION: {
    AGIL: 200,
    CORPORATIVO: 1500,
  },
  /** Sandbox rate limits (requests per minute) */
  SANDBOX: {
    AGIL: 100,
    CORPORATIVO: 500,
  },
} as const;

/** Credential expiration — Req 4.4 */
export const CREDENTIAL_EXPIRATION = {
  /** OAuth 2.0 access token TTL in seconds (1 hour) */
  ACCESS_TOKEN_TTL: 3600,
  /** Refresh token TTL in days (30 days) */
  REFRESH_TOKEN_DAYS: 30,
  /** mTLS certificate TTL in days (365 days) */
  MTLS_CERT_DAYS: 365,
  /** Default credential rotation grace period in hours (24h) — Req 4.3 */
  ROTATION_GRACE_HOURS: 24,
  /** Certificate expiration notification threshold in days — Req 4.7 */
  CERT_NOTIFY_DAYS: 30,
  /** Refresh token expiration notification threshold in days — Req 4.7 */
  REFRESH_NOTIFY_DAYS: 7,
} as const;

/** Circuit breaker — Req 5.4, 12.4 */
export const CIRCUIT_BREAKER = {
  /** Consecutive failures before opening circuit */
  FAILURE_THRESHOLD: 3,
  /** Cooldown period in seconds before half-open — Req 12.4 */
  COOLDOWN_SECONDS: 30,
} as const;

/** Gateway timeouts — Req 7.6 */
export const GATEWAY = {
  /** Backend service timeout in seconds */
  BACKEND_TIMEOUT_SECONDS: 15,
  /** Graceful shutdown timeout in seconds — Req 12.5 */
  GRACEFUL_SHUTDOWN_SECONDS: 30,
  /** Health check response time limit in ms — Req 12.3 */
  HEALTH_CHECK_TIMEOUT_MS: 500,
  /** Policy processing latency target in ms — Req 12.10 */
  POLICY_LATENCY_TARGET_MS: 30,
} as const;

/** Analytics — Req 6.4 */
export const ANALYTICS = {
  /** Error rate threshold for alerting (percentage) */
  ERROR_RATE_ALERT_THRESHOLD: 5,
  /** Error rate evaluation window in minutes */
  ERROR_RATE_WINDOW_MINUTES: 5,
  /** Default dashboard time range in hours */
  DEFAULT_DASHBOARD_HOURS: 24,
} as const;

/** Audit — Req 16 */
export const AUDIT = {
  /** Hot storage retention in days — Req 16.4 */
  HOT_STORAGE_DAYS: 90,
  /** Anomaly detection threshold (percentage of average) — Req 16.6 */
  ANOMALY_THRESHOLD_PERCENT: 200,
  /** Max report generation time in seconds — Req 16.2 */
  REPORT_GENERATION_TIMEOUT_SECONDS: 30,
  /** Max export time for 1M records in seconds — Req 16.3 */
  EXPORT_TIMEOUT_SECONDS: 60,
} as const;

/** Notifications — Req 14 */
export const NOTIFICATIONS = {
  /** Max retry attempts for failed delivery — Req 14.7 */
  MAX_RETRY_ATTEMPTS: 3,
  /** Maintenance notification advance days — Req 14.2 */
  MAINTENANCE_ADVANCE_DAYS: 7,
  /** Deprecation notification advance months — Req 14.3 */
  DEPRECATION_ADVANCE_MONTHS: 3,
} as const;

/** Version governance — Req 17 */
export const VERSION_GOVERNANCE = {
  /** Minimum sunset date advance in months — Req 17.2 */
  MIN_SUNSET_MONTHS: 3,
} as const;

/** Pagination defaults */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;
