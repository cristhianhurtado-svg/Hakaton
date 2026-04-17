# Backlog de Implementación Pendiente — Conecta 2.0

> Priorizado por impacto y dependencias
> Última actualización: 17 de abril de 2026

---

## Prioridad 1 — Crítico (Bloqueantes para producción)

### 1.1 Autenticación con Firebase/OIDC
- **Estado:** Se usa login local con JWT para desarrollo
- **Pendiente:**
  - [ ] Configurar Firebase project (apiKey, authDomain, projectId)
  - [ ] Implementar `firebase.auth().signInWithEmailAndPassword()` en AuthService
  - [ ] Implementar `firebase.auth().onAuthStateChanged()` para persistencia de sesión
  - [ ] Validar JWT contra JWKS endpoint del IDP (`IDP_JWKS_URI`)
  - [ ] Implementar refresh token flow con httpOnly cookies
  - [ ] Remover endpoint `/v1/api/auth/login` (solo para dev)
- **Archivos:** `frontend/src/app/core/services/auth.service.ts`, `backend/src/middleware/authenticate.ts`
- **Estimación:** 3-5 días

### 1.2 Base de Datos PostgreSQL Real
- **Estado:** Mock in-memory funcional, migración SQL lista
- **Pendiente:**
  - [ ] Provisionar PostgreSQL 15 (AWS RDS o Docker en staging)
  - [ ] Ejecutar `migrations/001_initial-schema.sql`
  - [ ] Configurar variables de entorno reales (DB_HOST, DB_PASSWORD)
  - [ ] Validar que todos los queries SQL funcionan contra PostgreSQL real
  - [ ] Corregir queries del mock-pool que usan sintaxis simplificada
  - [ ] Implementar connection pooling tuning para producción
- **Archivos:** `backend/src/db/pool.ts`, `backend/.env`
- **Estimación:** 2-3 días

### 1.3 Redis Real
- **Estado:** Mock in-memory funcional
- **Pendiente:**
  - [ ] Provisionar Redis 7 (AWS ElastiCache o Docker en staging)
  - [ ] Configurar `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
  - [ ] Validar rate limiting con Redis real bajo carga
  - [ ] Configurar TTL y eviction policies
- **Estimación:** 1 día

### 1.4 Servicio de Email (AWS SES)
- **Estado:** Placeholder — emails no se envían
- **Pendiente:**
  - [ ] Configurar AWS SES con dominio verificado
  - [ ] Implementar `sendVerificationEmail()` en onboarding.service.ts
  - [ ] Implementar canal email en notifications.service.ts
  - [ ] Templates HTML para emails transaccionales
  - [ ] Configurar `SES_FROM_EMAIL` en variables de entorno
- **Archivos:** `backend/src/modules/onboarding/onboarding.service.ts`, `backend/src/modules/notifications/notifications.service.ts`
- **Estimación:** 3-4 días

---

## Prioridad 2 — Alta (Necesarios para MVP)

### 2.1 Tests Unitarios e Integración
- **Estado:** Jest configurado, 0 tests escritos
- **Pendiente:**
  - [ ] Tests unitarios para cada service (onboarding, catalog, credentials, analytics, etc.)
  - [ ] Tests de integración con Supertest para cada endpoint
  - [ ] Mocks de PostgreSQL y Redis para tests
  - [ ] Fixtures de datos de prueba en `tests/mocks/`
  - [ ] Cobertura mínima 80% (requerimiento SonarQube)
  - [ ] Tests de middleware (authenticate, authorize, rate-limiter, validate)
- **Archivos:** `backend/src/**/__tests__/*.test.ts`
- **Estimación:** 8-10 días
- **Referencia:** `.kiro/steering/reglas-pruebas-fullstack.md`

### 2.2 SDK Generator Real
- **Estado:** Placeholder — `generateSdkForLanguage()` es un `setTimeout(1000)`
- **Pendiente:**
  - [ ] Integrar OpenAPI Generator CLI como subprocess
  - [ ] Generar SDKs reales para JavaScript, Python, Java
  - [ ] Upload de artefactos a S3
  - [ ] Notificación al admin si la generación falla en < 60s
- **Archivos:** `backend/src/modules/sdk-generator/sdk-generator.service.ts`
- **Estimación:** 5-7 días

### 2.3 Normalización snake_case → camelCase
- **Estado:** Backend devuelve snake_case, frontend espera camelCase
- **Pendiente:**
  - [ ] Crear interceptor HTTP en frontend que transforme snake_case → camelCase en responses
  - [ ] O crear middleware en backend que transforme camelCase → snake_case en responses
  - [ ] Eliminar los `|| fallbacks` en los templates Angular
  - [ ] Unificar interfaces de modelos
- **Archivos:** `frontend/src/app/core/interceptors/`, templates de componentes
- **Estimación:** 2-3 días

### 2.4 Docker & Containerización
- **Estado:** docker-compose.yml para PostgreSQL + Redis, sin Dockerfile para la app
- **Pendiente:**
  - [ ] Dockerfile para backend (multi-stage build)
  - [ ] Dockerfile para frontend (nginx + build Angular)
  - [ ] docker-compose.yml completo con los 4 servicios
  - [ ] Health checks en Docker
  - [ ] `.dockerignore` para optimizar builds
- **Estimación:** 2-3 días

---

## Prioridad 3 — Media (Post-MVP)

### 3.1 CI/CD Pipeline
- **Pendiente:**
  - [ ] GitHub Actions workflow: build → test → lint → typecheck
  - [ ] Deploy automático a staging (AWS ECS Fargate)
  - [ ] Deploy a producción con aprobación manual
  - [ ] SonarQube quality gate integration
  - [ ] Notificación a Slack/Teams en fallos
- **Estimación:** 3-5 días

### 3.2 Frontend — Tests de Componentes
- **Pendiente:**
  - [ ] Jasmine + Karma tests para cada componente
  - [ ] Tests de servicios con HttpClientTestingModule
  - [ ] Tests de guards e interceptors
  - [ ] Tests de renderizado condicional (loading, error, empty)
  - [ ] Cobertura mínima 80%
- **Referencia:** `.kiro/steering/reglas-pruebas-fullstack.md`
- **Estimación:** 5-7 días

### 3.3 Observabilidad
- **Pendiente:**
  - [ ] Integrar logs con AWS CloudWatch
  - [ ] Métricas de aplicación (Prometheus/Datadog)
  - [ ] Tracing distribuido (X-Ray o Jaeger)
  - [ ] Alertas de error rate > 5%
  - [ ] Dashboard de operaciones
- **Estimación:** 3-5 días

### 3.4 Seguridad — Hardening
- **Pendiente:**
  - [ ] Migrar tokens de localStorage a httpOnly cookies
  - [ ] Implementar CSRF protection
  - [ ] Rate limiting por IP en endpoints públicos
  - [ ] Audit logging de intentos de login fallidos
  - [ ] Rotación automática de JWT secret
  - [ ] Validación de JWKS con cache
- **Estimación:** 3-5 días

### 3.5 API Documentation (Swagger UI)
- **Pendiente:**
  - [ ] Generar OpenAPI spec del backend
  - [ ] Exponer Swagger UI en `/docs`
  - [ ] Documentar todos los endpoints con ejemplos
  - [ ] Publicar en el portal para aliados
- **Estimación:** 2-3 días

---

## Prioridad 4 — Baja (Nice-to-have)

### 4.1 Frontend — Mejoras UX
- [ ] Gráficos interactivos en Analytics (p-chart de PrimeNG o Recharts)
- [ ] Dark mode toggle
- [ ] Breadcrumbs dinámicos
- [ ] Keyboard shortcuts (Cmd+K para búsqueda)
- [ ] Onboarding wizard interactivo para nuevos partners
- [ ] Export de credenciales como archivo .env
- [ ] Diff visual entre versiones de API

### 4.2 Backend — Mejoras
- [ ] Paginación cursor-based (en vez de offset)
- [ ] Cache de catálogo en Redis (TTL 5 min)
- [ ] Webhook delivery con exponential backoff real
- [ ] Audit log partitioning por mes
- [ ] Retención automática de 90 días (cron job)
- [ ] API versioning headers (Accept-Version)

### 4.3 Infraestructura
- [ ] Terraform/CDK para infraestructura como código
- [ ] AWS WAF para protección DDoS
- [ ] CDN (CloudFront) para frontend
- [ ] Blue/green deployments
- [ ] Database backups automáticos

---

## Deuda Técnica Conocida

| # | Descripción | Impacto | Esfuerzo |
|---|------------|---------|----------|
| DT-1 | `inject()` en componentes Angular en vez de constructor injection (regla frontend) | Bajo | 2h |
| DT-2 | `@import` deprecado en SCSS (Sass 3.0 lo eliminará) — ya migrado a `@use` | Resuelto | — |
| DT-3 | `toPromise()` deprecado en RxJS — migrado a `firstValueFrom` | Resuelto | — |
| DT-4 | Mock pool no soporta JOINs, subqueries, FILTER, PERCENTILE — bypass con mock-services.ts | Medio | N/A (solo dev) |
| DT-5 | `swagger-parser` import requiere cast `as any` por tipos incompatibles | Bajo | 1h |
| DT-6 | Paquete `@seguros-bolivar/ui-bundle` no instalado (requiere JFrog auth) | Medio | Config JFrog |
| DT-7 | Frontend usa fallbacks `cred.client_id \|\| cred.clientId` por inconsistencia snake/camel | Medio | Ver 2.3 |
| DT-8 | No hay `.spec.ts` para ningún componente o servicio | Alto | Ver 2.1, 3.2 |

---

## Métricas de Progreso

| Métrica | Valor Actual | Target |
|---------|-------------|--------|
| Módulos backend implementados | 15/15 | 15/15 ✅ |
| Pantallas frontend implementadas | 13/13 | 13/13 ✅ |
| Schemas Zod definidos | 15/15 | 15/15 ✅ |
| Cobertura de tests | 0% | 80% ❌ |
| Endpoints con data mock | 8/8 | 8/8 ✅ |
| Tablas de BD definidas | 15/15 | 15/15 ✅ |
| Seed data (registros) | ~900 | ~900 ✅ |
| Deuda técnica items | 8 | 0 |
