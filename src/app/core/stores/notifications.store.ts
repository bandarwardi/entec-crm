import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { inject, computed, effect, untracked } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, startWith, interval, tap } from 'rxjs';
import { UserLeadService, Lead } from '../services/user-lead.service';
import { AuthStore } from './auth.store';

interface NotificationsState {
  reminders: Lead[];
  loading: boolean;
  badgeVisible: boolean;
}

const initialState: NotificationsState = {
  reminders: [],
  loading: false,
  badgeVisible: false,
};

export const NotificationsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ reminders, badgeVisible }) => ({
    unreadCount: computed(() => badgeVisible() ? reminders().length : 0),
    hasReminders: computed(() => reminders().length > 0),
  })),
  withMethods((store) => {
    const leadService = inject(UserLeadService);
    const authStore = inject(AuthStore);

    return {
      setReminders(reminders: Lead[]) {
        patchState(store, { reminders, badgeVisible: reminders.length > 0 });
      },

      loadReminders: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() => leadService.getReminders()),
          tap((data) => {
             // Show badge only if new items found
             const hasNew = data.length > store.reminders().length;
             patchState(store, { reminders: data, loading: false, badgeVisible: hasNew || store.badgeVisible() });
          })
        )
      ),

      startPolling: rxMethod<void>(
        pipe(
          switchMap(() => interval(60000).pipe(startWith(0))),
          switchMap(() => {
            if (untracked(authStore.isLoggedIn)) {
              return leadService.getReminders();
            }
            return [];
          }),
          tap((data) => {
             const currentIds = new Set(store.reminders().map(r => r.id));
             const hasNew = data.some(r => !currentIds.has(r.id));
             patchState(store, { 
               reminders: data, 
               badgeVisible: hasNew ? true : store.badgeVisible() 
             });
          })
        )
      ),

      markAsRead: rxMethod<void>(
        pipe(
          switchMap(() => leadService.markRemindersAsRead()),
          tap(() => patchState(store, { badgeVisible: false }))
        )
      ),

      clearReminders() {
        patchState(store, { reminders: [], badgeVisible: false });
      }
    };
  })
);
