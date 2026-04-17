import { Router } from 'express';
import { catalogController } from './catalog.controller';
import { validate } from '../../middleware/validate';
import { optionalAuth } from '../../middleware/authenticate';
import { listApisSchema, searchApisSchema } from '@conecta2/shared';

const router = Router();

/** GET /v1/api/catalog/apis — Public with optional auth */
router.get(
  '/apis',
  optionalAuth,
  validate(listApisSchema, 'query'),
  catalogController.listApis
);

/** GET /v1/api/catalog/search — Public with optional auth */
router.get(
  '/search',
  optionalAuth,
  validate(searchApisSchema, 'query'),
  catalogController.searchApis
);

/** GET /v1/api/catalog/apis/:apiId — Public with optional auth */
router.get(
  '/apis/:apiId',
  optionalAuth,
  catalogController.getApiById
);

/** GET /v1/api/catalog/apis/:apiId/versions — Public with optional auth */
router.get(
  '/apis/:apiId/versions',
  optionalAuth,
  catalogController.getApiVersions
);

/** GET /v1/api/catalog/categories — Public */
router.get(
  '/categories',
  catalogController.listCategories
);

export { router as catalogRouter };
