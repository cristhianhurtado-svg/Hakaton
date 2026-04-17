import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CatalogService } from '../../../core/services/catalog.service';
import { ApiDefinition } from '../../../core/models/api.model';

@Component({
  selector: 'app-api-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TabViewModule,
    TagModule,
    ToastModule,
    SidebarComponent,
    HeaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './api-detail.component.html',
  styleUrls: ['./api-detail.component.scss'],
})
export class ApiDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);

  api: ApiDefinition | null = null;
  loading = true;

  ngOnInit(): void {
    const apiId = this.route.snapshot.paramMap.get('apiId');
    if (apiId) {
      this.catalogService.getApiById(apiId).subscribe({
        next: (data) => {
          this.api = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }
}
