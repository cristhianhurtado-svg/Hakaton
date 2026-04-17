import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DashboardMetrics } from '../../core/models/api.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    CalendarModule,
    DropdownModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly messageService = inject(MessageService);

  metrics: DashboardMetrics | null = null;
  loading = true;
  dateRange: Date[] = [];

  ngOnInit(): void {
    this.loadMetrics();
  }

  private loadMetrics(): void {
    this.analyticsService.getDashboardMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onExport(format: 'csv' | 'json'): void {
    if (!this.metrics) return;
    this.analyticsService
      .exportMetrics({
        format,
        startDate: this.metrics.period.start,
        endDate: this.metrics.period.end,
      })
      .subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-export.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo exportar las métricas.',
          });
        },
      });
  }
}
