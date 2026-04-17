import { environment } from '../../../environments/environment';

/**
 * Centralized API URL configuration.
 * Dev:  proxied through http://localhost:4200/api/v1
 * Prod: ESPv2 gateway URL
 */
const API_BASE = environment.apiBaseUrl;

export const MICROSERVICES = {
  catalog: `${API_BASE}/catalog`,
  credentials: `${API_BASE}/credentials`,
  analytics: `${API_BASE}/analytics`,
  notifications: `${API_BASE}/notifications`,
  sandbox: `${API_BASE}/sandbox`,
  partners: `${API_BASE}/partners`,
  audit: `${API_BASE}/audit`,
  versions: `${API_BASE}/versions`,
  specs: `${API_BASE}/specs`,
  onboarding: `${API_BASE}/onboarding`,
  health: `${API_BASE}/health`,
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
