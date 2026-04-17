import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildUrl } from '../config/microservices.config';
import {
  ApiDefinition,
  ApiCategory,
  PaginatedResponse,
} from '../models/api.model';

export interface ListApisParams {
  category?: string;
  profileSupport?: 'agil' | 'corporativo' | 'both';
  lifecycleStatus?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchApisParams {
  query: string;
  category?: string;
  profileSupport?: 'agil' | 'corporativo' | 'both';
  acordCompatible?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * CatalogService — API catalog operations.
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  /** List APIs with optional filters */
  listApis(
    params: ListApisParams = {}
  ): Observable<PaginatedResponse<ApiDefinition>> {
    let httpParams = new HttpParams();
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.profileSupport)
      httpParams = httpParams.set('profileSupport', params.profileSupport);
    if (params.lifecycleStatus)
      httpParams = httpParams.set('lifecycleStatus', params.lifecycleStatus);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize)
      httpParams = httpParams.set('pageSize', params.pageSize.toString());

    return this.http.get<PaginatedResponse<ApiDefinition>>(
      buildUrl('catalog', '/apis'),
      { params: httpParams }
    );
  }

  /** Full-text search APIs */
  searchApis(
    params: SearchApisParams
  ): Observable<PaginatedResponse<ApiDefinition>> {
    let httpParams = new HttpParams().set('query', params.query);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.profileSupport)
      httpParams = httpParams.set('profileSupport', params.profileSupport);
    if (params.acordCompatible !== undefined)
      httpParams = httpParams.set(
        'acordCompatible',
        params.acordCompatible.toString()
      );
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.pageSize)
      httpParams = httpParams.set('pageSize', params.pageSize.toString());

    return this.http.get<PaginatedResponse<ApiDefinition>>(
      buildUrl('catalog', '/search'),
      { params: httpParams }
    );
  }

  /** Get a single API by ID */
  getApiById(apiId: string): Observable<ApiDefinition> {
    return this.http.get<ApiDefinition>(buildUrl('catalog', `/${apiId}`));
  }

  /** Get all API categories */
  getCategories(): Observable<ApiCategory[]> {
    return this.http.get<ApiCategory[]>(buildUrl('catalog', '/categories'));
  }
}
