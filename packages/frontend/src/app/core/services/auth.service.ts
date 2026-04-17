import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  profileType: string;
}

/**
 * AuthService — Development mode uses local JWT login.
 * Production mode would use Firebase Authentication.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _authState$ = new BehaviorSubject<AppUser | null>(null);
  readonly authState$: Observable<AppUser | null> = this._authState$.asObservable();

  private readonly _userClaims$ = new BehaviorSubject<Record<string, unknown> | null>(null);
  readonly userClaims$: Observable<Record<string, unknown> | null> = this._userClaims$.asObservable();

  private token: string | null = null;

  constructor() {
    this.restoreSession();
  }

  /** Restore session from localStorage token */
  private restoreSession(): void {
    const savedToken = localStorage.getItem('conecta2_token');
    const savedUser = localStorage.getItem('conecta2_user');

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser) as AppUser;
        this.token = savedToken;
        this._authState$.next(user);
        this._userClaims$.next({ roles: user.roles, profileType: user.profileType });
      } catch {
        this.clearSession();
      }
    }
  }

  /** Sign in with email and password (dev mode: local JWT) */
  async login(email: string, password: string): Promise<AppUser> {
    const response = await firstValueFrom(
      this.http.post<{ token: string; user: AppUser }>(
        `${environment.apiBaseUrl}/auth/login`,
        { email, password }
      )
    );

    if (!response) {
      throw new Error('No se recibió respuesta del servidor');
    }

    this.token = response.token;
    const user = response.user;

    // Persist session
    localStorage.setItem('conecta2_token', response.token);
    localStorage.setItem('conecta2_user', JSON.stringify(user));

    this._authState$.next(user);
    this._userClaims$.next({ roles: user.roles, profileType: user.profileType });

    return user;
  }

  /** Sign out */
  async logout(): Promise<void> {
    this.clearSession();
  }

  private clearSession(): void {
    this.token = null;
    localStorage.removeItem('conecta2_token');
    localStorage.removeItem('conecta2_user');
    this._authState$.next(null);
    this._userClaims$.next(null);
  }

  /** Get the current user */
  getCurrentUser(): AppUser | null {
    return this._authState$.value;
  }

  /** Get the current token (for API calls via interceptor) */
  async getToken(): Promise<string | null> {
    return this.token;
  }

  /** Check if user has a specific role */
  hasRole(role: string): boolean {
    const claims = this._userClaims$.value;
    const roles: string[] = (claims?.['roles'] as string[]) ?? [];
    return roles.includes(role);
  }

  /** Check if user is admin */
  isAdmin(): boolean {
    return this.hasRole('SB_Admin') || this.hasRole('SB_SuperAdmin');
  }
}
