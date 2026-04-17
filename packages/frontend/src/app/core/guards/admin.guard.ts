import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Admin guard — checks if the current user has SB_Admin or SB_SuperAdmin role.
 * Redirects unauthorized users to /auth/unauthorized.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.userClaims$.pipe(
    take(1),
    map((claims) => {
      const roles: string[] = (claims?.['roles'] as string[]) ?? [];
      const isAdmin = roles.some((r) =>
        ['SB_Admin', 'SB_SuperAdmin'].includes(r)
      );
      if (isAdmin) {
        return true;
      }
      return router.createUrlTree(['/auth/unauthorized']);
    })
  );
};
