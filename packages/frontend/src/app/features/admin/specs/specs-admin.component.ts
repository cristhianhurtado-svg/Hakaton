import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { buildUrl } from '../../../core/config/microservices.config';

@Component({
  selector: 'app-specs-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    FileUploadModule,
    DropdownModule,
    InputTextModule,
    InputSwitchModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './specs-admin.component.html',
  styleUrls: ['./specs-admin.component.scss'],
})
export class SpecsAdminComponent {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);

  specName = '';
  selectedCategory = '';
  profileSupport = 'both';
  acordCompatible = false;
  specContent = '';
  specFormat: 'yaml' | 'json' = 'yaml';
  loading = false;
  validationErrors: { path: string; message: string; suggestedFix?: string }[] = [];

  profileOptions = [
    { label: 'Ágil', value: 'agil' },
    { label: 'Corporativo', value: 'corporativo' },
    { label: 'Ambos', value: 'both' },
  ];

  formatOptions = [
    { label: 'YAML', value: 'yaml' },
    { label: 'JSON', value: 'json' },
  ];

  onUpload(): void {
    if (!this.specName || !this.specContent) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Complete todos los campos obligatorios.',
      });
      return;
    }

    this.loading = true;
    this.validationErrors = [];

    this.http
      .post(buildUrl('specs', '/upload'), {
        name: this.specName,
        categoryId: this.selectedCategory,
        profileSupport: this.profileSupport,
        acordCompatible: this.acordCompatible,
        spec: this.specContent,
        format: this.specFormat,
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Spec cargada',
            detail: 'La especificación OpenAPI se ha procesado correctamente.',
          });
          this.loading = false;
        },
        error: (err) => {
          this.validationErrors = err.error?.errors || [];
          this.messageService.add({
            severity: 'error',
            summary: 'Error de validación',
            detail: 'La especificación contiene errores.',
          });
          this.loading = false;
        },
      });
  }
}
