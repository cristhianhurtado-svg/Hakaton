import { Request, Response, NextFunction } from 'express';
import { catalogService } from './catalog.service';

export const catalogController = {
  /** GET /v1/api/catalog/apis */
  async listApis(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.listApis(
        (req as unknown as Record<string, unknown>).validatedQuery as never
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /** GET /v1/api/catalog/search */
  async searchApis(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.searchApis(
        (req as unknown as Record<string, unknown>).validatedQuery as never
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /** GET /v1/api/catalog/apis/:apiId */
  async getApiById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.getApiById(req.params.apiId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /** GET /v1/api/catalog/apis/:apiId/versions */
  async getApiVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.getApiVersions(req.params.apiId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /** GET /v1/api/catalog/categories */
  async listCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await catalogService.listCategories();
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};
