import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { API_BASE_URL } from '../constants/api.constants';
import { auth } from '../firebase/firebase.config';
import { signInWithCustomToken, signOut } from 'firebase/auth';

export enum UserStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BREAK = 'break',
  BUSY = 'busy',
}

export enum BreakReason {
  WORK_CALL = 'work_call',
  URGENT_CALL = 'urgent_call',
  BATHROOM = 'bathroom',
  LUNCH = 'lunch',
  PRAYER = 'prayer',
  OTHER = 'other',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super-admin' | 'admin' | 'agent';
  currentStatus?: UserStatus;
}

interface AuthState {
  user: User | null;
  token: string | null;
  firebaseToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  firebaseToken: localStorage.getItem('firebaseToken'),
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, token }) => ({
    isLoggedIn: computed(() => !!token()),
    currentRole: computed(() => user()?.role ?? null),
    hasRole: computed(() => (role: string) =>
      user()?.role === role || user()?.role === 'super-admin'
    ),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);
    const router = inject(Router);
    const apiUrl = `${API_BASE_URL}/auth`;
    let refreshInterval: any = null;

    const stopRefreshTimer = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };

    const startRefreshTimer = () => {
      stopRefreshTimer();
      // Refresh every 10 minutes (JWTs are usually short-lived)
      refreshInterval = setInterval(() => {
        if (store.isLoggedIn()) {
          // Trigger the rxMethod
          (store as any).refreshToken();
        }
      }, 10 * 60 * 1000);
    };

    const loginToFirebase = async (token: string) => {
      try {
        await signInWithCustomToken(auth, token);
        console.log('Firebase: Logged in successfully with custom token');
      } catch (error) {
        console.error('Firebase: Failed to login with custom token', error);
      }
    };

    return {
      login: rxMethod<{ email: string; password: string; lat?: number; lng?: number; device?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((creds) =>
            http.post<any>(`${apiUrl}/login`, creds).pipe(
              tapResponse({
                next: (res) => {
                  if (res.access_token) {
                    patchState(store, {
                      user: res.user,
                      token: res.access_token,
                      firebaseToken: res.firebaseToken,
                      loading: false
                    });
                    localStorage.setItem('token', res.access_token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    if (res.firebaseToken) {
                      localStorage.setItem('firebaseToken', res.firebaseToken);
                      loginToFirebase(res.firebaseToken);
                    }
                    startRefreshTimer();
                  } else {
                    patchState(store, {
                      loading: false,
                      error: res.message // Show the pending approval message
                    });
                  }
                },
                error: (err: any) => {
                  const errorMsg = err.error?.message || 'فشل تسجيل الدخول';
                  patchState(store, {
                    loading: false,
                    error: errorMsg
                  });
                },
              })
            )
          )
        )
      ),

      logout() {
        stopRefreshTimer();
        const currentToken = store.token();
        if (currentToken) {
          http.post(`${apiUrl}/logout`, {}).subscribe();
        }
        signOut(auth).catch(err => console.error('Firebase: Signout failed', err));
        patchState(store, { user: null, token: null, firebaseToken: null });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('firebaseToken');
        router.navigate(['/auth/login']);
      },

      updateStatus: rxMethod<{ status: UserStatus; breakReason?: BreakReason; notes?: string }>(
        pipe(
          switchMap((data) =>
            http.put<User>(`${API_BASE_URL}/users/status`, data).pipe(
              tapResponse({
                next: (updatedUser) => {
                  patchState(store, { user: updatedUser });
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                },
                error: (err: any) => console.error('Failed to update status', err),
              })
            )
          )
        )
      ),

      clearError() {
        patchState(store, { error: null });
      },

      setError(error: string) {
        patchState(store, { error });
      },

      async init() {
        if (store.isLoggedIn()) {
          startRefreshTimer();
          const fbToken = store.firebaseToken();
          if (fbToken) {
            await loginToFirebase(fbToken);
          }
        }
      },

      refreshToken: rxMethod<void>(
        pipe(
          switchMap(() => {
            const user = store.user();
            if (!user || !store.token()) return [];
            return http.post<any>(`${apiUrl}/refresh`, user).pipe(
              tapResponse({
                next: (res) => {
                  if (res.access_token) {
                    patchState(store, {
                      user: res.user,
                      token: res.access_token,
                      firebaseToken: res.firebaseToken
                    });
                    localStorage.setItem('token', res.access_token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    if (res.firebaseToken) {
                      localStorage.setItem('firebaseToken', res.firebaseToken);
                      loginToFirebase(res.firebaseToken);
                    }
                  }
                },
                error: (err: any) => {
                  console.error('Failed to refresh token', err);
                },
              })
            );
          })
        )
      ),

      verifyPassword(password: string) {
        return http.post<{ isValid: boolean }>(`${apiUrl}/verify-password`, { password });
      }
    };
  })
);
