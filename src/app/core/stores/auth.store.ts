import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, of } from 'rxjs';
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
  challengeToken: string | null;
  challengeExpiresAt: Date | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  firebaseToken: localStorage.getItem('firebaseToken'),
  challengeToken: null,
  challengeExpiresAt: null,
  loading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, token, challengeToken }) => ({
    isLoggedIn: computed(() => !!token()),
    currentRole: computed(() => user()?.role ?? null),
    hasRole: computed(() => (role: string) =>
      user()?.role === role || user()?.role === 'super-admin'
    ),
    isWaitingChallenge: computed(() => !!challengeToken()),
  })),
  withMethods((store) => {
    const http = inject(HttpClient);
    const router = inject(Router);
    const apiUrl = `${API_BASE_URL}/auth`;
    let refreshInterval: any = null;
    let pollInterval: any = null;

    const stopRefreshTimer = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };

    const stopPollTimer = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }

    const refreshToken = rxMethod<void>(
      pipe(
        switchMap(() => {
          const user = store.user();
          if (!user || !store.token()) return of(null);
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
                }
              },
              error: (err: any) => {
                console.error('Failed to refresh token', err);
              },
            })
          );
        })
      )
    );

    const startRefreshTimer = () => {
      stopRefreshTimer();
      refreshInterval = setInterval(() => {
        if (store.isLoggedIn()) {
          refreshToken();
        }
      }, 10 * 60 * 1000);
    };

    const startPollingChallenge = (token: string) => {
      stopPollTimer();
      pollInterval = setInterval(() => {
        http.get<any>(`${apiUrl}/challenge-status/${token}`).subscribe({
          next: (res) => {
            if (res.status === 'approved') {
              stopPollTimer();
              patchState(store, {
                user: res.user,
                token: res.jwtToken,
                challengeToken: null,
                challengeExpiresAt: null,
                loading: false
              });
              localStorage.setItem('token', res.jwtToken);
              localStorage.setItem('user', JSON.stringify(res.user));
              startRefreshTimer();
            } else if (res.status === 'rejected') {
              stopPollTimer();
              patchState(store, { 
                error: 'تم رفض طلب الدخول من خلال التطبيق', 
                challengeToken: null, 
                challengeExpiresAt: null,
                loading: false 
              });
            } else if (res.status === 'expired') {
              stopPollTimer();
              patchState(store, { 
                error: 'انتهت المهلة الزمنية دون الموافقة من التطبيق', 
                challengeToken: null, 
                challengeExpiresAt: null,
                loading: false 
              });
            }
          },
          error: () => {
            stopPollTimer();
            patchState(store, { error: 'حدث خطأ أثناء التحقق من الطلب', challengeToken: null, loading: false });
          }
        });
      }, 2000); // Poll every 2 seconds
    }

    return {
      login: rxMethod<{ email: string; password: string; deviceFingerprint: string; browserInfo: string }>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null, challengeToken: null })),
          switchMap((creds) =>
            http.post<any>(`${apiUrl}/login`, creds).pipe(
              tapResponse({
                next: (res) => {
                  if (res.access_token) {
                    // Direct login (Bypassed)
                    patchState(store, {
                      user: res.user,
                      token: res.access_token,
                      loading: false
                    });
                    localStorage.setItem('token', res.access_token);
                    localStorage.setItem('user', JSON.stringify(res.user));
                    startRefreshTimer();
                  } else if (res.challengeToken) {
                    // Need MFA Challenge validation
                    patchState(store, {
                      challengeToken: res.challengeToken,
                      challengeExpiresAt: res.expiresAt,
                      loading: false
                    });
                    startPollingChallenge(res.challengeToken);
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

      cancelChallenge() {
        stopPollTimer();
        patchState(store, { challengeToken: null, challengeExpiresAt: null, loading: false });
      },

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
          // const fbToken = store.firebaseToken();
          // if (fbToken) {
          //   await loginToFirebase(fbToken);
          // }
        }
      },

      refreshToken,

      verifyPassword(password: string) {
        return http.post<{ isValid: boolean }>(`${apiUrl}/verify-password`, { password });
      }
    };
  })
);
