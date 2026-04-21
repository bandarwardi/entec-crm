import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SalesService, DashboardStats } from '../services/sales.service';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

interface DashboardState {
  stats: DashboardStats | null;
  todayAdminStats: { todayLeadsCount: number; employeePerformance: any[] } | null;
  loading: boolean;
  lastFetched: number | null;
  lastPeriod: string | null;
}

const initialState: DashboardState = {
  stats: null,
  todayAdminStats: null,
  loading: false,
  lastFetched: null,
  lastPeriod: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const salesService = inject(SalesService);

    const loadStats = rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((period) =>
          salesService.getDashboardStats(period).pipe(
            tapResponse({
              next: (stats) => patchState(store, { 
                stats, 
                loading: false, 
                lastFetched: Date.now(),
                lastPeriod: period 
              }),
              error: () => patchState(store, { loading: false }),
            })
          )
        )
      )
    );

    const loadTodayAdminStats = rxMethod<void>(
      pipe(
        switchMap(() =>
          salesService.getTodayAdminStats().pipe(
            tapResponse({
              next: (todayAdminStats) => patchState(store, { todayAdminStats }),
              error: () => {},
            })
          )
        )
      )
    );

    return {
      loadStats,
      loadTodayAdminStats,
      ensureStatsLoaded: (period: string, force = false) => {
        const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for dashboard
        const last = store.lastFetched();
        const lastP = store.lastPeriod();
        
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        const periodChanged = lastP !== period;
        
        if (isStale || periodChanged || force || !store.stats()) {
          loadStats(period);
        }
      }
    };
  })
);
