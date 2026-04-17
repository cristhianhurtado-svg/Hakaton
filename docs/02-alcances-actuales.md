# Alcances Actuales — Conecta 2.0

> Estado de implementación al 17 de abril de 2026

---

## Resumen Ejecutivo

| Capa | Estado | Detalle |
|------|--------|---------|
| **Shared (Tipos/Schemas)** | ✅ Completo | 10 schemas Zod, tipos exportados, constantes RBAC |
| **Backend (API)** | ✅ 95% | 15 módulos implementados, middleware completo, seed data |
| **Frontend (UI)** | ✅ 80% | 13 pantallas, diseño premium, login dev funcional |
| **Base de Datos** | ✅ Schema listo | Migración SQL completa, mock in-memory para dev |
| **Infraestructura** | ⚠️ Parcial | Docker Compose listo, CI/CD pendiente |

---

## Backend — Módulos Implementados

### ✅ Completamente Funcionales

| # | Módulo | Endpoints | Estado | Notas |
|---|--------|-----------|--------|-------|
| 1 | **Auth (Dev)** | `POST /login`, `GET /me` | ✅ | Login local con JWT, sin Firebase |
| 2 | **Onboarding** | `POST /register`, `POST /verify-email`, `GET /progress`, `POST /complete-step` | ✅ | Registro, verificación, pasos de onboarding |
| 3 | **Catálogo** | `GET /apis`, `GET /search`, `GET /apis/:id`, `GET /apis/:id/versions`, `GET /categories` | ✅ | 12 APIs seeded, 8 categorías, búsqueda full-text |
| 4 | **Credenciales** | `GET /`, `POST /oauth`, `POST /mtls/csr`, `POST /:id/rotate`, `POST /:id/revoke` | ✅ | OAuth 2.0 + mTLS, rotación con grace period |
| 5 | **Sandbox** | `ALL /v1/sandbox/*`, `GET /logs` | ✅ | Datos ficticios, PII masking 100% |
| 6 | **Legacy Facade** | `ALL /v1/api/legacy/*` | ✅ | JSON↔SOAP/XML, circuit breaker |
| 7 | **Analytics** | `GET /dashboard`, `GET /metrics`, `GET /alerts`, `POST /export` | ✅ | Métricas P50/P95/P99, alertas, export CSV/JSON |
| 8 | **MCP Gateway** | `POST /discover`, `POST /execute`, `GET /schema` | ✅ | Model Context Protocol para AI-to-AI |
| 9 | **OpenAPI Parser** | `POST /`, `GET /:id`, `GET /:id/export`, `POST /:id/validate`, `GET /:id/versions` | ✅ | Upload, validación, export YAML |
| 10 | **Partner Manager** | `GET /`, `GET /:id`, `PUT /:id/status`, `PUT /:id/apps/:appId/status`, `POST /bulk-action` | ✅ | CRUD, suspensión, revocación, bulk actions |
| 11 | **Auditoría** | `POST /reports`, `GET /dashboard`, `GET /anomalies` | ✅ | Reportes, dashboard real-time, anomaly detection |
| 12 | **Notificaciones** | `GET /`, `GET /preferences`, `PUT /preferences`, `POST /webhooks`, `POST /webhooks/:id/test` | ✅ | Multi-canal (email, dashboard, webhook), retry |
| 13 | **Version Governor** | `GET /`, `POST /`, `POST /:id/promote`, `POST /:id/sunset`, `POST /:id/sunset/activate`, `GET /:id/migration-guide` | ✅ | Lifecycle draft→staging→active→deprecated→sunset |
| 14 | **SDK Generator** | `POST /generate`, `GET /`, `GET /:id/download` | ⚠️ | Estructura lista, generación es placeholder |
| 15 | **Health** | `GET /live`, `GET /ready` | ✅ | Liveness + readiness (DB + Redis) |

### Middleware Stack (100% implementado)

| Middleware | Función |
|-----------|---------|
| `security-headers` | Helmet (HSTS, CSP, X-Frame-Options, Referrer-Policy) |
| `correlation-id` | X-Correlation-ID en cada request |
| `rate-limiter` | Token bucket per-partner (Redis), IP throttler |
| `authenticate` | JWT validation + optional auth |
| `authorize` | RBAC por roles |
| `validate` | Zod schema validation |
| `error-handler` | RFC 7807 Problem Details |

### Infraestructura Backend

| Componente | Estado |
|-----------|--------|
| PostgreSQL pool + transactions | ✅ |
| Redis client + retry strategy | ✅ |
| Circuit breaker (3 fallos, 30s cooldown) | ✅ |
| Winston structured JSON logging | ✅ |
| Graceful shutdown (30s timeout) | ✅ |
| Mock DB in-memory (dev sin Docker) | ✅ |
| Seed data relacional (25 partners, 500 logs, 100 cotizaciones, 50 siniestros) | ✅ |

---

## Frontend — Pantallas Implementadas

### ✅ Funcionales con Data

| Pantalla | Ruta | Datos Visibles |
|----------|------|----------------|
| **Login** | `/auth/login` | Formulario + botones quick-login (Partner/Admin) |
| **Dashboard** | `/dashboard` | 4 metric cards (calls, success rate, P95, quota) + quick actions |
| **Catálogo APIs** | `/catalog` | 12 API cards con búsqueda y filtro por categoría |
| **Credenciales** | `/credentials` | Tabla con 39 credenciales (Client ID, tipo, estado, fechas) |
| **Notificaciones** | `/notifications` | Tabla con 20+ notificaciones (mantenimiento, deprecación, cuota) |
| **Admin Partners** | `/admin/partners` | Tabla con 25 partners (empresa, perfil, estado, apps) |
| **Admin Auditoría** | `/admin/audit` | Dashboard con 500 audit logs, top endpoints, top partners |
| **Admin Versiones** | `/admin/versions` | Tabla con 38 versiones (draft/staging/active/deprecated/sunset) |

### ⚠️ Funcionales (UI lista, data parcial)

| Pantalla | Ruta | Estado |
|----------|------|--------|
| **Analíticas** | `/analytics` | UI completa, métricas del dashboard |
| **Sandbox** | `/sandbox` | Request builder funcional, respuestas ficticias |
| **API Detail** | `/catalog/:apiId` | Tabs de documentación, versiones |
| **Admin Specs** | `/admin/specs` | Formulario de upload OpenAPI |
| **Unauthorized** | `/auth/unauthorized` | Página de acceso denegado |

### Diseño UI

| Aspecto | Estado |
|---------|--------|
| Design tokens Seguros Bolívar (verde #006B44, amarillo #FCE850) | ✅ |
| Sidebar premium (fondo blanco, indicador amarillo activo) | ✅ |
| Header con logo oficial Seguros Bolívar (.webp) | ✅ |
| Metric cards estilo Vercel/Stripe | ✅ |
| PrimeNG components (p-table, p-tag, p-dialog, p-dropdown) | ✅ |
| Responsive (mobile-first, breakpoints 576/768/1024px) | ✅ |
| Skeleton loading states | ✅ |
| Empty states | ✅ |

---

## Shared — Contratos

| Schema | Campos | Validación |
|--------|--------|-----------|
| `registerPartnerSchema` | companyName, email, profileType, contactName, companyData | Zod strict |
| `verifyEmailSchema` | token (UUID) | Zod |
| `listApisSchema` | category, profileSupport, lifecycleStatus, page, pageSize | Zod coerce |
| `searchApisSchema` | query, category, profileSupport, acordCompatible, page, pageSize | Zod |
| `createOAuthCredentialSchema` | applicationId, description | Zod |
| `createMtlsCsrSchema` | applicationId, commonName, organization, country | Zod |
| `rotateCredentialSchema` | gracePeriodHours (1-168, default 24) | Zod |
| `analyticsQuerySchema` | startDate, endDate, apiId, endpoint, httpMethod, statusCode | Zod |
| `auditReportRequestSchema` | partnerId, apiEndpoint, httpMethod, statusCode, startDate, endDate, format | Zod |
| `notificationPreferencesSchema` | emailEnabled, dashboardEnabled, webhookEnabled, webhookUrl | Zod |
| `changePartnerStatusSchema` | status (active/suspended/revoked), reason (min 10 chars) | Zod |
| `bulkActionSchema` | action, entityType, entityIds, reason | Zod |
| `createApiVersionSchema` | apiDefinitionId, versionNumber (semver), openapiSpec | Zod |
| `createSunsetPlanSchema` | sunsetDate, targetVersionId, migrationNotes | Zod |
| `uploadSpecSchema` | name, categoryId, profileSupport, acordCompatible, spec, format | Zod |

---

## Seed Data (Modo Desarrollo)

| Colección | Registros | Descripción |
|-----------|-----------|-------------|
| Partners | 25 | Finaktiva, RappiPay, Davivienda, BBVA, Marsh, etc. |
| Applications | ~40 | 1-3 apps por partner (sandbox/production) |
| Credentials | ~40 | OAuth2 + mTLS, estados variados |
| API Definitions | 12 | Cotización Autos/Vida/Salud/Hogar, Emisión, SOAT, etc. |
| API Versions | ~40 | 2-4 versiones por API, lifecycle completo |
| Audit Logs | 500 | Latencias 5-15000ms, HTTP 200/201/400/401/429/500 |
| Admin Audit | 30 | Aprobaciones, suspensiones, revocaciones |
| Notifications | 40 | Mantenimiento, deprecación, cuota 90%, expiración |
| Quotes | 100 | Cotizaciones en COP, 4 ramos de seguros |
| Policies | ~56 | Pólizas emitidas desde cotizaciones aceptadas |
| Claims | 50 | Siniestros con estados variados (20% edge cases) |
