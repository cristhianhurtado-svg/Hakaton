import { query, queryOne } from '../../db/pool';
import type { ListApisInput } from '@conecta2/shared';

export interface ApiDefinitionRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  category_id: string;
  profile_support: string;
  acord_compatible: boolean;
  acord_message_types: string[] | null;
  current_version: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApiCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  business_domain: string;
  sort_order: number;
}

export const catalogRepository = {
  /** List APIs with filtering and pagination — Req 2.1, 2.6 */
  async listApis(filters: ListApisInput) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`ad.category_id = $${paramIndex++}`);
      params.push(filters.category);
    }
    if (filters.profileSupport) {
      conditions.push(`(ad.profile_support = $${paramIndex++} OR ad.profile_support = 'both')`);
      params.push(filters.profileSupport);
    }
    if (filters.lifecycleStatus) {
      conditions.push(`av.lifecycle_status = $${paramIndex++}`);
      params.push(filters.lifecycleStatus);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (filters.page - 1) * filters.pageSize;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT ad.id) as count
       FROM catalog.api_definitions ad
       LEFT JOIN catalog.api_versions av ON av.api_definition_id = ad.id
       ${whereClause}`,
      params
    );

    const totalItems = parseInt(countResult[0]?.count || '0', 10);

    const rows = await query<ApiDefinitionRow>(
      `SELECT DISTINCT ad.*, 
              (SELECT av2.version_number FROM catalog.api_versions av2 
               WHERE av2.api_definition_id = ad.id AND av2.lifecycle_status = 'active' 
               ORDER BY av2.published_at DESC LIMIT 1) as current_version
       FROM catalog.api_definitions ad
       LEFT JOIN catalog.api_versions av ON av.api_definition_id = ad.id
       ${whereClause}
       ORDER BY ad.name ASC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, filters.pageSize, offset]
    );

    return {
      data: rows,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / filters.pageSize),
      },
    };
  },

  /** Full-text search — Req 2.2 */
  async searchApis(queryText: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM catalog.api_definitions
       WHERE search_vector @@ plainto_tsquery('spanish', $1)`,
      [queryText]
    );

    const totalItems = parseInt(countResult[0]?.count || '0', 10);

    const rows = await query<ApiDefinitionRow & { rank: number }>(
      `SELECT ad.*,
              ts_rank(ad.search_vector, plainto_tsquery('spanish', $1)) as rank,
              (SELECT av.version_number FROM catalog.api_versions av 
               WHERE av.api_definition_id = ad.id AND av.lifecycle_status = 'active' 
               ORDER BY av.published_at DESC LIMIT 1) as current_version
       FROM catalog.api_definitions ad
       WHERE ad.search_vector @@ plainto_tsquery('spanish', $1)
       ORDER BY rank DESC
       LIMIT $2 OFFSET $3`,
      [queryText, pageSize, offset]
    );

    return {
      data: rows,
      pagination: { page, pageSize, totalItems, totalPages: Math.ceil(totalItems / pageSize) },
    };
  },

  /** Get API by ID with versions — Req 2.3 */
  async getApiById(apiId: string) {
    return queryOne<ApiDefinitionRow>(
      `SELECT ad.*,
              (SELECT av.version_number FROM catalog.api_versions av 
               WHERE av.api_definition_id = ad.id AND av.lifecycle_status = 'active' 
               ORDER BY av.published_at DESC LIMIT 1) as current_version
       FROM catalog.api_definitions ad
       WHERE ad.id = $1`,
      [apiId]
    );
  },

  /** Get API versions — Req 2.5 */
  async getApiVersions(apiId: string) {
    return query(
      `SELECT * FROM catalog.api_versions
       WHERE api_definition_id = $1
       ORDER BY published_at DESC NULLS LAST`,
      [apiId]
    );
  },

  /** List categories — Req 2.6 */
  async listCategories() {
    return query<ApiCategoryRow>(
      `SELECT * FROM catalog.api_categories ORDER BY sort_order ASC`
    );
  },
};
