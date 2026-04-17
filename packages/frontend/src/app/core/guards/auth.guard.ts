import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * Auth guard — checks Firebase authentication state.
 * Redirects unauthenticated users to /auth/login.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authState$.pipe(
    take(1),
    map((user) => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/auth/login']);
    })
  );
};
