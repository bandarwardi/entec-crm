import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { UserService, User } from '@/app/core/services/user.service';

import { I18nService } from '../i18n/i18n.service';

interface UsersState {
  loading: boolean;
  dialogVisible: boolean;
  selectedUser: User | null;
  error: string | null;
  lastFetched: number | null;
  lastSearch: string | null;
}

const initialState: UsersState = {
  loading: false,
  dialogVisible: false,
  selectedUser: null,
  error: null,
  lastFetched: null,
  lastSearch: null,
};

export const UsersStore = signalStore(
  { providedIn: 'root' },
  withEntities<User>(),
  withState(initialState),
  withMethods((store) => {
    const userService = inject(UserService);
    const i18n = inject(I18nService);

    const loadUsersAction = rxMethod<string | void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((search) =>
          userService.getUsers(search || undefined).pipe(
            tapResponse({
              next: (users) => patchState(store, 
                setAllEntities(users), 
                { 
                  loading: false, 
                  error: null,
                  lastFetched: Date.now(),
                  lastSearch: search || null
                }
              ),
              error: (err: any) => patchState(store, { 
                loading: false, 
                error: err.error?.message || i18n.t('errors.load_users') 
              }),
            })
          )
        )
      )
    );

    return {
      loadUsers: loadUsersAction,

      ensureLoaded: (search?: string, force = false) => {
        const CACHE_TTL = 5 * 60 * 1000;
        const last = store.lastFetched();
        const lastS = store.lastSearch();
        const currentS = search || null;
        
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        const searchChanged = lastS !== currentS;
        
        if (isStale || searchChanged || force || store.ids().length === 0) {
          loadUsersAction(search);
        }
      },

      createUser: rxMethod<Partial<User>>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((user) =>
            userService.createUser(user).pipe(
              tapResponse({
                next: (created) => {
                  patchState(store, addEntity(created), { loading: false, dialogVisible: false });
                },
                error: (err: any) => {
                  const msg = err.error?.message || i18n.t('errors.create_user');
                  patchState(store, { loading: false, error: msg });
                }
              })
            )
          )
        )
      ),

      updateUser: rxMethod<{ id: string; changes: Partial<User> }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ id, changes }) =>
            userService.updateUser(id, changes).pipe(
              tapResponse({
                next: (updated) => {
                  patchState(store, updateEntity({ id, changes: updated }), { loading: false, dialogVisible: false });
                },
              error: (err: any) => patchState(store, { 
                loading: false, 
                error: err.error?.message || i18n.t('errors.update_user') 
              }),
              })
            )
          )
        )
      ),

      deleteUser: rxMethod<string>(
        pipe(
          switchMap((id) =>
            userService.deleteUser(id).pipe(
              tapResponse({
                next: () => patchState(store, removeEntity(id)),
                error: (err: any) => console.error('Delete failed', err),
              })
            )
          )
        )
      ),

      openDialog(user: User | null = null) {
        const defaultUser: Partial<User> = { name: '', email: '', role: 'agent' };
        patchState(store, { 
          dialogVisible: true, 
          selectedUser: user ? { ...user } : (defaultUser as User) 
        });
      },

      closeDialog() {
        patchState(store, { dialogVisible: false, selectedUser: null, error: null });
      },

      clearError() {
        patchState(store, { error: null });
      }
    };
  })
);
