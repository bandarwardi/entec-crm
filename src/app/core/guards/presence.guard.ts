import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthStore } from '../stores/auth.store';
import { catchError, map, of, timer, switchMap } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

console.log('%c [PresenceGuard] Script Loaded Successfully!', 'background: #222; color: #bada55; font-size: 16px;');

let lastCheckTime = 0;
let lastCheckResult = true;
const CACHE_DURATION = 60000; // 1 minute cache
let isRedirecting = false;

export const presenceGuard: CanActivateFn = (route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const http = inject(HttpClient);
  
  if (isRedirecting) return false;

  const urlToken = route.queryParams['token'];
  const isAccessDeniedPage = state.url.includes('/access-denied');

  if (isAccessDeniedPage) return true;

  // Track last login in localStorage to survive reloads during the sensitive first seconds
  const lastLoginStr = localStorage.getItem('last_login_timestamp');
  const lastLoginTime = lastLoginStr ? parseInt(lastLoginStr, 10) : 0;

  // 1. Magic Link Logic (Priority) - Start/Update grace period
  if (urlToken) {
    localStorage.setItem('last_login_timestamp', Date.now().toString());
    lastCheckTime = 0; // Force fresh check after grace period
    console.log('[PresenceGuard] Magic Token found, starting fresh grace period');
    return true;
  }

  // Check if a fresh check is forced (e.g. after login)
  if (localStorage.getItem('presence_fresh_check') === 'true') {
    lastCheckTime = 0;
    localStorage.removeItem('presence_fresh_check');
  }

  // Grace Period: Allow 10 seconds after login before strict checking
  if (Date.now() - lastLoginTime < 10000) {
    console.log('[PresenceGuard] Within persistent grace period');
    return true;
  }

  // 2. Cache Logic
  const now = Date.now();
  if (now - lastCheckTime < CACHE_DURATION) {
    if (!lastCheckResult) {
      isRedirecting = true;
      router.navigate(['/access-denied']).then(() => isRedirecting = false);
      return false;
    }
    return true;
  }

  // 3. Normal check
  console.log('[PresenceGuard] Checking backend presence status...');
  return timer(800).pipe(
    switchMap(() => http.get<{ isActive: boolean }>(`${API_BASE_URL}/auth/presence-status`)),
    map(res => {
      lastCheckTime = Date.now();
      lastCheckResult = res.isActive;
      
      if (res.isActive) {
        authStore.setPresenceActive(true);
        return true;
      } else {
        authStore.setPresenceActive(false);
        authStore.clearToken();
        isRedirecting = true;
        router.navigate(['/access-denied']).then(() => isRedirecting = false);
        return false;
      }
    }),
    catchError((err) => {
      lastCheckTime = Date.now();
      lastCheckResult = false;
      authStore.setPresenceActive(false);
      authStore.clearToken();
      isRedirecting = true;
      router.navigate(['/access-denied']).then(() => isRedirecting = false);
      return of(false);
    })
  );
};
