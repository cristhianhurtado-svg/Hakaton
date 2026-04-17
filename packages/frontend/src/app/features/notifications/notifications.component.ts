import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { NotificationsService } from '../../core/services/notifications.service';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  private readonly notificationsService = inject(NotificationsService);
  private readonly messageService = inject(MessageService);

  notifications: Notification[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadNotifications();
  }

  private loadNotifications(): void {
    this.notificationsService.getHistory().subscribe({
      next: (res) => {
        this.notifications = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getTypeSeverity(type: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'info' | 'warning' | 'danger'> = {
      new_version: 'info',
      maintenance: 'warning',
      deprecation: 'danger',
      credential_expiry: 'warning',
      access_change: 'info',
    };
    return map[type] || 'info';
  }

  markAsRead(notification: Notification): void {
    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Leída',
          detail: 'Notificación marcada como leída.',
        });
      },
    });
  }
}
