import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const roleGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Array<string>;
  const userRole = authStore.user()?.role;

  if (authStore.isLoggedIn() && userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Redirect to dashboard or notfound if not authorized
  router.navigate(['/']);
  return false;
};
