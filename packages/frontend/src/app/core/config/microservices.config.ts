import { environment } from '../../../environments/environment';

/**
 * Centralized API URL configuration.
 * Dev:  proxied through http://localhost:4200/api/v1
 * Prod: ESPv2 gateway URL
 */
const API_BASE = environment.apiBaseUrl;

export const MICROSERVICES = {
  // Public / Partner routes
  catalog: `${API_BASE}/catalog`,
  credentials: `${API_BASE}/credentials`,
  analytics: `${API_BASE}/analytics`,
  notifications: `${API_BASE}/notifications`,
  sandbox: `${API_BASE}/sandbox`,
  onboarding: `${API_BASE}/onboarding`,
  health: `${API_BASE}/health`,
  auth: `${API_BASE}/auth`,

  // Admin routes (prefixed with admin/)
  partners: `${API_BASE}/admin/partners`,
  audit: `${API_BASE}/admin/audit`,
  versions: `${API_BASE}/admin/versions`,
  specs: `${API_BASE}/admin/specs`,
  sdks: `${API_BASE}/admin/sdks`,
} as const;

/**
 * Build a full URL for a microservice endpoint.
 * @param service - The microservice key
 * @param path - The endpoint path (e.g., '/search', '/:id')
 */
export function buildUrl(
  service: keyof typeof MICROSERVICES,
  path = ''
): string {
  return `${MICROSERVICES[service]}${path}`;
}
