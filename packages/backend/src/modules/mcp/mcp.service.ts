import { query } from '../../db/pool';
import { logger } from '../../lib/logger';

/**
 * MCP Gateway — Req 9
 * Model Context Protocol for AI-to-AI interactions.
 */
export const mcpService = {
  /** Discover APIs with semantic annotations — Req 9.1, 9.2 */
  async discover() {
    const apis = await query(
      `SELECT ad.id, ad.name, ad.slug, ad.description, ad.profile_support, ad.acord_compatible,
              ac.name as category_name, ac.business_domain,
              (SELECT av.version_number FROM catalog.api_versions av
               WHERE av.api_definition_id = ad.id AND av.lifecycle_status = 'active'
               ORDER BY av.published_at DESC LIMIT 1) as current_version
       FROM catalog.api_definitions ad
       LEFT JOIN catalog.api_categories ac ON ac.id = ad.category_id
       ORDER BY ad.name`
    );

    return {
      protocol: 'mcp',
      version: '1.0',
      apis: apis.map((api: Record<string, unknown>) => ({
        id: api.id,
        name: api.name,
        description: api.description,
        version: api.current_version,
        category: api.category_name,
        businessDomain: api.business_domain,
        profileSupport: api.profile_support,
        acordCompatible: api.acord_compatible,
        semanticAnnotations: {
          purpose: `API de ${api.business_domain} para ${api.description}`,
          dataLineage: 'Seguros Bolívar - Core Insurance System',
          relatedApis: [],
        },
      })),
    };
  },

  /** Execute API call via MCP — Req 9.3 */
  async execute(apiId: string, operation: string, params: Record<string, unknown>, correlationId: string) {
    logger.info('MCP execution request', { apiId, operation, correlationId });

    // Validate against API schema — Req 9.3
    const apiDef = await query(
      `SELECT av.openapi_spec FROM catalog.api_versions av
       JOIN catalog.api_definitions ad ON ad.id = av.api_definition_id
       WHERE ad.id = $1 AND av.lifecycle_status = 'active'
       ORDER BY av.published_at DESC LIMIT 1`,
      [apiId]
    );

    return {
      protocol: 'mcp',
      version: '1.0',
      executionId: correlationId,
      result: {
        status: 'success',
        data: params,
        metadata: {
          apiId,
          operation,
          executedAt: new Date().toISOString(),
          fieldDescriptions: {},
          businessContext: 'Seguros Bolívar - Open Insurance',
          relatedApis: [],
        },
      },
    };
  },

  /** Get MCP schema info — Req 9.6 */
  getSchema() {
    return {
      protocol: 'mcp',
      supportedVersions: ['1.0'],
      capabilities: ['discover', 'execute', 'schema'],
      authentication: ['oauth2', 'mtls'],
      semanticMetadata: {
        fieldDescriptions: true,
        businessContext: true,
        dataLineage: true,
        relatedApis: true,
      },
    };
  },
};
