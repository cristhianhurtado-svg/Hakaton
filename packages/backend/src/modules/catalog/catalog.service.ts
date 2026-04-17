import type { ListApisInput, SearchApisInput } from '@conecta2/shared';
import { catalogRepository } from './catalog.repository';
import { NotFoundError } from '../../lib/errors';
import { config } from '../../config';
import { mockListApis, mockSearchApis, mockGetApiById, mockGetApiVersions, mockListCategories } from '../../db/mock-services';

const USE_MOCK = config.nodeEnv === 'development' && process.env.USE_MOCK_DB === 'true';

export const catalogService = {
  /** List APIs with filters — Req 2.1, 2.6 */
  async listApis(filters: ListApisInput) {
    if (USE_MOCK) return mockListApis(filters);
    return catalogRepository.listApis(filters);
  },

  /** Search APIs by keyword — Req 2.2 */
  async searchApis(input: SearchApisInput) {
    if (USE_MOCK) return mockSearchApis(input.query, input.page, input.pageSize);
    return catalogRepository.searchApis(input.query, input.page, input.pageSize);
  },

  /** Get API details — Req 2.3 */
  async getApiById(apiId: string) {
    if (USE_MOCK) {
      const api = mockGetApiById(apiId);
      if (!api) throw new NotFoundError('API', apiId);
      return api;
    }
    const api = await catalogRepository.getApiById(apiId);
    if (!api) throw new NotFoundError('API', apiId);
    return api;
  },

  /** Get API versions — Req 2.5 */
  async getApiVersions(apiId: string) {
    if (USE_MOCK) {
      const api = mockGetApiById(apiId);
      if (!api) throw new NotFoundError('API', apiId);
      return mockGetApiVersions(apiId);
    }
    const api = await catalogRepository.getApiById(apiId);
    if (!api) throw new NotFoundError('API', apiId);
    return catalogRepository.getApiVersions(apiId);
  },

  /** List categories — Req 2.6 */
  async listCategories() {
    if (USE_MOCK) return mockListCategories();
    return catalogRepository.listCategories();
  },
};
