import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { MessageService } from 'primeng/api';
import { API_BASE_URL } from '../constants/api.constants';

export interface LoginRequest {
  id: number;
  user: { name: string; email: string };
  latitude: number;
  longitude: number;
  deviceInfo: string;
  ipAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface LoginLog {
  id: string;
  user: { name: string; email: string };
  email: string;
  status: string;
  ipAddress: string;
  deviceFingerprint: string;
  deviceInfo: string;
  platform: string;
  failureReason: string;
  timestamp: string;
}

interface LoginRequestsState {
  requests: LoginRequest[];
  history: LoginRequest[];
  loginLogs: LoginLog[];
  loginLogsTotal: number;
  loading: boolean;
  error: string | null;
  lastRequestsFetched: number | null;
  lastHistoryFetched: number | null;
  lastLogsFetched: number | null;
}

const initialState: LoginRequestsState = {
  requests: [],
  history: [],
  loginLogs: [],
  loginLogsTotal: 0,
  loading: false,
  error: null,
  lastRequestsFetched: null,
  lastHistoryFetched: null,
  lastLogsFetched: null,
};

export const LoginRequestsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const http = inject(HttpClient);
    const messageService = inject(MessageService);
    const apiUrl = `${API_BASE_URL}/auth`;

    const loadRequestsAction = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          http.get<LoginRequest[]>(`${apiUrl}/pending-requests`).pipe(
            tapResponse({
              next: (requests) => patchState(store, { 
                requests, 
                loading: false,
                lastRequestsFetched: Date.now() 
              }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
            })
          )
        )
      )
    );

    const loadHistoryAction = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          http.get<LoginRequest[]>(`${apiUrl}/history-requests`).pipe(
            tapResponse({
              next: (history) => patchState(store, { 
                history, 
                loading: false,
                lastHistoryFetched: Date.now()
              }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
            })
          )
        )
      )
    );

    const loadLogsAction = rxMethod<{ page: number; limit: number }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          http.get<{ data: LoginLog[]; total: number }>(`${apiUrl}/login-logs`, { params: params as any }).pipe(
            tapResponse({
              next: (response) => patchState(store, { 
                loginLogs: response.data,
                loginLogsTotal: response.total,
                loading: false,
                lastLogsFetched: Date.now()
              }),
              error: (err: any) => patchState(store, { loading: false, error: err.error?.message })
            })
          )
        )
      )
    );

    return {
      loadRequests: loadRequestsAction,

      ensureRequestsLoaded: (force = false) => {
        const CACHE_TTL = 30 * 1000; // Shorter cache for login requests as they are sensitive
        const last = store.lastRequestsFetched();
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        if (isStale || force || store.requests().length === 0) {
          loadRequestsAction();
        }
      },

      loadHistory: loadHistoryAction,

      ensureHistoryLoaded: (force = false) => {
        const CACHE_TTL = 2 * 60 * 1000;
        const last = store.lastHistoryFetched();
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        if (isStale || force || store.history().length === 0) {
          loadHistoryAction();
        }
      },

      loadLogs: loadLogsAction,

      ensureLogsLoaded: (page = 1, limit = 50, force = false) => {
        const CACHE_TTL = 30 * 1000;
        const last = store.lastLogsFetched();
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        if (isStale || force || store.loginLogs().length === 0) {
          loadLogsAction({ page, limit });
        }
      },

      updateStatus: rxMethod<{ id: number; status: string; trustDevice?: boolean }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ id, status, trustDevice }) =>
            http.put(`${apiUrl}/request/${id}/${status}`, { trustDevice }).pipe(
              tapResponse({
                next: () => {
                  patchState(store, {
                    requests: store.requests().filter(r => r.id !== id),
                    loading: false
                  });
                  messageService.add({ 
                    severity: 'success', 
                    summary: 'نجاح', 
                    detail: status === 'approved' ? 'تمت الموافقة على الدخول' : 'تم رفض الطلب' 
                  });
                },
                error: (err: any) => {
                  patchState(store, { loading: false });
                  messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحديث الحالة' });
                }
              })
            )
          )
        )
      )
    };
  })
);
