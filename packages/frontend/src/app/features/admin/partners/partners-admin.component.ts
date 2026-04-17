import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { buildUrl } from '../../../core/config/microservices.config';
import { PartnerSummary } from '../../../core/models/partner.model';

@Component({
  selector: 'app-partners-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './partners-admin.component.html',
  styleUrls: ['./partners-admin.component.scss'],
})
export class PartnersAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  partners: PartnerSummary[] = [];
  loading = true;
  showStatusDialog = false;
  selectedPartner: PartnerSummary | null = null;
  statusAction = '';
  statusReason = '';

  ngOnInit(): void {
    this.loadPartners();
  }

  private loadPartners(): void {
    this.http
      .get<{ data: PartnerSummary[] }>(buildUrl('partners'))
      .subscribe({
        next: (res) => {
          this.partners = res.data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
      active: 'success',
      pending: 'warning',
      suspended: 'danger',
      revoked: 'info',
    };
    return map[status] || 'info';
  }

  openStatusDialog(partner: PartnerSummary, action: string): void {
    this.selectedPartner = partner;
    this.statusAction = action;
    this.statusReason = '';
    this.showStatusDialog = true;
  }

  confirmStatusChange(): void {
    if (!this.selectedPartner || this.statusReason.length < 10) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Razón requerida',
        detail: 'Proporcione una razón de al menos 10 caracteres.',
      });
      return;
    }

    this.http
      .patch(buildUrl('partners', `/${this.selectedPartner.id}/status`), {
        status: this.statusAction,
        reason: this.statusReason,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Estado actualizado',
            detail: `Partner ${this.statusAction} exitosamente.`,
          });
          this.showStatusDialog = false;
          this.loadPartners();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el estado.',
          });
        },
      });
  }
}
