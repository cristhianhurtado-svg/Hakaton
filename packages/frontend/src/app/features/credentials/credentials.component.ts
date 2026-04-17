import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CredentialsService } from '../../core/services/credentials.service';
import { Credential } from '../../core/models/credential.model';

@Component({
  selector: 'app-credentials',
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
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './credentials.component.html',
  styleUrls: ['./credentials.component.scss'],
})
export class CredentialsComponent implements OnInit {
  private readonly credentialsService = inject(CredentialsService);
  private readonly messageService = inject(MessageService);

  credentials: Credential[] = [];
  loading = true;

  // Create dialog state
  showCreateDialog = false;
  creating = false;
  newCredType: 'oauth2' | 'mtls' = 'oauth2';
  newCredDescription = '';

  ngOnInit(): void {
    this.loadCredentials();
  }

  private loadCredentials(): void {
    this.credentialsService.listCredentials().subscribe({
      next: (data) => {
        this.credentials = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    const map: Record<string, 'success' | 'info' | 'danger' | 'warning'> = {
      active: 'success',
      rotated: 'info',
      revoked: 'danger',
      expired: 'warning',
    };
    return map[status] || 'info';
  }

  onCreate(): void {
    this.creating = true;
    // Simulate creation (in real app, would call credentialsService.createOAuth)
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Credencial creada',
        detail: `Credencial ${this.newCredType.toUpperCase()} generada exitosamente.`,
      });
      this.creating = false;
      this.showCreateDialog = false;
      this.newCredDescription = '';
      this.loadCredentials();
    }, 1000);
  }

  onRotate(credential: Credential): void {
    this.credentialsService.rotateCredential(credential.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Credencial rotada',
          detail: 'La credencial se ha rotado exitosamente.',
        });
        this.loadCredentials();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo rotar la credencial.',
        });
      },
    });
  }
}
