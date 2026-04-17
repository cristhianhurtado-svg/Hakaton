import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);

  collapsed = false;

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Catálogo APIs', icon: 'pi pi-book', route: '/catalog' },
    { label: 'Credenciales', icon: 'pi pi-key', route: '/credentials' },
    { label: 'Sandbox', icon: 'pi pi-code', route: '/sandbox' },
    { label: 'Analíticas', icon: 'pi pi-chart-bar', route: '/analytics' },
    { label: 'Notificaciones', icon: 'pi pi-bell', route: '/notifications' },
  ];

  readonly adminItems: NavItem[] = [
    { label: 'Partners', icon: 'pi pi-users', route: '/admin/partners', adminOnly: true },
    { label: 'Auditoría', icon: 'pi pi-shield', route: '/admin/audit', adminOnly: true },
    { label: 'Versiones', icon: 'pi pi-history', route: '/admin/versions', adminOnly: true },
    { label: 'Specs', icon: 'pi pi-file', route: '/admin/specs', adminOnly: true },
  ];

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }
}
