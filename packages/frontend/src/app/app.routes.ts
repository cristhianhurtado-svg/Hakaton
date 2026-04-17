import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'auth/unauthorized',
    loadComponent: () =>
      import('./features/auth/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'catalog',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/catalog/catalog.component').then(
        (m) => m.CatalogComponent
      ),
  },
  {
    path: 'catalog/:apiId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/catalog/api-detail/api-detail.component').then(
        (m) => m.ApiDetailComponent
      ),
  },
  {
    path: 'credentials',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/credentials/credentials.component').then(
        (m) => m.CredentialsComponent
      ),
  },
  {
    path: 'sandbox',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sandbox/sandbox.component').then(
        (m) => m.SandboxComponent
      ),
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/analytics/analytics.component').then(
        (m) => m.AnalyticsComponent
      ),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(
        (m) => m.NotificationsComponent
      ),
  },
  {
    path: 'admin/partners',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/partners/partners-admin.component').then(
        (m) => m.PartnersAdminComponent
      ),
  },
  {
    path: 'admin/audit',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/audit/audit-admin.component').then(
        (m) => m.AuditAdminComponent
      ),
  },
  {
    path: 'admin/versions',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/versions/versions-admin.component').then(
        (m) => m.VersionsAdminComponent
      ),
  },
  {
    path: 'admin/specs',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/admin/specs/specs-admin.component').then(
        (m) => m.SpecsAdminComponent
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
