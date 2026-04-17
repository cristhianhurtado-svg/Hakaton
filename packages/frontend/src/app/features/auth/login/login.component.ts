import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    ToastModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  email = '';
  password = '';
  loading = false;

  async onLogin(): Promise<void> {
    if (!this.email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Ingrese su correo electrónico.',
      });
      return;
    }

    this.loading = true;
    try {
      const user = await this.authService.login(this.email, this.password || 'dev');
      this.messageService.add({
        severity: 'success',
        summary: 'Bienvenido',
        detail: `Hola, ${user.displayName || user.email}`,
      });
      setTimeout(() => this.router.navigate(['/dashboard']), 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
      this.messageService.add({
        severity: 'error',
        summary: 'Error de autenticación',
        detail: message,
      });
    } finally {
      this.loading = false;
    }
  }

  /** Quick login for development */
  async quickLogin(email: string): Promise<void> {
    this.email = email;
    this.password = 'dev';
    await this.onLogin();
  }
}
