import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from '../stores/auth.store';

export const authGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  console.log(`[AuthGuard] Checking: ${state.url} | LoggedIn: ${authStore.isLoggedIn()}`);

  if (authStore.isLoggedIn()) {
    return true;
  }

  // Redirect to login page if not logged in
  console.log('[AuthGuard] Not logged in, redirecting to login...');
  router.navigate(['/auth/login']);
  return false;
};
