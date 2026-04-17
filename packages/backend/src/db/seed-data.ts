/**
 * ============================================================
 * Conecta 2.0 — Seed Data Generator
 * Genera data dummy relacional para todos los módulos del portal.
 *
 * Contexto: Colombia (COP, NIT, CC, placas ABC-123)
 * PII: Cero datos reales — todo ficticio
 * Edge Cases: ~20% datos con errores/estados anómalos
 * ============================================================
 */

type Row = Record<string, unknown>;

// ─── Helpers ────────────────────────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCOP(min: number, max: number): number {
  return Math.round(randomInt(min, max) / 1000) * 1000;
}

function randomPlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l = () => letters[randomInt(0, 25)];
  return `${l()}${l()}${l()}-${randomInt(100, 999)}`;
}

function randomNIT(): string {
  return `${randomInt(800, 999)}${randomInt(100000, 999999)}-${randomInt(0, 9)}`;
}

function randomCC(): string {
  return `${randomInt(10, 99)}${randomInt(100000, 999999)}`;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86400000);
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86400000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 3600000);
}

// ─── Fake Name Generators (Colombia context) ────────────────

const FIRST_NAMES = [
  'Santiago', 'Valentina', 'Sebastián', 'Isabella', 'Mateo', 'Sofía',
  'Nicolás', 'Mariana', 'Samuel', 'Gabriela', 'Daniel', 'Camila',
  'Alejandro', 'Laura', 'Andrés', 'Natalia', 'Felipe', 'Carolina',
  'Juan Pablo', 'María José', 'Carlos', 'Andrea', 'Diego', 'Paula',
  'Miguel', 'Daniela', 'Tomás', 'Juliana', 'David', 'Ana María',
];

const LAST_NAMES = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández',
  'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera',
  'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Gutiérrez',
  'Ortiz', 'Castillo', 'Vargas', 'Mendoza', 'Rojas', 'Jiménez',
  'Ruiz', 'Herrera', 'Medina', 'Aguilar', 'Peña', 'Castro',
];

const COMPANY_NAMES: Array<{ name: string; type: string }> = [
  { name: 'Finaktiva S.A.S.', type: 'fintech' },
  { name: 'RappiPay Colombia', type: 'fintech' },
  { name: 'Addi Financial', type: 'fintech' },
  { name: 'Bold Pagos S.A.S.', type: 'fintech' },
  { name: 'Nequi (Bancolombia)', type: 'banco' },
  { name: 'Banco Davivienda S.A.', type: 'banco' },
  { name: 'Scotiabank Colpatria', type: 'banco' },
  { name: 'BBVA Colombia', type: 'banco' },
  { name: 'Banco de Bogotá', type: 'banco' },
  { name: 'Lulo Bank S.A.', type: 'banco' },
  { name: 'Tyba Inversiones', type: 'fintech' },
  { name: 'Tributi S.A.S.', type: 'fintech' },
  { name: 'Habi Proptech', type: 'fintech' },
  { name: 'Tpaga S.A.S.', type: 'fintech' },
  { name: 'Concesionario Autogermana', type: 'concesionario' },
  { name: 'Casa Británica Autos', type: 'concesionario' },
  { name: 'Derco Colombia S.A.', type: 'concesionario' },
  { name: 'Suramericana de Seguros', type: 'broker' },
  { name: 'Marsh McLennan Colombia', type: 'broker' },
  { name: 'AON Risk Solutions', type: 'broker' },
  { name: 'Willis Towers Watson CO', type: 'broker' },
  { name: 'Fasecolda Gremio', type: 'broker' },
  { name: 'MiPaquete.com S.A.S.', type: 'fintech' },
  { name: 'Siigo Nube S.A.S.', type: 'fintech' },
  { name: 'Alegra Software', type: 'fintech' },
];

const CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Santa Marta', 'Ibagué',
];

const CAR_BRANDS = [
  'Chevrolet Onix', 'Renault Sandero', 'Kia Picanto', 'Mazda CX-5',
  'Toyota Corolla', 'Nissan Versa', 'Hyundai Tucson', 'Suzuki Swift',
  'Ford Escape', 'Volkswagen Gol', 'BMW X3', 'Mercedes-Benz GLC',
];

function fakeName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)} ${pick(LAST_NAMES)}`;
}

function fakeEmail(company: string): string {
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
  return `api-${slug}@${slug}.com.co`;
}

// ─── Data Generation ────────────────────────────────────────

export interface SeedResult {
  partners: Row[];
  applications: Row[];
  credentials: Row[];
  apiDefinitions: Row[];
  apiVersions: Row[];
  auditLogs: Row[];
  partnerAccessLogs: Row[];
  notifications: Row[];
  notificationDeliveries: Row[];
  quotes: Row[];
  policies: Row[];
  claims: Row[];
}

export function generateSeedData(): SeedResult {
  const partners: Row[] = [];
  const applications: Row[] = [];
  const credentials: Row[] = [];
  const apiDefinitions: Row[] = [];
  const apiVersions: Row[] = [];
  const auditLogs: Row[] = [];
  const partnerAccessLogs: Row[] = [];
  const notifications: Row[] = [];
  const notificationDeliveries: Row[] = [];
  const quotes: Row[] = [];
  const policies: Row[] = [];
  const claims: Row[] = [];

  // ─── 1. Partners (25 aliados) ─────────────────────────────
  const usedCompanies = new Set<number>();
  for (let i = 0; i < 25; i++) {
    let companyIdx: number;
    do { companyIdx = randomInt(0, COMPANY_NAMES.length - 1); } while (usedCompanies.has(companyIdx));
    usedCompanies.add(companyIdx);

    const company = COMPANY_NAMES[companyIdx];
    const isEdgeCase = i >= 20; // 20% edge cases
    const partnerId = uuid();
    const email = fakeEmail(company.name);
    const status = isEdgeCase
      ? pick(['suspended', 'revoked'])
      : pickWeighted(['active', 'pending'], [85, 15]);

    const profileType = company.type === 'banco' ? 'corporativo'
      : company.type === 'broker' ? 'corporativo'
      : 'agil';

    partners.push({
      id: partnerId,
      company_name: company.name,
      email,
      email_domain: email.split('@')[1],
      profile_type: profileType,
      status,
      company_data: JSON.stringify({
        nit: randomNIT(),
        sector: company.type === 'fintech' ? 'Tecnología Financiera'
          : company.type === 'banco' ? 'Banca'
          : company.type === 'broker' ? 'Corretaje de Seguros'
          : 'Automotriz',
        country: 'Colombia',
        city: pick(CITIES),
        website: `https://www.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.co`,
      }),
      roles: status === 'active'
        ? ['Partner_Viewer', 'Partner_Admin']
        : ['Partner_Viewer'],
      last_activity_at: status === 'active' ? hoursAgo(randomInt(1, 72)) : null,
      created_at: daysAgo(randomInt(30, 365)),
      updated_at: daysAgo(randomInt(0, 30)),
    });

    // ─── 1b. Applications per partner (1-3) ──────────────────
    if (status === 'active' || status === 'pending') {
      const appCount = profileType === 'corporativo' ? randomInt(2, 3) : randomInt(1, 2);
      for (let a = 0; a < appCount; a++) {
        const appId = uuid();
        const env = a === 0 ? 'sandbox' : pick(['sandbox', 'production']);
        applications.push({
          id: appId,
          partner_id: partnerId,
          name: `${company.name.split(' ')[0]}-App-${env === 'production' ? 'Prod' : 'Dev'}-${a + 1}`,
          description: `Aplicación ${env} de ${company.name}`,
          status: isEdgeCase ? 'suspended' : 'active',
          environment: env,
          created_at: daysAgo(randomInt(10, 200)),
          updated_at: daysAgo(randomInt(0, 10)),
        });

        // ─── 1c. Credentials per app ──────────────────────────
        const credId = uuid();
        const credStatus = isEdgeCase
          ? pick(['revoked', 'expired'])
          : pickWeighted(['active', 'rotated'], [80, 20]);

        credentials.push({
          id: credId,
          partner_id: partnerId,
          application_id: appId,
          credential_type: profileType === 'corporativo' && env === 'production' ? 'mtls' : 'oauth2',
          client_id: `cli_${uuid().replace(/-/g, '').substring(0, 24)}`,
          client_secret_hash: '***ofuscado***',
          status: credStatus,
          expires_at: credStatus === 'expired' ? daysAgo(randomInt(1, 30)) : daysFromNow(randomInt(30, 365)),
          grace_period_end: credStatus === 'rotated' ? daysFromNow(1) : null,
          revoked_at: credStatus === 'revoked' ? daysAgo(randomInt(1, 15)) : null,
          created_at: daysAgo(randomInt(10, 200)),
          updated_at: daysAgo(randomInt(0, 10)),
        });
      }
    }
  }

  // ─── 2. API Catalog & Versions ──────────────────────────────

  const apiCatalog = [
    { name: 'Cotización Autos', slug: 'cotizacion-autos', desc: 'Cotización de seguros de automóviles con cálculo de prima en tiempo real', category: 'Cotización', profile: 'both', acord: true },
    { name: 'Cotización Vida', slug: 'cotizacion-vida', desc: 'Cotización de seguros de vida individual y colectivo', category: 'Cotización', profile: 'both', acord: true },
    { name: 'Cotización Salud', slug: 'cotizacion-salud', desc: 'Cotización de planes de salud a su medida', category: 'Cotización', profile: 'both', acord: false },
    { name: 'Cotización Hogar', slug: 'cotizacion-hogar', desc: 'Cotización de seguros de hogar y contenidos', category: 'Cotización', profile: 'agil', acord: false },
    { name: 'Emisión Pólizas', slug: 'emision-polizas', desc: 'Emisión y activación de pólizas de seguros', category: 'Emisión', profile: 'both', acord: true },
    { name: 'Consulta Pólizas', slug: 'consulta-polizas', desc: 'Consulta de estado y detalle de pólizas vigentes', category: 'Consultas', profile: 'both', acord: false },
    { name: 'Reporte Siniestros', slug: 'reporte-siniestros', desc: 'Reporte y seguimiento de siniestros FNOL', category: 'Siniestros', profile: 'both', acord: true },
    { name: 'Seguimiento Siniestros', slug: 'seguimiento-siniestros', desc: 'Tracking en tiempo real del estado de siniestros', category: 'Siniestros', profile: 'agil', acord: false },
    { name: 'Recaudo Primas', slug: 'recaudo-primas', desc: 'Gestión de cobro y recaudo de primas', category: 'Recaudo', profile: 'corporativo', acord: false },
    { name: 'SOAT Digital', slug: 'soat-digital', desc: 'Emisión y consulta de SOAT digital', category: 'Emisión', profile: 'agil', acord: false },
    { name: 'Autenticación OAuth', slug: 'autenticacion-oauth', desc: 'Flujo OAuth 2.0 para autenticación de aliados', category: 'Autenticación', profile: 'both', acord: false },
    { name: 'Notificaciones Push', slug: 'notificaciones-push', desc: 'Envío de notificaciones multicanal a asegurados', category: 'Notificaciones', profile: 'corporativo', acord: false },
  ];

  const lifecycleStatuses = ['draft', 'staging', 'active', 'deprecated', 'sunset'] as const;

  for (const api of apiCatalog) {
    const apiId = uuid();
    apiDefinitions.push({
      id: apiId,
      name: api.name,
      slug: api.slug,
      description: api.desc,
      category_id: null, // Will be linked by category name
      category_name: api.category,
      profile_support: api.profile,
      acord_compatible: api.acord,
      acord_message_types: api.acord ? ['ACORD-AL3', 'ACORD-XML'] : null,
      current_version: null,
      search_vector: null,
      created_at: daysAgo(randomInt(90, 400)),
      updated_at: daysAgo(randomInt(0, 30)),
    });

    // Generate 2-4 versions per API
    const versionCount = randomInt(2, 4);
    let latestActive: string | null = null;
    for (let v = 0; v < versionCount; v++) {
      const versionId = uuid();
      const major = v === 0 ? 1 : v;
      const minor = randomInt(0, 5);
      const versionNumber = `${major}.${minor}.0`;
      const isLatest = v === versionCount - 1;
      const status = v === 0 ? 'sunset'
        : v === versionCount - 2 ? 'deprecated'
        : isLatest ? 'active'
        : 'staging';

      if (status === 'active') latestActive = versionNumber;

      apiVersions.push({
        id: versionId,
        api_definition_id: apiId,
        version_number: versionNumber,
        lifecycle_status: status,
        openapi_spec: JSON.stringify({
          openapi: '3.0.3',
          info: { title: api.name, version: versionNumber },
          paths: { [`/v${major}/api/${api.slug}`]: { get: { summary: api.desc } } },
        }),
        parsed_definition: null,
        published_at: status === 'active' ? daysAgo(randomInt(5, 60)) : null,
        published_by: null,
        deprecated_at: status === 'deprecated' ? daysAgo(randomInt(10, 90)) : null,
        sunset_date: status === 'sunset' ? daysAgo(randomInt(1, 30)) : null,
        created_at: daysAgo(randomInt(30, 400)),
      });
    }

    // Update current_version on the definition
    if (latestActive) {
      (apiDefinitions[apiDefinitions.length - 1] as Row).current_version = latestActive;
    }
  }

  // ─── 3. Audit Logs (Analytics) — 500 entries ────────────────

  const activePartners = partners.filter((p) => p.status === 'active');
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  const apiEndpoints = apiCatalog.map((a) => `/v1/api/${a.slug}`);
  const statusCodes = [200, 200, 200, 200, 200, 201, 201, 400, 401, 403, 404, 429, 500, 502, 503];

  for (let i = 0; i < 500; i++) {
    const partner = pick(activePartners);
    const partnerApps = applications.filter((a) => a.partner_id === partner.id);
    const app = partnerApps.length > 0 ? pick(partnerApps) : null;
    const isEdge = i >= 400; // 20% edge cases

    const statusCode = isEdge
      ? pick([429, 500, 502, 503, 401, 403])
      : pick(statusCodes);

    // Latency: mostly < 30ms, some spikes for edge cases
    const latency = isEdge
      ? randomInt(500, 15000) // High latency edge cases
      : statusCode >= 500
        ? randomInt(100, 5000)
        : randomInt(5, 45); // Happy path < 45ms

    auditLogs.push({
      id: i + 1,
      partner_id: partner.id,
      application_id: app?.id || null,
      api_endpoint: pick(apiEndpoints),
      http_method: pick(httpMethods),
      response_status: statusCode,
      correlation_id: uuid(),
      response_time_ms: latency,
      request_metadata: JSON.stringify({
        user_agent: `Conecta2-SDK/${randomInt(1, 3)}.${randomInt(0, 9)}.0`,
        ip: `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`,
        region: pick(CITIES),
      }),
      created_at: hoursAgo(randomInt(0, 24 * 7)), // Last 7 days
    });
  }

  // ─── 4. Partner Access Logs (Admin Audit Trail) ─────────────

  const adminActions = [
    { action: 'approve', reason: 'Documentación verificada y aprobada por el equipo de compliance' },
    { action: 'suspended', reason: 'Consumo anómalo detectado — investigación en curso' },
    { action: 'revoked', reason: 'Incumplimiento de términos de servicio — acceso revocado permanentemente' },
    { action: 'approve', reason: 'Reactivación aprobada tras revisión de seguridad' },
    { action: 'suspended', reason: 'Cuota de API excedida en más del 200% — suspensión temporal' },
    { action: 'approve', reason: 'Onboarding corporativo completado — acceso a producción habilitado' },
  ];

  for (let i = 0; i < 30; i++) {
    const partner = pick(partners);
    const adminAction = pick(adminActions);
    partnerAccessLogs.push({
      id: uuid(),
      partner_id: partner.id,
      application_id: null,
      admin_id: uuid(),
      action: adminAction.action,
      reason: adminAction.reason,
      previous_state: JSON.stringify({ status: pick(['pending', 'active', 'suspended']) }),
      new_state: JSON.stringify({ status: adminAction.action === 'approve' ? 'active' : adminAction.action }),
      created_at: daysAgo(randomInt(0, 90)),
    });
  }

  // ─── 5. Notifications ───────────────────────────────────────

  const notifTemplates = [
    { type: 'maintenance', subject: '🔧 Ventana de mantenimiento programada', body: 'El servicio de Cotización Autos estará en mantenimiento el sábado 26 de abril de 2026 de 2:00 AM a 6:00 AM (COT). Planifique sus integraciones.' },
    { type: 'deprecation', subject: '⚠️ API Cotización Vida v1.0 será deprecada', body: 'La versión 1.0 de Cotización Vida será deprecada el 15 de julio de 2026. Migre a la versión 2.3.0 antes de esa fecha.' },
    { type: 'credential_expiry', subject: '🔑 Sus credenciales OAuth expiran en 7 días', body: 'Las credenciales de su aplicación "App-Prod-1" expiran el 24 de abril de 2026. Rote sus credenciales para evitar interrupciones.' },
    { type: 'access_change', subject: '✅ Acceso a producción aprobado', body: 'Su solicitud de acceso al ambiente de producción ha sido aprobada. Ya puede generar credenciales de producción.' },
    { type: 'new_version', subject: '🚀 Nueva versión: Emisión Pólizas v3.0', body: 'La versión 3.0 de Emisión Pólizas ya está disponible con soporte para SOAT digital y firma electrónica.' },
    { type: 'maintenance', subject: '🔧 Mantenimiento de emergencia — Recaudo Primas', body: 'Debido a una actualización crítica de seguridad, el servicio de Recaudo Primas estará fuera de servicio hoy de 11:00 PM a 1:00 AM.' },
    { type: 'credential_expiry', subject: '🔑 Cuota mensual al 90%', body: 'Ha consumido el 90% de su cuota mensual de 10,000 peticiones. Considere solicitar un aumento de cuota.' },
    { type: 'deprecation', subject: '⚠️ SOAT Digital v1.x — Fin de soporte', body: 'Las versiones 1.x de SOAT Digital dejarán de recibir soporte el 1 de septiembre de 2026. Actualice a v2.0.' },
  ];

  for (let i = 0; i < 40; i++) {
    const notifId = uuid();
    const template = pick(notifTemplates);
    const createdAt = daysAgo(randomInt(0, 60));

    notifications.push({
      id: notifId,
      notification_type: template.type,
      subject: template.subject,
      body: template.body,
      metadata: JSON.stringify({ source: 'system', priority: template.type === 'maintenance' ? 'high' : 'normal' }),
      scheduled_at: template.type === 'maintenance' ? daysFromNow(randomInt(1, 14)) : null,
      created_at: createdAt,
    });

    // Deliver to 2-5 random active partners
    const targetPartners = activePartners.slice(0, randomInt(2, 5));
    for (const partner of targetPartners) {
      const channels = ['dashboard'];
      if (Math.random() > 0.3) channels.push('email');
      if (Math.random() > 0.7) channels.push('webhook');

      for (const channel of channels) {
        notificationDeliveries.push({
          id: uuid(),
          notification_id: notifId,
          partner_id: partner.id,
          channel,
          status: pickWeighted(['delivered', 'pending', 'failed'], [75, 15, 10]),
          retry_count: 0,
          error_message: null,
          delivered_at: channel === 'dashboard' ? createdAt : null,
          created_at: createdAt,
        });
      }
    }
  }

  // ─── 6. Quotes (Cotizaciones) — 100 registros ──────────────

  const products = [
    { name: 'Seguro de Autos', ramo: 'autos', minPrima: 800000, maxPrima: 4500000, minCoverage: 30000000, maxCoverage: 250000000 },
    { name: 'Seguro de Vida', ramo: 'vida', minPrima: 45000, maxPrima: 850000, minCoverage: 50000000, maxCoverage: 500000000 },
    { name: 'Seguro de Salud', ramo: 'salud', minPrima: 41500, maxPrima: 650000, minCoverage: 100000000, maxCoverage: 1000000000 },
    { name: 'Seguro de Hogar', ramo: 'hogar', minPrima: 35000, maxPrima: 280000, minCoverage: 80000000, maxCoverage: 400000000 },
  ];

  for (let i = 0; i < 100; i++) {
    const product = pick(products);
    const partner = pick(activePartners);
    const isEdge = i >= 80;
    const quoteId = uuid();
    const prima = randomCOP(product.minPrima, product.maxPrima);

    quotes.push({
      id: quoteId,
      quote_number: `QT-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      partner_id: partner.id,
      product_name: product.name,
      ramo: product.ramo,
      status: isEdge ? pick(['expired', 'rejected']) : pickWeighted(['accepted', 'pending', 'accepted'], [50, 30, 20]),
      premium_monthly: prima,
      premium_annual: prima * 12,
      coverage_amount: randomCOP(product.minCoverage, product.maxCoverage),
      currency: 'COP',
      valid_until: isEdge ? daysAgo(randomInt(1, 30)).toISOString() : daysFromNow(30).toISOString(),
      insured: JSON.stringify({
        name: `***${fakeName().substring(3)}***`,
        document_type: pick(['CC', 'CC', 'CC', 'CE', 'NIT']),
        document_number: '***masked***',
        city: pick(CITIES),
        email: '***@***.com',
        phone: '***-***-****',
      }),
      vehicle: product.ramo === 'autos' ? JSON.stringify({
        brand: pick(CAR_BRANDS),
        year: randomInt(2018, 2026),
        plate: randomPlate(),
        fasecolda_code: `${randomInt(1000, 9999)}`,
        value: randomCOP(30000000, 250000000),
      }) : null,
      rejection_reason: isEdge ? pick([
        'Riesgo fuera de apetito de suscripción',
        'Documentación incompleta',
        'Vehículo con más de 10 años de antigüedad',
        'Zona geográfica no cubierta',
      ]) : null,
      created_at: daysAgo(randomInt(0, 90)),
    });
  }

  // ─── 7. Policies (Pólizas) — 80 registros ──────────────────

  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');
  for (let i = 0; i < Math.min(80, acceptedQuotes.length); i++) {
    const quote = acceptedQuotes[i];
    const isEdge = i >= 64; // 20% edge cases
    const policyId = uuid();
    const startDate = daysAgo(randomInt(0, 365));
    const endDate = new Date(startDate.getTime() + 365 * 86400000);

    const status = isEdge
      ? pick(['cancelled', 'suspended', 'expired'])
      : 'active';

    policies.push({
      id: policyId,
      policy_number: `POL-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      quote_id: quote.id,
      partner_id: quote.partner_id,
      product_name: quote.product_name,
      ramo: quote.ramo,
      status,
      premium_monthly: quote.premium_monthly,
      premium_annual: quote.premium_annual,
      coverage_amount: quote.coverage_amount,
      currency: 'COP',
      start_date: startDate.toISOString(),
      end_date: status === 'expired' ? daysAgo(randomInt(1, 30)).toISOString() : endDate.toISOString(),
      holder: quote.insured,
      vehicle: quote.vehicle,
      cancellation_reason: status === 'cancelled' ? pick([
        'Solicitud del asegurado',
        'No pago de prima',
        'Fraude detectado en la documentación',
      ]) : null,
      created_at: startDate,
      updated_at: daysAgo(randomInt(0, 30)),
    });
  }

  // ─── 8. Claims (Siniestros) — 50 registros ─────────────────

  const activePolicies = policies.filter((p) => p.status === 'active');
  const claimTypes: Record<string, string[]> = {
    autos: ['Colisión', 'Robo total', 'Daño por granizo', 'Robo de accesorios', 'Pérdida total'],
    vida: ['Fallecimiento', 'Incapacidad permanente', 'Enfermedad grave'],
    salud: ['Hospitalización', 'Cirugía programada', 'Urgencia médica', 'Tratamiento ambulatorio'],
    hogar: ['Incendio', 'Inundación', 'Robo', 'Daño por terremoto'],
  };

  for (let i = 0; i < 50; i++) {
    const policy = pick(activePolicies.length > 0 ? activePolicies : policies);
    const ramo = policy.ramo as string;
    const types = claimTypes[ramo] || ['Otro'];
    const isEdge = i >= 40; // 20% edge cases

    const claimStatus = isEdge
      ? pick(['rejected', 'fraud_investigation'])
      : pickWeighted(['in_process', 'approved', 'paid', 'pending_docs'], [30, 25, 25, 20]);

    const estimatedAmount = randomCOP(500000, Number(policy.coverage_amount) * 0.3);

    claims.push({
      id: uuid(),
      claim_number: `CLM-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      policy_id: policy.id,
      policy_number: policy.policy_number,
      partner_id: policy.partner_id,
      ramo,
      claim_type: pick(types),
      status: claimStatus,
      estimated_amount: estimatedAmount,
      approved_amount: claimStatus === 'paid' ? Math.round(estimatedAmount * (randomInt(60, 100) / 100)) : null,
      currency: 'COP',
      report_date: daysAgo(randomInt(0, 60)).toISOString(),
      incident_date: daysAgo(randomInt(1, 90)).toISOString(),
      incident_city: pick(CITIES),
      description: isEdge
        ? 'Caso bajo investigación por posible fraude — documentación inconsistente'
        : `${pick(types)} reportado en ${pick(CITIES)}. Documentación completa recibida.`,
      rejection_reason: claimStatus === 'rejected' ? pick([
        'Siniestro no cubierto por la póliza',
        'Documentación fraudulenta detectada',
        'Póliza no vigente al momento del siniestro',
        'Exclusión contractual aplicable',
      ]) : null,
      created_at: daysAgo(randomInt(0, 60)),
      updated_at: daysAgo(randomInt(0, 15)),
    });
  }

  return {
    partners,
    applications,
    credentials,
    apiDefinitions,
    apiVersions,
    auditLogs,
    partnerAccessLogs,
    notifications,
    notificationDeliveries,
    quotes,
    policies,
    claims,
  };
}
