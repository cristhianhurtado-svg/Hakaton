# Estructura del Proyecto — Conecta 2.0

> Portal de APIs Open Insurance — Seguros Bolívar
> Última actualización: 17 de abril de 2026

---

## Visión General

Conecta 2.0 es un monorepo con 3 paquetes que implementa un Developer Portal para aliados de Seguros Bolívar. Permite a fintechs, bancos, brokers y concesionarios integrar APIs de seguros (cotización, emisión, siniestros, recaudo).

```
Repo nico/
├── docs/                          # Documentación del proyecto
│   ├── 01-estructura-proyecto.md  # Este archivo
│   ├── 02-alcances-actuales.md    # Estado actual de implementación
│   └── 03-backlog-pendiente.md    # Backlog de implementación pendiente
├── packages/
│   ├── backend/                   # API REST (Node.js + Express)
│   ├── frontend/                  # SPA (Angular 19 + PrimeNG)
│   └── shared/                    # Tipos, schemas y constantes compartidas
├── scripts/
│   └── generate-seed-data.py      # Generador de data dummy (Python + Faker)
├── docker-compose.yml             # PostgreSQL 15 + Redis 7
├── package.json                   # Workspace root
└── .kiro/steering/                # Reglas de arquitectura y diseño
```

---

## Paquete: `@conecta2/shared`

Tipos TypeScript, schemas Zod y constantes compartidas entre backend y frontend.

```
packages/shared/src/
├── constants/
│   ├── index.ts
│   ├── limits.ts          # Rate limits, timeouts, umbrales (RATE_LIMITS, CIRCUIT_BREAKER, GATEWAY, etc.)
│   └── roles.ts           # RBAC roles (Partner_Viewer, Partner_Admin, SB_Admin, SB_SuperAdmin)
├── schemas/
│   ├── analytics.schema.ts    # AnalyticsQueryInput, DashboardMetrics, ExportMetricsInput
│   ├── audit.schema.ts        # AuditReportRequest, AuditLogEntry, AuditDashboard
│   ├── auth.schema.ts         # RegisterPartnerInput, VerifyEmailInput, LoginInput, JwtClaims
│   ├── catalog.schema.ts      # SearchApisInput, ListApisInput, ApiCategory, ApiDefinition
│   ├── common.schema.ts       # PaginationInput, ProblemDetails, DateRange
│   ├── credentials.schema.ts  # CreateOAuthCredentialInput, RotateCredentialInput
│   ├── notifications.schema.ts # NotificationPreferences, RegisterWebhookInput
│   ├── openapi-parser.schema.ts # UploadSpecInput, ParsedApiDefinition
│   ├── partner.schema.ts      # ChangePartnerStatusInput, BulkActionInput, PartnerSummary
│   └── version-governor.schema.ts # CreateApiVersionInput, PromoteVersionInput, CreateSunsetPlanInput
├── types/
│   └── index.ts               # Re-exports de todos los tipos inferidos de Zod
└── index.ts                   # Barrel export
```

**Stack:** TypeScript 5.5, Zod 3.x

---

## Paquete: `@conecta2/backend`

API REST con Express.js, arquitectura modular por capas (Router → Controller → Service → Repository).

```
packages/backend/src/
├── app.ts                 # Express app factory, middleware stack, rutas
├── server.ts              # Startup, graceful shutdown (SIGTERM/SIGINT)
├── config.ts              # Variables de entorno (DB, Redis, JWT, AWS, CORS)
├── db/
│   ├── pool.ts            # PostgreSQL pool (pg) con fallback a mock
│   ├── mock-pool.ts       # Base de datos in-memory para desarrollo local
│   ├── mock-services.ts   # Capa de servicios mock (bypass SQL para dev)
│   └── seed-data.ts       # Generador de data dummy relacional (25 partners, 500 logs, etc.)
├── lib/
│   ├── circuit-breaker.ts # Circuit breaker (3 fallos → OPEN → 30s cooldown)
│   ├── errors.ts          # Jerarquía de errores RFC 7807 (AppError, NotFoundError, etc.)
│   ├── logger.ts          # Winston structured JSON logging
│   └── redis.ts           # ioredis client con fallback a mock in-memory
├── middleware/
│   ├── authenticate.ts    # JWT validation (Bearer token)
│   ├── authorize.ts       # RBAC por roles
│   ├── correlation-id.ts  # X-Correlation-ID injection
│   ├── error-handler.ts   # Global error handler RFC 7807
│   ├── rate-limiter.ts    # Token bucket per-partner (Redis) + IP throttler
│   ├── security-headers.ts # Helmet (HSTS, CSP, X-Frame-Options)
│   └── validate.ts        # Zod schema validation middleware
└── modules/
    ├── analytics/         # Dashboard métricas, alertas, export CSV/JSON
    ├── audit/             # Audit logs, reportes, anomaly detection
    ├── auth/              # Login dev (JWT local), /me endpoint
    ├── catalog/           # API definitions, versions, categories, search
    ├── credentials/       # OAuth 2.0, mTLS, rotación, revocación
    ├── health/            # Liveness (/live) y readiness (/ready) probes
    ├── legacy-facade/     # SOAP↔REST bidirectional transformation
    ├── mcp/               # Model Context Protocol gateway (AI-to-AI)
    ├── notifications/     # Lifecycle notifications, webhooks, preferences
    ├── onboarding/        # Partner registration, email verification, steps
    ├── openapi-parser/    # Upload, validate, parse OpenAPI 3.0+ specs
    ├── partner-manager/   # Admin: CRUD partners, status changes, bulk actions
    ├── sandbox/           # Fictional data engine, PII masking
    ├── sdk-generator/     # SDK generation (JS, Python, Java) — placeholder
    └── version-governor/  # API version lifecycle, sunset plans, migration guides
```

**Stack:** Node.js 20 LTS, Express 4.x, TypeScript 5.5, PostgreSQL 15, Redis 7, JWT, Zod, Winston, Helmet

**Patrón por módulo:**
```
modules/<nombre>/
├── <nombre>.router.ts       # Rutas Express con middleware
├── <nombre>.controller.ts   # Request handling (opcional)
├── <nombre>.service.ts      # Lógica de negocio
├── <nombre>.repository.ts   # Acceso a datos (opcional)
├── <nombre>.schema.ts       # Re-exports de schemas (opcional)
└── <nombre>.types.ts        # Tipos locales (opcional)
```

---

## Paquete: `@conecta2/frontend`

SPA Angular 19 con standalone components, PrimeNG, y diseño premium Seguros Bolívar.

```
packages/frontend/src/app/
├── app.component.ts           # Root shell (<router-outlet>)
├── app.config.ts              # Providers: router, httpClient, animations, MessageService
├── app.routes.ts              # Lazy routes con loadComponent + guards
├── core/
│   ├── config/
│   │   └── microservices.config.ts  # URLs centralizadas + buildUrl()
│   ├── guards/
│   │   ├── auth.guard.ts            # CanActivateFn — verifica sesión
│   │   └── admin.guard.ts           # CanActivateFn — verifica rol admin
│   ├── interceptors/
│   │   └── auth.interceptor.ts      # HttpInterceptorFn — Bearer token
│   ├── models/
│   │   ├── api.model.ts             # ApiDefinition, ApiCategory, DashboardMetrics
│   │   ├── credential.model.ts      # Credential, OAuthCreatedResponse
│   │   ├── notification.model.ts    # Notification, AuditLogEntry
│   │   └── partner.model.ts         # PartnerSummary, Application
│   └── services/
│       ├── analytics.service.ts     # getDashboardMetrics, getUsageTimeline
│       ├── auth.service.ts          # login, logout, getToken, restoreSession
│       ├── catalog.service.ts       # listApis, searchApis, getCategories
│       ├── credentials.service.ts   # listCredentials, createOAuth, rotate
│       └── notifications.service.ts # getHistory, getPreferences, webhooks
├── features/
│   ├── admin/
│   │   ├── audit/          # Audit dashboard + logs table
│   │   ├── partners/       # Partners table + status change dialog
│   │   ├── specs/          # OpenAPI spec upload + validation
│   │   └── versions/       # Version lifecycle + promote dialog
│   ├── analytics/          # Metrics cards, latency grid, export
│   ├── auth/
│   │   ├── login/          # Login form + dev quick-login buttons
│   │   └── unauthorized/   # Access denied page
│   ├── catalog/
│   │   └── api-detail/     # API detail with tabs
│   ├── credentials/        # Credentials table + rotate/revoke
│   ├── dashboard/          # Consola de Analítica (4 metric cards + quick actions)
│   ├── notifications/      # Notifications table
│   └── sandbox/            # Request builder + response viewer
└── shared/
    ├── components/
    │   ├── header/         # Top bar con logo, notificaciones, user menu
    │   └── sidebar/        # Navegación lateral (verde/blanco premium)
    └── styles/
        ├── admin-layout.scss    # Layout grid (sidebar + header + content)
        └── theme-bolivar.scss   # Design tokens Seguros Bolívar
```

**Stack:** Angular 19, PrimeNG 17, TypeScript 5.5, SCSS, Inter font

**Rutas:**
| Ruta | Componente | Guard |
|------|-----------|-------|
| `/dashboard` | DashboardComponent | authGuard |
| `/catalog` | CatalogComponent | authGuard |
| `/catalog/:apiId` | ApiDetailComponent | authGuard |
| `/credentials` | CredentialsComponent | authGuard |
| `/sandbox` | SandboxComponent | authGuard |
| `/analytics` | AnalyticsComponent | authGuard |
| `/notifications` | NotificationsComponent | authGuard |
| `/admin/partners` | PartnersAdminComponent | authGuard + adminGuard |
| `/admin/audit` | AuditAdminComponent | authGuard + adminGuard |
| `/admin/versions` | VersionsAdminComponent | authGuard + adminGuard |
| `/admin/specs` | SpecsAdminComponent | authGuard + adminGuard |
| `/auth/login` | LoginComponent | — |

---

## Infraestructura

| Componente | Tecnología | Puerto | Propósito |
|-----------|-----------|--------|-----------|
| Backend API | Node.js + Express | 3000 | API REST |
| Frontend SPA | Angular 19 | 4200 | UI (proxy → backend) |
| PostgreSQL | 15.4 (Docker) | 5432 | Persistencia |
| Redis | 7 (Docker) | 6379 | Rate limiting, cache |

**Modo desarrollo sin Docker:** `USE_MOCK_DB=true` en `.env` activa base de datos in-memory con seed data automática.

---

## Base de Datos

**Schemas PostgreSQL:**
- `portal` — Partners, Applications, Onboarding Progress
- `catalog` — API Definitions, Versions, Categories, Subscriptions, SDK Packages, Sunset Plans
- `credentials` — OAuth 2.0 y mTLS credentials
- `audit` — Audit Logs, Partner Access Log
- `notifications` — Notifications, Deliveries, Preferences

**Migración:** `packages/backend/migrations/001_initial-schema.sql` (15 tablas, índices, triggers, seed de categorías)
