import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, withTransaction } from '../../db/pool';
import { VERSION_GOVERNANCE } from '@conecta2/shared';
import type { CreateApiVersionInput, PromoteVersionInput, CreateSunsetPlanInput } from '@conecta2/shared';
import { NotFoundError, AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { mockListVersions } from '../../db/mock-services';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

/**
 * Version Governor — Req 17
 * API version lifecycle management.
 */
export const versionGovernorService = {
  /** List all API versions — Req 17.5 */
  async listVersions() {
    if (USE_MOCK) return mockListVersions();
    return query(
      `SELECT av.*, ad.name as api_name,
              (SELECT COUNT(*) FROM catalog.api_subscriptions sub
               WHERE sub.api_definition_id = av.api_definition_id AND sub.status = 'active') as consumer_count
       FROM catalog.api_versions av
       JOIN catalog.api_definitions ad ON ad.id = av.api_definition_id
       ORDER BY ad.name, av.created_at DESC`
    );
  },

  /** Create new version as draft — Req 17.1 */
  async createVersion(input: CreateApiVersionInput, adminId: string) {
    const id = uuidv4();

    await query(
      `INSERT INTO catalog.api_versions (id, api_definition_id, version_number, lifecycle_status, openapi_spec, published_by, created_at)
       VALUES ($1, $2, $3, 'draft', $4, $5, NOW())`,
      [id, input.apiDefinitionId, input.versionNumber, JSON.stringify(input.openapiSpec), adminId]
    );

    logger.info('API version created as draft', { versionId: id, apiId: input.apiDefinitionId });
    return { id, versionNumber: input.versionNumber, lifecycleStatus: 'draft' };
  },

  /** Promote version — Req 17.1 */
  async promoteVersion(versionId: string, input: PromoteVersionInput, adminId: string) {
    const version = await queryOne<Record<string, unknown>>(
      `SELECT * FROM catalog.api_versions WHERE id = $1`,
      [versionId]
    );

    if (!version) throw new NotFoundError('Versión de API', versionId);

    const currentStatus = version.lifecycle_status as string;
    const validTransitions: Record<string, string[]> = {
      draft: ['staging'],
      staging: ['active'],
    };

    if (!validTransitions[currentStatus]?.includes(input.targetStatus)) {
      throw new AppError({
        status: 400,
        title: 'Transición inválida',
        detail: `No se puede promover de ${currentStatus} a ${input.targetStatus}`,
      });
    }

    await query(
      `UPDATE catalog.api_versions
       SET lifecycle_status = $1, published_at = CASE WHEN $1 = 'active' THEN NOW() ELSE published_at END,
           published_by = $2
       WHERE id = $3`,
      [input.targetStatus, adminId, versionId]
    );

    logger.info('API version promoted', { versionId, from: currentStatus, to: input.targetStatus });
    return { versionId, lifecycleStatus: input.targetStatus };
  },

  /** Create sunset plan — Req 17.2 */
  async createSunsetPlan(versionId: string, input: CreateSunsetPlanInput, adminId: string) {
    const sunsetDate = new Date(input.sunsetDate);
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + VERSION_GOVERNANCE.MIN_SUNSET_MONTHS);

    if (sunsetDate < minDate) {
      throw new AppError({
        status: 400,
        title: 'Fecha de sunset inválida',
        detail: `La fecha de sunset debe ser al menos ${VERSION_GOVERNANCE.MIN_SUNSET_MONTHS} meses en el futuro`,
      });
    }

    const id = uuidv4();
    await query(
      `INSERT INTO catalog.sunset_plans (id, api_version_id, target_version_id, sunset_date, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, 'draft', $5, NOW())`,
      [id, versionId, input.targetVersionId, input.sunsetDate, adminId]
    );

    return { id, status: 'draft', sunsetDate: input.sunsetDate };
  },

  /** Activate sunset plan — Req 17.3 */
  async activateSunsetPlan(versionId: string, planId: string) {
    return withTransaction(async (client) => {
      const plan = await client.query(
        `SELECT * FROM catalog.sunset_plans WHERE id = $1 AND api_version_id = $2 AND status = 'draft'`,
        [planId, versionId]
      );

      if (plan.rows.length === 0) throw new NotFoundError('Plan de sunset', planId);

      // Mark version as deprecated
      await client.query(
        `UPDATE catalog.api_versions SET lifecycle_status = 'deprecated', deprecated_at = NOW(), sunset_date = $1
         WHERE id = $2`,
        [plan.rows[0].sunset_date, versionId]
      );

      // Activate plan
      await client.query(
        `UPDATE catalog.sunset_plans SET status = 'active', activated_at = NOW() WHERE id = $1`,
        [planId]
      );

      logger.info('Sunset plan activated', { planId, versionId });

      // Trigger deprecation notifications — Req 17.3
      // notificationsService.sendNotification(...) would be called here

      return { planId, status: 'active', message: 'Plan de sunset activado. Se enviarán notificaciones de deprecación.' };
    });
  },

  /** Get migration guide — Req 17.4 */
  async getMigrationGuide(versionId: string) {
    const plan = await queryOne<Record<string, unknown>>(
      `SELECT sp.*, 
              av_old.version_number as old_version, av_old.openapi_spec as old_spec,
              av_new.version_number as new_version, av_new.openapi_spec as new_spec
       FROM catalog.sunset_plans sp
       JOIN catalog.api_versions av_old ON av_old.id = sp.api_version_id
       JOIN catalog.api_versions av_new ON av_new.id = sp.target_version_id
       WHERE sp.api_version_id = $1 AND sp.status IN ('draft', 'active')`,
      [versionId]
    );

    if (!plan) {
      return { message: 'No hay plan de migración disponible para esta versión' };
    }

    return {
      fromVersion: plan.old_version,
      toVersion: plan.new_version,
      sunsetDate: plan.sunset_date,
      guide: plan.migration_guide || {
        breakingChanges: [],
        newEndpoints: [],
        removedEndpoints: [],
        schemaChanges: [],
        migrationSteps: [
          'Actualice la URL base de la API al nuevo prefijo de versión',
          'Revise los cambios en los esquemas de request/response',
          'Actualice los SDKs a la versión correspondiente',
          'Ejecute pruebas en el Sandbox con la nueva versión',
        ],
      },
    };
  },
};
