import SwaggerParser from 'swagger-parser';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parser = SwaggerParser as any;
import yaml from 'js-yaml';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../db/pool';
import type { UploadSpecInput } from '@conecta2/shared';
import { NotFoundError, ValidationError } from '../../lib/errors';
import { logger } from '../../lib/logger';

/**
 * OpenAPI Parser — Req 10
 * Parse, validate, render, and version OpenAPI 3.0+ specifications.
 */
export const openapiParserService = {
  /** Upload and parse OpenAPI spec — Req 10.1, 10.2 */
  async uploadSpec(input: UploadSpecInput) {
    let specObject: Record<string, unknown>;

    // Parse YAML or JSON
    try {
      specObject = input.format === 'yaml'
        ? yaml.load(input.spec) as Record<string, unknown>
        : JSON.parse(input.spec);
    } catch (error) {
      throw new ValidationError([{
        field: 'spec',
        message: `Error de parseo ${input.format.toUpperCase()}: ${(error as Error).message}`,
      }]);
    }

    // Validate against OpenAPI 3.0 schema — Req 10.1
    try {
      await parser.validate(specObject);
    } catch (error) {
      const validationErrors = parseSwaggerErrors(error as Error);
      throw new ValidationError(validationErrors);
    }

    // Parse into internal API_Definition — Req 10.1
    const parsed = parseToApiDefinition(specObject);

    // Store in database
    const apiDefId = uuidv4();
    const versionId = uuidv4();
    const versionNumber = (specObject.info as Record<string, unknown>)?.version as string || '1.0.0';

    await query(
      `INSERT INTO catalog.api_definitions (id, name, slug, description, category_id, profile_support, acord_compatible, search_vector, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, to_tsvector('spanish', $2 || ' ' || $4), NOW(), NOW())
       ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()`,
      [
        apiDefId,
        input.name,
        input.name.toLowerCase().replace(/\s+/g, '-'),
        (specObject.info as Record<string, unknown>)?.description || '',
        input.categoryId,
        input.profileSupport,
        input.acordCompatible,
      ]
    );

    await query(
      `INSERT INTO catalog.api_versions (id, api_definition_id, version_number, lifecycle_status, openapi_spec, parsed_definition, created_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, NOW())`,
      [versionId, apiDefId, versionNumber, JSON.stringify(specObject), JSON.stringify(parsed)]
    );

    logger.info('OpenAPI spec uploaded', { apiDefId, versionNumber });

    return {
      apiDefinitionId: apiDefId,
      versionId,
      versionNumber,
      parsed,
    };
  },

  /** Get parsed API definition — Req 10.3 */
  async getSpec(specId: string) {
    const spec = await queryOne(
      `SELECT av.*, ad.name, ad.description as api_description
       FROM catalog.api_versions av
       JOIN catalog.api_definitions ad ON ad.id = av.api_definition_id
       WHERE av.id = $1`,
      [specId]
    );

    if (!spec) throw new NotFoundError('Especificación', specId);
    return spec;
  },

  /** Export back to OpenAPI YAML — Req 10.4 */
  async exportSpec(specId: string) {
    const spec = await queryOne<{ openapi_spec: Record<string, unknown> }>(
      `SELECT openapi_spec FROM catalog.api_versions WHERE id = $1`,
      [specId]
    );

    if (!spec) throw new NotFoundError('Especificación', specId);
    return yaml.dump(spec.openapi_spec);
  },

  /** Validate spec without saving — Req 10.2 */
  async validateSpec(specContent: string, format: 'yaml' | 'json') {
    let specObject: Record<string, unknown>;

    try {
      specObject = format === 'yaml'
        ? yaml.load(specContent) as Record<string, unknown>
        : JSON.parse(specContent);
    } catch (error) {
      return {
        valid: false,
        errors: [{ path: '/', message: `Error de parseo: ${(error as Error).message}` }],
      };
    }

    try {
      await parser.validate(specObject);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: parseSwaggerErrors(error as Error),
      };
    }
  },

  /** List spec versions — Req 10.5 */
  async listVersions(specId: string) {
    return query(
      `SELECT id, version_number, lifecycle_status, published_at, created_at
       FROM catalog.api_versions
       WHERE api_definition_id = $1
       ORDER BY created_at DESC`,
      [specId]
    );
  },
};

/** Parse OpenAPI spec into internal definition */
function parseToApiDefinition(spec: Record<string, unknown>) {
  const info = spec.info as Record<string, unknown>;
  const paths = spec.paths as Record<string, Record<string, unknown>> || {};
  const schemas = (spec.components as Record<string, unknown>)?.schemas || {};

  const endpoints = Object.entries(paths).flatMap(([path, methods]) =>
    Object.entries(methods)
      .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
      .map(([method, details]) => {
        const d = details as Record<string, unknown>;
        return {
          path,
          method: method.toUpperCase(),
          summary: d.summary as string || '',
          description: d.description as string || '',
          tags: (d.tags as string[]) || [],
          parameters: (d.parameters as unknown[]) || [],
          requestBody: d.requestBody || undefined,
          responses: d.responses || {},
        };
      })
  );

  return {
    name: info?.title as string || '',
    version: info?.version as string || '',
    description: info?.description as string || '',
    endpoints,
    schemas,
  };
}

/** Parse swagger-parser errors into field errors */
function parseSwaggerErrors(error: Error) {
  const message = error.message || 'Error de validación desconocido';
  return [{
    field: 'spec',
    message,
    suggestedFix: 'Verifique que la especificación cumple con el estándar OpenAPI 3.0+',
  }];
}
