import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildUrl } from '../config/microservices.config';
import { Credential, OAuthCreatedResponse } from '../models/credential.model';

export interface CreateOAuthInput {
  applicationId: string;
  description?: string;
}

export interface CreateMtlsCsrInput {
  applicationId: string;
  commonName: string;
  organization: string;
  country: string;
}

export interface RotateCredentialInput {
  gracePeriodHours?: number;
}

/**
 * CredentialsService — OAuth 2.0 and mTLS credential management.
 */
@Injectable({ providedIn: 'root' })
export class CredentialsService {
  private readonly http = inject(HttpClient);

  /** List all credentials for the current partner */
  listCredentials(): Observable<Credential[]> {
    return this.http.get<Credential[]>(buildUrl('credentials'));
  }

  /** Create OAuth 2.0 credentials */
  createOAuth(input: CreateOAuthInput): Observable<OAuthCreatedResponse> {
    return this.http.post<OAuthCreatedResponse>(
      buildUrl('credentials', '/oauth'),
      input
    );
  }

  /** Create mTLS CSR */
  createMtlsCsr(input: CreateMtlsCsrInput): Observable<Credential> {
    return this.http.post<Credential>(
      buildUrl('credentials', '/mtls'),
      input
    );
  }

  /** Rotate a credential */
  rotateCredential(
    credentialId: string,
    input: RotateCredentialInput = {}
  ): Observable<Credential> {
    return this.http.post<Credential>(
      buildUrl('credentials', `/${credentialId}/rotate`),
      input
    );
  }

  /** Revoke a credential */
  revokeCredential(credentialId: string): Observable<void> {
    return this.http.delete<void>(
      buildUrl('credentials', `/${credentialId}`)
    );
  }
}
