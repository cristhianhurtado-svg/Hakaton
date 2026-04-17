import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';

// Middleware
import { securityHeaders } from './middleware/security-headers';
import { correlationIdMiddleware } from './middleware/correlation-id';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter, dynamicThrottler } from './middleware/rate-limiter';

// Routers
import { healthRouter } from './modules/health/health.router';
import { onboardingRouter } from './modules/onboarding/onboarding.router';
import { catalogRouter } from './modules/catalog/catalog.router';
import { credentialsRouter } from './modules/credentials/credentials.router';
import { analyticsRouter } from './modules/analytics/analytics.router';
import { sandboxRouter, sandboxLogsRouter } from './modules/sandbox/sandbox.router';
import { legacyFacadeRouter } from './modules/legacy-facade/legacy-facade.router';
import { mcpRouter } from './modules/mcp/mcp.router';
import { openapiParserRouter } from './modules/openapi-parser/openapi-parser.router';
import { partnerManagerRouter } from './modules/partner-manager/partner-manager.router';
import { auditRouter } from './modules/audit/audit.router';
import { notificationsRouter } from './modules/notifications/notifications.router';
import { versionGovernorRouter } from './modules/version-governor/version-governor.router';
import { sdkGeneratorRouter } from './modules/sdk-generator/sdk-generator.router';
import { authRouter } from './modules/auth/auth.router';

export function createApp() {
  const app = express();

  // ─── Global Middleware ───────────────────────────────────────
  app.use(securityHeaders);
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  }));
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(correlationIdMiddleware);
  app.use(dynamicThrottler());

  // ─── Health Checks (no auth) — Req 12.3 ─────────────────────
  app.use('/health', healthRouter);

  // ─── Public Routes ──────────────────────────────────────────
  app.use('/v1/api/auth', authRouter);
  app.use('/v1/api/onboarding', onboardingRouter);
  app.use('/v1/api/catalog', catalogRouter);

  // ─── Authenticated Partner Routes ───────────────────────────
  app.use('/v1/api/credentials', credentialsRouter);
  app.use('/v1/api/analytics', analyticsRouter);
  app.use('/v1/api/notifications', notificationsRouter);
  app.use('/v1/api/sdks', sdkGeneratorRouter);
  app.use('/v1/api/sandbox', sandboxLogsRouter);

  // ─── Data Plane Routes ──────────────────────────────────────
  app.use('/v1/sandbox', sandboxRouter);
  app.use('/v1/api/legacy', legacyFacadeRouter);
  app.use('/v1/mcp', mcpRouter);

  // ─── Admin Routes ───────────────────────────────────────────
  app.use('/v1/api/admin/specs', openapiParserRouter);
  app.use('/v1/api/admin/partners', partnerManagerRouter);
  app.use('/v1/api/admin/audit', auditRouter);
  app.use('/v1/api/admin/versions', versionGovernorRouter);
  app.use('/v1/api/admin/sdks', sdkGeneratorRouter);

  // ─── 404 Handler ────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      title: 'Recurso no encontrado',
      status: 404,
      detail: 'La ruta solicitada no existe',
    });
  });

  // ─── Error Handler — RFC 7807 ──────────────────────────────
  app.use(errorHandler);

  return app;
}
