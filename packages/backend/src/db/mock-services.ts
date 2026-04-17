/**
 * ============================================================
 * Mock Service Layer — Direct data access for development
 * Bypasses SQL parsing, reads directly from in-memory tables.
 * Used when USE_MOCK_DB=true
 * ============================================================
 */

import { getMockTable } from './mock-pool';

type Row = Record<string, unknown>;

// ─── Catalog ────────────────────────────────────────────────

export function mockListApis(filters: {
  category?: string;
  profileSupport?: string;
  lifecycleStatus?: string;
  page?: number;
  pageSize?: number;
}) {
  let apis = getMockTable('catalog.api_definitions');

  if (filters.category) {
    apis = apis.filter((a) => a.category_id === filters.category);
  }
  if (filters.profileSupport) {
    apis = apis.filter(
      (a) => a.profile_support === filters.profileSupport || a.profile_support === 'both'
    );
  }

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const totalItems = apis.length;
  const offset = (page - 1) * pageSize;
  const data = apis.slice(offset, offset + pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export function mockSearchApis(queryText: string, page: number, pageSize: number) {
  const apis = getMockTable('catalog.api_definitions');
  const q = queryText.toLowerCase();
  const filtered = apis.filter(
    (a) =>
      (a.name as string).toLowerCase().includes(q) ||
      (a.description as string).toLowerCase().includes(q)
  );

  const offset = (page - 1) * pageSize;
  return {
    data: filtered.slice(offset, offset + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
  };
}

export function mockGetApiById(apiId: string) {
  return getMockTable('catalog.api_definitions').find((a) => a.id === apiId) || null;
}

export function mockGetApiVersions(apiId: string) {
  return getMockTable('catalog.api_versions')
    .filter((v) => v.api_definition_id === apiId)
    .sort((a, b) => {
      const da = new Date(a.created_at as string).getTime();
      const db = new Date(b.created_at as string).getTime();
      return db - da;
    });
}

export function mockListCategories() {
  return getMockTable('catalog.api_categories').sort(
    (a, b) => (a.sort_order as number) - (b.sort_order as number)
  );
}

// ─── Credentials ────────────────────────────────────────────

export function mockListCredentials(partnerId: string) {
  const creds = getMockTable('credentials.credentials');
  const partnerCreds = creds.filter((c) => c.partner_id === partnerId);
  // If no credentials found for this partner (e.g. admin), return all
  return partnerCreds.length > 0 ? partnerCreds : creds;
}

// ─── Partners ───────────────────────────────────────────────

export function mockListPartners(page: number, pageSize: number) {
  const partners = getMockTable('portal.partners');
  const apps = getMockTable('portal.applications');

  const enriched: Row[] = partners.map((p) => ({
    ...p,
    application_count: apps.filter((a) => a.partner_id === p.id).length,
  }));

  const offset = (page - 1) * pageSize;
  const totalItems = enriched.length;

  return {
    data: enriched
      .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
      .slice(offset, offset + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
    },
  };
}

export function mockGetPartner(partnerId: string) {
  const partners = getMockTable('portal.partners');
  const apps = getMockTable('portal.applications');
  const partner = partners.find((p) => p.id === partnerId);
  if (!partner) return null;

  return {
    ...partner,
    application_count: apps.filter((a) => a.partner_id === partnerId).length,
  };
}

// ─── Notifications ──────────────────────────────────────────

export function mockGetNotifications(partnerId: string, filters: {
  notificationType?: string;
  page?: number;
  pageSize?: number;
}) {
  const notifications = getMockTable('notifications.notifications');
  const deliveries = getMockTable('notifications.notification_deliveries');

  // Join notifications with deliveries
  const joined = deliveries
    .map((d) => {
      const notif = notifications.find((n) => n.id === d.notification_id);
      if (!notif) return null;
      return {
        ...notif,
        channel: d.channel,
        delivery_status: d.status,
        delivered_at: d.delivered_at,
        partner_id: d.partner_id,
      };
    })
    .filter(Boolean) as Row[];

  let filtered = joined;
  if (filters.notificationType) {
    filtered = filtered.filter((n) => n.notification_type === filters.notificationType);
  }

  // Sort by created_at desc
  filtered.sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime());

  const page = filters.page || 1;
  const pageSize = filters.pageSize || 20;
  const offset = (page - 1) * pageSize;

  return {
    data: filtered.slice(offset, offset + pageSize),
    pagination: {
      page,
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
  };
}

// ─── Versions ───────────────────────────────────────────────

export function mockListVersions() {
  const versions = getMockTable('catalog.api_versions');
  const apis = getMockTable('catalog.api_definitions');

  return versions.map((v) => {
    const api = apis.find((a) => a.id === v.api_definition_id);
    return {
      ...v,
      api_name: api?.name || 'Desconocida',
      consumer_count: Math.floor(Math.random() * 50),
    };
  }).sort((a, b) => {
    const na = (a.api_name as string) || '';
    const nb = (b.api_name as string) || '';
    return na.localeCompare(nb);
  });
}

// ─── Sandbox Data ───────────────────────────────────────────

export function mockGetQuotes(partnerId?: string) {
  const quotes = getMockTable('sandbox.quotes');
  return partnerId ? quotes.filter((q) => q.partner_id === partnerId) : quotes;
}

export function mockGetPolicies(partnerId?: string) {
  const policies = getMockTable('sandbox.policies');
  return partnerId ? policies.filter((p) => p.partner_id === partnerId) : policies;
}

export function mockGetClaims(partnerId?: string) {
  const claims = getMockTable('sandbox.claims');
  return partnerId ? claims.filter((c) => c.partner_id === partnerId) : claims;
}
