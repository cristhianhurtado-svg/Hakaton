-- ============================================================
-- Conecta 2.0 — Initial Database Schema
-- PostgreSQL 15.4+
-- ============================================================

-- ─── Schemas ────────────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS portal;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS credentials;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PORTAL — Partner Management
-- ============================================================

CREATE TABLE portal.partners (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name  VARCHAR(200) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  email_domain  VARCHAR(255) NOT NULL,
  profile_type  VARCHAR(20)  NOT NULL CHECK (profile_type IN ('agil', 'corporativo', 'dual')),
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  company_data  JSONB        NOT NULL DEFAULT '{}',
  roles         TEXT[]       NOT NULL DEFAULT ARRAY['Partner_Viewer'],
  verification_token UUID,
  last_activity_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partners_email_domain ON portal.partners (email_domain);
CREATE INDEX idx_partners_status       ON portal.partners (status);
CREATE INDEX idx_partners_profile_type ON portal.partners (profile_type);

CREATE TABLE portal.applications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id    UUID         NOT NULL REFERENCES portal.partners(id) ON DELETE CASCADE,
  name          VARCHAR(100) NOT NULL,
  description   VARCHAR(500),
  status        VARCHAR(20)  NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'revoked')),
  environment   VARCHAR(20)  NOT NULL DEFAULT 'sandbox'
                  CHECK (environment IN ('sandbox', 'production')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_partner ON portal.applications (partner_id);

CREATE TABLE portal.onboarding_progress (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id              UUID        NOT NULL UNIQUE REFERENCES portal.partners(id) ON DELETE CASCADE,
  profile_type            VARCHAR(20) NOT NULL,
  steps_completed         JSONB       NOT NULL DEFAULT '[]',
  steps_remaining         JSONB       NOT NULL DEFAULT '[]',
  first_api_call_completed BOOLEAN    NOT NULL DEFAULT FALSE,
  started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at            TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATALOG — API Definitions & Versions
-- ============================================================

CREATE TABLE catalog.api_categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL UNIQUE,
  slug            VARCHAR(100) NOT NULL UNIQUE,
  description     TEXT         NOT NULL DEFAULT '',
  business_domain VARCHAR(100) NOT NULL,
  sort_order      INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE catalog.api_definitions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(200) NOT NULL,
  slug                VARCHAR(200) NOT NULL UNIQUE,
  description         TEXT         NOT NULL DEFAULT '',
  category_id         UUID         REFERENCES catalog.api_categories(id),
  profile_support     VARCHAR(20)  NOT NULL DEFAULT 'both'
                        CHECK (profile_support IN ('agil', 'corporativo', 'both')),
  acord_compatible    BOOLEAN      NOT NULL DEFAULT FALSE,
  acord_message_types TEXT[],
  search_vector       TSVECTOR,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_definitions_category ON catalog.api_definitions (category_id);
CREATE INDEX idx_api_definitions_search   ON catalog.api_definitions USING GIN (search_vector);
CREATE INDEX idx_api_definitions_slug     ON catalog.api_definitions (slug);

-- Trigger to keep search_vector updated
CREATE OR REPLACE FUNCTION catalog.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('spanish', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_api_definitions_search
  BEFORE INSERT OR UPDATE OF name, description ON catalog.api_definitions
  FOR EACH ROW EXECUTE FUNCTION catalog.update_search_vector();

CREATE TABLE catalog.api_versions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_definition_id   UUID         NOT NULL REFERENCES catalog.api_definitions(id) ON DELETE CASCADE,
  version_number      VARCHAR(50)  NOT NULL,
  lifecycle_status    VARCHAR(20)  NOT NULL DEFAULT 'draft'
                        CHECK (lifecycle_status IN ('draft', 'staging', 'active', 'deprecated', 'sunset')),
  openapi_spec        JSONB,
  parsed_definition   JSONB,
  published_at        TIMESTAMPTZ,
  published_by        UUID,
  deprecated_at       TIMESTAMPTZ,
  sunset_date         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (api_definition_id, version_number)
);

CREATE INDEX idx_api_versions_definition ON catalog.api_versions (api_definition_id);
CREATE INDEX idx_api_versions_status     ON catalog.api_versions (lifecycle_status);

CREATE TABLE catalog.api_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id          UUID         NOT NULL REFERENCES portal.partners(id) ON DELETE CASCADE,
  api_definition_id   UUID         NOT NULL REFERENCES catalog.api_definitions(id) ON DELETE CASCADE,
  status              VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'suspended', 'revoked')),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (partner_id, api_definition_id)
);

CREATE TABLE catalog.sunset_plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_version_id    UUID         NOT NULL REFERENCES catalog.api_versions(id) ON DELETE CASCADE,
  target_version_id UUID         NOT NULL REFERENCES catalog.api_versions(id),
  sunset_date       TIMESTAMPTZ  NOT NULL,
  status            VARCHAR(20)  NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  migration_guide   JSONB,
  created_by        UUID,
  activated_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE catalog.sdk_packages (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_version_id    UUID         NOT NULL REFERENCES catalog.api_versions(id) ON DELETE CASCADE,
  language          VARCHAR(30)  NOT NULL CHECK (language IN ('javascript', 'python', 'java')),
  package_version   VARCHAR(50),
  status            VARCHAR(20)  NOT NULL DEFAULT 'generating'
                      CHECK (status IN ('generating', 'ready', 'failed')),
  s3_artifact_key   VARCHAR(500),
  error_message     TEXT,
  generated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (api_version_id, language)
);

-- ============================================================
-- CREDENTIALS
-- ============================================================

CREATE TABLE credentials.credentials (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id          UUID         NOT NULL REFERENCES portal.partners(id) ON DELETE CASCADE,
  application_id      UUID         NOT NULL REFERENCES portal.applications(id) ON DELETE CASCADE,
  credential_type     VARCHAR(10)  NOT NULL CHECK (credential_type IN ('oauth2', 'mtls')),
  client_id           VARCHAR(100) NOT NULL UNIQUE,
  client_secret_hash  VARCHAR(255),
  status              VARCHAR(20)  NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'rotated', 'revoked', 'expired')),
  expires_at          TIMESTAMPTZ  NOT NULL,
  grace_period_end    TIMESTAMPTZ,
  revoked_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_credentials_partner     ON credentials.credentials (partner_id);
CREATE INDEX idx_credentials_application ON credentials.credentials (application_id);
CREATE INDEX idx_credentials_client_id   ON credentials.credentials (client_id);
CREATE INDEX idx_credentials_status      ON credentials.credentials (status);

-- ============================================================
-- AUDIT
-- ============================================================

CREATE TABLE audit.audit_logs (
  id                BIGSERIAL PRIMARY KEY,
  partner_id        UUID         NOT NULL,
  application_id    UUID,
  api_endpoint      VARCHAR(500) NOT NULL,
  http_method       VARCHAR(10)  NOT NULL,
  response_status   INT          NOT NULL,
  correlation_id    UUID         NOT NULL,
  response_time_ms  INT          NOT NULL,
  request_metadata  JSONB,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_partner    ON audit.audit_logs (partner_id);
CREATE INDEX idx_audit_logs_created    ON audit.audit_logs (created_at);
CREATE INDEX idx_audit_logs_endpoint   ON audit.audit_logs (api_endpoint);
CREATE INDEX idx_audit_logs_status     ON audit.audit_logs (response_status);
CREATE INDEX idx_audit_logs_correlation ON audit.audit_logs (correlation_id);

-- Partitioning hint: in production, partition by created_at (monthly)
-- and set up retention policy for 90-day hot storage (Req 16.4)

CREATE TABLE audit.partner_access_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id      UUID         NOT NULL,
  application_id  UUID,
  admin_id        UUID         NOT NULL,
  action          VARCHAR(50)  NOT NULL,
  reason          TEXT         NOT NULL,
  previous_state  JSONB        NOT NULL,
  new_state       JSONB        NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partner_access_log_partner ON audit.partner_access_log (partner_id);
CREATE INDEX idx_partner_access_log_admin   ON audit.partner_access_log (admin_id);
CREATE INDEX idx_partner_access_log_created ON audit.partner_access_log (created_at);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications.notifications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type VARCHAR(30)  NOT NULL
                      CHECK (notification_type IN ('new_version', 'maintenance', 'deprecation', 'credential_expiry', 'access_change')),
  subject           VARCHAR(500) NOT NULL,
  body              TEXT         NOT NULL,
  metadata          JSONB,
  scheduled_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications.notification_deliveries (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_id   UUID         NOT NULL REFERENCES notifications.notifications(id) ON DELETE CASCADE,
  partner_id        UUID         NOT NULL,
  channel           VARCHAR(20)  NOT NULL CHECK (channel IN ('email', 'dashboard', 'webhook')),
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'delivered', 'failed')),
  retry_count       INT          NOT NULL DEFAULT 0,
  error_message     TEXT,
  delivered_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_partner ON notifications.notification_deliveries (partner_id);
CREATE INDEX idx_notification_deliveries_status  ON notifications.notification_deliveries (status);

CREATE TABLE notifications.notification_preferences (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id        UUID         NOT NULL UNIQUE REFERENCES portal.partners(id) ON DELETE CASCADE,
  email_enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
  dashboard_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
  webhook_enabled   BOOLEAN      NOT NULL DEFAULT FALSE,
  webhook_url       VARCHAR(500),
  webhook_validated BOOLEAN      NOT NULL DEFAULT FALSE,
  subscribed_apis   JSONB        NOT NULL DEFAULT '[]',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — API Categories
-- ============================================================

INSERT INTO catalog.api_categories (id, name, slug, description, business_domain, sort_order) VALUES
  (uuid_generate_v4(), 'Cotización',       'cotizacion',       'APIs para cotización de productos de seguros',           'Comercial',    1),
  (uuid_generate_v4(), 'Emisión',          'emision',          'APIs para emisión y gestión de pólizas',                 'Operaciones',  2),
  (uuid_generate_v4(), 'Siniestros',       'siniestros',       'APIs para reporte y seguimiento de siniestros',          'Siniestros',   3),
  (uuid_generate_v4(), 'Recaudo',          'recaudo',          'APIs para gestión de pagos y recaudo de primas',         'Financiero',   4),
  (uuid_generate_v4(), 'Consultas',        'consultas',        'APIs para consulta de información de pólizas y clientes','Servicio',     5),
  (uuid_generate_v4(), 'Autenticación',    'autenticacion',    'APIs de autenticación y gestión de identidad',           'Seguridad',    6),
  (uuid_generate_v4(), 'Notificaciones',   'notificaciones',   'APIs para envío de notificaciones multicanal',           'Comunicación', 7),
  (uuid_generate_v4(), 'ACORD',            'acord',            'APIs compatibles con estándar ACORD para interoperabilidad','Estándares', 8);
