import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { buildUrl } from '../../../core/config/microservices.config';
import { ApiVersion } from '../../../core/models/api.model';

@Component({
  selector: 'app-versions-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DropdownModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './versions-admin.component.html',
  styleUrls: ['./versions-admin.component.scss'],
})
export class VersionsAdminComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  versions: ApiVersion[] = [];
  loading = true;
  showPromoteDialog = false;
  selectedVersion: ApiVersion | null = null;
  promoteTarget = '';

  promoteOptions = [
    { label: 'Staging', value: 'staging' },
    { label: 'Active', value: 'active' },
  ];

  ngOnInit(): void {
    this.loadVersions();
  }

  private loadVersions(): void {
    this.http
      .get<{ data: ApiVersion[] }>(buildUrl('versions'))
      .subscribe({
        next: (res) => {
          this.versions = res.data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
      draft: 'info',
      staging: 'warning',
      active: 'success',
      deprecated: 'warning',
      sunset: 'danger',
    };
    return map[status] || 'info';
  }

  openPromoteDialog(version: ApiVersion): void {
    this.selectedVersion = version;
    this.promoteTarget = '';
    this.showPromoteDialog = true;
  }

  confirmPromote(): void {
    if (!this.selectedVersion || !this.promoteTarget) return;

    this.http
      .post(buildUrl('versions', `/${this.selectedVersion.id}/promote`), {
        targetStatus: this.promoteTarget,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Versión promovida',
            detail: `Versión promovida a ${this.promoteTarget}.`,
          });
          this.showPromoteDialog = false;
          this.loadVersions();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo promover la versión.',
          });
        },
      });
  }
}
