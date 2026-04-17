import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildUrl } from '../config/microservices.config';
import { DashboardMetrics } from '../models/api.model';

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  apiId?: string;
  endpoint?: string;
  httpMethod?: string;
  statusCode?: number;
}

export interface ExportMetricsInput {
  format: 'csv' | 'json';
  startDate: string;
  endDate: string;
  apiId?: string;
}

/**
 * AnalyticsService — usage metrics and dashboard data.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  /** Get dashboard metrics */
  getDashboardMetrics(query: AnalyticsQuery = {}): Observable<DashboardMetrics> {
    let params = new HttpParams();
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.apiId) params = params.set('apiId', query.apiId);

    return this.http.get<DashboardMetrics>(
      buildUrl('analytics', '/dashboard'),
      { params }
    );
  }

  /** Get usage timeline data */
  getUsageTimeline(query: AnalyticsQuery = {}): Observable<any[]> {
    let params = new HttpParams();
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.apiId) params = params.set('apiId', query.apiId);

    return this.http.get<any[]>(
      buildUrl('analytics', '/timeline'),
      { params }
    );
  }

  /** Export metrics as CSV or JSON */
  exportMetrics(input: ExportMetricsInput): Observable<Blob> {
    return this.http.post(buildUrl('analytics', '/export'), input, {
      responseType: 'blob',
    });
  }
}
