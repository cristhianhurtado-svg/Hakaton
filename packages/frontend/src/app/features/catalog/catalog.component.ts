import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CatalogService } from '../../core/services/catalog.service';
import { ApiDefinition, ApiCategory } from '../../core/models/api.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss'],
})
export class CatalogComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);

  apis: ApiDefinition[] = [];
  categories: ApiCategory[] = [];
  searchQuery = '';
  selectedCategory: string | null = null;
  loading = true;

  // Modal state
  selectedApi: ApiDefinition | null = null;
  showModal = false;
  activeTab: 'general' | 'specs' = 'general';

  ngOnInit(): void {
    this.loadCategories();
    this.loadApis();
  }

  private loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
    });
  }

  loadApis(): void {
    this.loading = true;
    const params: Record<string, string> = {};
    if (this.selectedCategory) params['category'] = this.selectedCategory;

    this.catalogService.listApis(params).subscribe({
      next: (res) => {
        this.apis = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadApis();
      return;
    }
    this.loading = true;
    this.catalogService.searchApis({ query: this.searchQuery }).subscribe({
      next: (res) => {
        this.apis = res.data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openApiDetail(api: ApiDefinition): void {
    this.selectedApi = api;
    this.activeTab = 'general';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedApi = null;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  getApiName(api: ApiDefinition): string {
    return api.name || '';
  }

  getApiVersion(api: ApiDefinition): string {
    return (api.current_version || api.currentVersion || 'N/A') as string;
  }

  getApiSlug(api: ApiDefinition): string {
    return (api.slug || '') as string;
  }

  isAcord(api: ApiDefinition): boolean {
    return !!(api.acord_compatible || api.acordCompatible);
  }

  getProfileSupport(api: ApiDefinition): string {
    return (api.profile_support || api.profileSupport || 'both') as string;
  }

  getCurlExample(api: ApiDefinition): string {
    const slug = this.getApiSlug(api);
    return `curl -X POST \\
  https://sandbox.conecta2.segurosbolivar.com/v1/api/${slug} \\
  -H "Authorization: Bearer \$ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "X-Correlation-ID: $(uuidgen)" \\
  -d '{
    "vehiculo": {
      "placa": "ABC-123",
      "fasecolda": "04400420",
      "modelo": 2024
    },
    "tomador": {
      "tipoDocumento": "CC",
      "documento": "1234567890"
    }
  }'`;
  }
}
