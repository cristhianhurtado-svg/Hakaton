import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ChartModule } from 'primeng/chart';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AnalyticsService } from '../../core/services/analytics.service';
import { DashboardMetrics } from '../../core/models/api.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    ButtonModule, ToastModule, ChartModule,
    SidebarComponent, HeaderComponent,
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

  // Chart data
  trafficChartData: any;
  trafficChartOptions: any;
  latencyChartData: any;
  latencyChartOptions: any;
  errorChartData: any;
  errorChartOptions: any;
  statusChartData: any;
  statusChartOptions: any;

  ngOnInit(): void {
    this.loadMetrics();
    this.initChartOptions();
  }

  private loadMetrics(): void {
    this.analyticsService.getDashboardMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
        this.buildCharts(data);
      },
      error: () => (this.loading = false),
    });
  }

  private initChartOptions(): void {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
          ticks: { font: { size: 10, family: 'Inter' }, color: '#9CA3AF' },
        },
        y: {
          grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
          ticks: { font: { size: 10, family: 'Inter' }, color: '#9CA3AF' },
          beginAtZero: true,
        },
      },
    };

    this.trafficChartOptions = { ...baseOptions };
    this.latencyChartOptions = {
      ...baseOptions,
      scales: {
        ...baseOptions.scales,
        y: { ...baseOptions.scales.y, ticks: { ...baseOptions.scales.y.ticks, callback: (v: number) => v + 'ms' } },
      },
    };
    this.errorChartOptions = { ...baseOptions };
    this.statusChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11, family: 'Inter' }, padding: 16, usePointStyle: true } },
      },
    };
  }

  private buildCharts(data: DashboardMetrics): void {
    // Generate 24-hour timeline labels
    const hours = Array.from({ length: 24 }, (_, i) => {
      const h = new Date();
      h.setHours(h.getHours() - 23 + i);
      return h.getHours().toString().padStart(2, '0') + ':00';
    });

    // Simulated hourly data based on real metrics
    const totalPerHour = Math.max(1, Math.round(data.totalCalls / 24));
    const trafficData = hours.map(() => Math.round(totalPerHour * (0.3 + Math.random() * 1.4)));
    const errorData = hours.map((_, i) => Math.round(trafficData[i] * (data.errorRate / 100) * (0.2 + Math.random() * 1.6)));
    const latencyData = hours.map(() => Math.round(data.latency.p50 * (0.5 + Math.random() * 2)));

    // Traffic chart (area)
    this.trafficChartData = {
      labels: hours,
      datasets: [{
        label: 'Requests',
        data: trafficData,
        fill: true,
        backgroundColor: 'rgba(0, 107, 68, 0.08)',
        borderColor: '#006B44',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#006B44',
      }],
    };

    // Latency chart (line)
    this.latencyChartData = {
      labels: hours,
      datasets: [
        {
          label: 'P50',
          data: latencyData,
          borderColor: '#006B44',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'P95',
          data: latencyData.map(v => Math.round(v * 2.5)),
          borderColor: '#FCE850',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
        {
          label: 'P99',
          data: latencyData.map(v => Math.round(v * 4)),
          borderColor: '#DC2626',
          borderWidth: 1.5,
          borderDash: [4, 4],
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
    this.latencyChartOptions = {
      ...this.latencyChartOptions,
      plugins: {
        legend: { display: true, position: 'top', labels: { font: { size: 11, family: 'Inter' }, padding: 16, usePointStyle: true } },
      },
    };

    // Error rate chart (bar)
    this.errorChartData = {
      labels: hours,
      datasets: [{
        label: 'Errores',
        data: errorData,
        backgroundColor: errorData.map(v => v > totalPerHour * 0.1 ? 'rgba(220, 38, 38, 0.7)' : 'rgba(220, 38, 38, 0.25)'),
        borderRadius: 4,
        borderSkipped: false,
      }],
    };

    // Status distribution (doughnut)
    const errorsByType = data.errorsByType || {};
    const success = data.totalCalls - Object.values(errorsByType).reduce((a: number, b: number) => a + b, 0);
    this.statusChartData = {
      labels: ['2xx Éxito', ...Object.keys(errorsByType).map(k => `${k} Error`)],
      datasets: [{
        data: [Math.max(0, success), ...Object.values(errorsByType)],
        backgroundColor: [
          '#006B44',
          '#FCE850', '#F59E0B', '#DC2626', '#7C3AED',
          '#2563EB', '#059669', '#D97706', '#EC4899',
        ],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
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
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo exportar.' });
        },
      });
  }
}
