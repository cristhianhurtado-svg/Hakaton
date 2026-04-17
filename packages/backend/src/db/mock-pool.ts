import { logger } from '../lib/logger';
import { generateSeedData } from './seed-data';

/**
 * In-memory mock database for local development without PostgreSQL.
 * Stores data in Maps, simulates basic SQL operations.
 * Auto-seeds with rich relational dummy data on startup.
 */

type Row = Record<string, unknown>;

const tables = new Map<string, Row[]>();

/** Get raw table data for direct computation (used by analytics in mock mode) */
export function getMockTable(tableName: string): Row[] {
  return tables.get(tableName) || [];
}

/** Initialize mock tables and seed with dummy data */
function initTables() {
  const tableNames = [
    'portal.partners',
    'portal.applications',
    'portal.onboarding_progress',
    'catalog.api_categories',
    'catalog.api_definitions',
    'catalog.api_versions',
    'catalog.api_subscriptions',
    'catalog.sunset_plans',
    'catalog.sdk_packages',
    'credentials.credentials',
    'audit.audit_logs',
    'audit.partner_access_log',
    'notifications.notifications',
    'notifications.notification_deliveries',
    'notifications.notification_preferences',
    // Sandbox-specific tables
    'sandbox.quotes',
    'sandbox.policies',
    'sandbox.claims',
  ];

  for (const name of tableNames) {
    if (!tables.has(name)) {
      tables.set(name, []);
    }
  }

  // Seed API categories
  const categories = tables.get('catalog.api_categories')!;
  if (categories.length === 0) {
    const seeds = [
      { name: 'Cotización', slug: 'cotizacion', description: 'APIs para cotización de productos de seguros', business_domain: 'Comercial', sort_order: 1 },
      { name: 'Emisión', slug: 'emision', description: 'APIs para emisión y gestión de pólizas', business_domain: 'Operaciones', sort_order: 2 },
      { name: 'Siniestros', slug: 'siniestros', description: 'APIs para reporte y seguimiento de siniestros', business_domain: 'Siniestros', sort_order: 3 },
      { name: 'Recaudo', slug: 'recaudo', description: 'APIs para gestión de pagos y recaudo de primas', business_domain: 'Financiero', sort_order: 4 },
      { name: 'Consultas', slug: 'consultas', description: 'APIs para consulta de información', business_domain: 'Servicio', sort_order: 5 },
      { name: 'Autenticación', slug: 'autenticacion', description: 'APIs de autenticación y gestión de identidad', business_domain: 'Seguridad', sort_order: 6 },
      { name: 'Notificaciones', slug: 'notificaciones', description: 'APIs para envío de notificaciones multicanal', business_domain: 'Comunicación', sort_order: 7 },
      { name: 'ACORD', slug: 'acord', description: 'APIs compatibles con estándar ACORD', business_domain: 'Estándares', sort_order: 8 },
    ];
    for (const seed of seeds) {
      categories.push({
        id: crypto.randomUUID(),
        ...seed,
        created_at: new Date(),
      });
    }
  }

  // ─── Seed relational dummy data ─────────────────────────────
  const seed = generateSeedData();

  const partnersTable = tables.get('portal.partners')!;
  if (partnersTable.length === 0) {
    partnersTable.push(...seed.partners);
    tables.get('portal.applications')!.push(...seed.applications);
    tables.get('credentials.credentials')!.push(...seed.credentials);
    tables.get('catalog.api_definitions')!.push(...seed.apiDefinitions);
    tables.get('catalog.api_versions')!.push(...seed.apiVersions);
    tables.get('audit.audit_logs')!.push(...seed.auditLogs);
    tables.get('audit.partner_access_log')!.push(...seed.partnerAccessLogs);
    tables.get('notifications.notifications')!.push(...seed.notifications);
    tables.get('notifications.notification_deliveries')!.push(...seed.notificationDeliveries);
    tables.get('sandbox.quotes')!.push(...seed.quotes);
    tables.get('sandbox.policies')!.push(...seed.policies);
    tables.get('sandbox.claims')!.push(...seed.claims);

    logger.info('Seed data loaded', {
      partners: seed.partners.length,
      applications: seed.applications.length,
      credentials: seed.credentials.length,
      apis: seed.apiDefinitions.length,
      versions: seed.apiVersions.length,
      auditLogs: seed.auditLogs.length,
      notifications: seed.notifications.length,
      quotes: seed.quotes.length,
      policies: seed.policies.length,
      claims: seed.claims.length,
    });
  }

  logger.info('Mock database initialized', { tables: tableNames.length });
}

initTables();

/** Simple SQL parser for mock operations */
function parseInsert(text: string, params: unknown[]): { table: string; row: Row } | null {
  const match = text.match(/INSERT\s+INTO\s+([\w.]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
  if (!match) return null;

  const table = match[1];
  const columns = match[2].split(',').map((c) => c.trim());
  const row: Row = {};

  let paramIdx = 0;
  const valueParts = match[3].split(',').map((v) => v.trim());

  for (let i = 0; i < columns.length; i++) {
    const val = valueParts[i];
    if (val && val.startsWith('$')) {
      row[columns[i]] = params[paramIdx++];
    } else if (val === 'NOW()') {
      row[columns[i]] = new Date();
    } else if (val?.startsWith("'")) {
      row[columns[i]] = val.replace(/'/g, '');
    } else {
      row[columns[i]] = params[paramIdx++];
    }
  }

  return { table, row };
}

function parseSelect(text: string, params: unknown[]): { table: string; conditions: Array<{ col: string; val: unknown }> } | null {
  const fromMatch = text.match(/FROM\s+([\w.]+)/i);
  if (!fromMatch) return null;

  const table = fromMatch[1];
  const conditions: Array<{ col: string; val: unknown }> = [];

  const whereMatch = text.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|\s+GROUP|\s*$)/is);
  if (whereMatch) {
    const paramRegex = /([\w.]+)\s*=\s*\$(\d+)/g;
    let m;
    while ((m = paramRegex.exec(whereMatch[1])) !== null) {
      const colName = m[1].split('.').pop()!;
      const paramIndex = parseInt(m[2], 10) - 1;
      conditions.push({ col: colName, val: params[paramIndex] });
    }
  }

  return { table, conditions };
}

/** Mock pool that mimics pg Pool interface */
export const mockPool = {
  async query(text: string, params?: unknown[]): Promise<{ rows: Row[]; rowCount: number }> {
    const normalizedText = text.replace(/\s+/g, ' ').trim();
    const safeParams = params || [];

    // SELECT 1 / SELECT NOW() — health checks
    if (/^SELECT\s+(1|NOW\(\))/i.test(normalizedText)) {
      return { rows: [{ now: new Date() }], rowCount: 1 };
    }

    // INSERT
    if (/^INSERT/i.test(normalizedText)) {
      const parsed = parseInsert(normalizedText, safeParams);
      if (parsed) {
        const tableData = tables.get(parsed.table);
        if (tableData) {
          tableData.push(parsed.row);
          return { rows: [parsed.row], rowCount: 1 };
        }
      }
      return { rows: [], rowCount: 0 };
    }

    // UPDATE
    if (/^UPDATE/i.test(normalizedText)) {
      const tableMatch = normalizedText.match(/UPDATE\s+([\w.]+)/i);
      if (tableMatch) {
        const table = tableMatch[1];
        const tableData = tables.get(table);
        if (tableData) {
          const parsed = parseSelect(normalizedText, safeParams);
          if (parsed && parsed.conditions.length > 0) {
            const updated: Row[] = [];
            for (const row of tableData) {
              const matches = parsed.conditions.every((c) => row[c.col] === c.val);
              if (matches) {
                updated.push(row);
              }
            }
            return { rows: updated, rowCount: updated.length };
          }
        }
      }
      return { rows: [], rowCount: 0 };
    }

    // SELECT with COUNT
    if (/SELECT\s+COUNT/i.test(normalizedText)) {
      const parsed = parseSelect(normalizedText, safeParams);
      if (parsed) {
        const tableData = tables.get(parsed.table) || [];
        let filtered = tableData;
        if (parsed.conditions.length > 0) {
          filtered = tableData.filter((row) =>
            parsed.conditions.every((c) => row[c.col] === c.val)
          );
        }
        return { rows: [{ count: String(filtered.length) }], rowCount: 1 };
      }
      return { rows: [{ count: '0' }], rowCount: 1 };
    }

    // SELECT
    if (/^SELECT/i.test(normalizedText)) {
      const parsed = parseSelect(normalizedText, safeParams);
      if (parsed) {
        const tableData = tables.get(parsed.table) || [];
        let filtered = tableData;
        if (parsed.conditions.length > 0) {
          filtered = tableData.filter((row) =>
            parsed.conditions.every((c) => row[c.col] === c.val)
          );
        }

        // Handle LIMIT
        const limitMatch = normalizedText.match(/LIMIT\s+\$?(\d+)/i);
        if (limitMatch) {
          const limit = parseInt(limitMatch[1], 10) || 20;
          filtered = filtered.slice(0, limit);
        }

        return { rows: filtered, rowCount: filtered.length };
      }
      return { rows: [], rowCount: 0 };
    }

    // DELETE
    if (/^DELETE/i.test(normalizedText)) {
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 };
  },

  async connect() {
    return {
      query: mockPool.query,
      release: () => {},
    };
  },

  async end() {
    logger.info('Mock pool closed');
  },

  on(_event: string, _handler: (...args: unknown[]) => void) {
    // no-op
  },
};
