import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { buildUrl } from '../../../core/config/microservices.config';
import { AuditLogEntry, AuditDashboard } from '../../../core/models/notification.model';

@Component({
  selector: 'app-audit-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    CalendarModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './audit-admin.component.html',
  styleUrls: ['./audit-admin.component.scss'],
})
export class AuditAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);

  dashboard: AuditDashboard | null = null;
  logs: AuditLogEntry[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadDashboard();
    this.loadLogs();
  }

  private loadDashboard(): void {
    this.http.get<AuditDashboard>(buildUrl('audit', '/dashboard')).subscribe({
      next: (data) => (this.dashboard = data),
    });
  }

  private loadLogs(): void {
    this.http
      .get<{ data: AuditLogEntry[] }>(buildUrl('audit', '/logs'))
      .subscribe({
        next: (res) => {
          this.logs = res.data || [];
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  getStatusSeverity(status: number): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'danger';
    return 'info';
  }
}
