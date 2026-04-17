import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../../db/pool';
import { logger } from '../../lib/logger';

/**
 * SDK Generator — Req 13
 * Automatic SDK generation from OpenAPI specs.
 */
export const sdkGeneratorService = {
  /** Trigger SDK generation — Req 13.3 */
  async generateSdks(specId: string) {
    const spec = await queryOne<Record<string, unknown>>(
      `SELECT * FROM catalog.api_versions WHERE id = $1`,
      [specId]
    );

    if (!spec) {
      throw new Error(`Spec ${specId} not found`);
    }

    const languages = ['javascript', 'python', 'java'] as const;
    const results = [];

    for (const language of languages) {
      const sdkId = uuidv4();
      await query(
        `INSERT INTO catalog.sdk_packages (id, api_version_id, language, package_version, status, generated_at)
         VALUES ($1, $2, $3, $4, 'generating', NOW())`,
        [sdkId, specId, language, spec.version_number]
      );

      // Queue async generation
      setImmediate(async () => {
        try {
          await generateSdkForLanguage(sdkId, spec, language);
          await query(
            `UPDATE catalog.sdk_packages SET status = 'ready', s3_artifact_key = $1 WHERE id = $2`,
            [`sdks/${specId}/${language}/${spec.version_number}.zip`, sdkId]
          );
          logger.info('SDK generated', { sdkId, language, specId });
        } catch (error) {
          await query(
            `UPDATE catalog.sdk_packages SET status = 'failed', error_message = $1 WHERE id = $2`,
            [(error as Error).message, sdkId]
          );
          logger.error('SDK generation failed', { sdkId, language, error: (error as Error).message });
          // Notify admin within 60s — Req 13.7
        }
      });

      results.push({ sdkId, language, status: 'generating' });
    }

    return { specId, sdks: results };
  },

  /** List available SDKs — Req 13.4 */
  async listSdks(apiId?: string) {
    const whereClause = apiId
      ? `WHERE av.api_definition_id = $1 AND sp.status = 'ready'`
      : `WHERE sp.status = 'ready'`;
    const params = apiId ? [apiId] : [];

    return query(
      `SELECT sp.*, av.version_number, ad.name as api_name
       FROM catalog.sdk_packages sp
       JOIN catalog.api_versions av ON av.id = sp.api_version_id
       JOIN catalog.api_definitions ad ON ad.id = av.api_definition_id
       ${whereClause}
       ORDER BY sp.generated_at DESC`,
      params
    );
  },

  /** Get SDK download info */
  async getSdkDownload(sdkId: string) {
    const sdk = await queryOne<Record<string, unknown>>(
      `SELECT sp.*, av.version_number, ad.name as api_name
       FROM catalog.sdk_packages sp
       JOIN catalog.api_versions av ON av.id = sp.api_version_id
       JOIN catalog.api_definitions ad ON ad.id = av.api_definition_id
       WHERE sp.id = $1 AND sp.status = 'ready'`,
      [sdkId]
    );

    if (!sdk) {
      throw new Error(`SDK ${sdkId} not found or not ready`);
    }

    return {
      ...sdk,
      downloadUrl: `/v1/api/sdks/${sdkId}/artifact`,
      installInstructions: getInstallInstructions(sdk.language as string, sdk.api_name as string, sdk.package_version as string),
    };
  },
};

/** Generate SDK for a specific language (placeholder) */
async function generateSdkForLanguage(
  sdkId: string,
  spec: Record<string, unknown>,
  language: string
): Promise<void> {
  // In production: use OpenAPI Generator CLI as subprocess
  // openapi-generator-cli generate -i spec.yaml -g {language} -o output/
  logger.info('Generating SDK', { sdkId, language });
  // Simulated generation time
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

/** Get language-specific install instructions — Req 13.4 */
function getInstallInstructions(language: string, apiName: string, version: string): string {
  const packageName = apiName.toLowerCase().replace(/\s+/g, '-');

  switch (language) {
    case 'javascript':
      return `npm install @conecta2/${packageName}@${version}`;
    case 'python':
      return `pip install conecta2-${packageName}==${version}`;
    case 'java':
      return `<dependency>\n  <groupId>com.segurosbolivar.conecta2</groupId>\n  <artifactId>${packageName}</artifactId>\n  <version>${version}</version>\n</dependency>`;
    default:
      return '';
  }
}
