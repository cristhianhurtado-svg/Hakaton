import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildUrl } from '../config/microservices.config';
import {
  Notification,
  NotificationPreferences,
  PaginatedResponse,
} from '../models/notification.model';

export interface NotificationHistoryQuery {
  notificationType?: string;
  apiId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface RegisterWebhookInput {
  url: string;
  secret?: string;
}

/**
 * NotificationsService — notification management and preferences.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);

  /** Get notification history */
  getHistory(
    query: NotificationHistoryQuery = {}
  ): Observable<PaginatedResponse<Notification>> {
    let params = new HttpParams();
    if (query.notificationType)
      params = params.set('notificationType', query.notificationType);
    if (query.apiId) params = params.set('apiId', query.apiId);
    if (query.startDate) params = params.set('startDate', query.startDate);
    if (query.endDate) params = params.set('endDate', query.endDate);
    if (query.page) params = params.set('page', query.page.toString());
    if (query.pageSize)
      params = params.set('pageSize', query.pageSize.toString());

    return this.http.get<PaginatedResponse<Notification>>(
      buildUrl('notifications'),
      { params }
    );
  }

  /** Get notification preferences */
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(
      buildUrl('notifications', '/preferences')
    );
  }

  /** Update notification preferences */
  updatePreferences(
    prefs: Partial<NotificationPreferences>
  ): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(
      buildUrl('notifications', '/preferences'),
      prefs
    );
  }

  /** Register a webhook */
  registerWebhook(input: RegisterWebhookInput): Observable<void> {
    return this.http.post<void>(
      buildUrl('notifications', '/webhooks'),
      input
    );
  }

  /** Mark notification as read */
  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(
      buildUrl('notifications', `/${notificationId}/read`),
      {}
    );
  }

  /** Get unread count */
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      buildUrl('notifications', '/unread-count')
    );
  }
}
