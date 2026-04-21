import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, updateEntity, addEntity, removeEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SalesService, Customer } from '../services/sales.service';
import { OrdersStore } from './orders.store';

import { I18nService } from '../i18n/i18n.service';

interface CustomersState {
  loading: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  error: string | null;
  lastFetched: number | null;
  lastParams: string | null;
}

const initialState: CustomersState = {
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchTerm: '',
  error: null,
  lastFetched: null,
  lastParams: null,
};

export const CustomersStore = signalStore(
  { providedIn: 'root' },
  withEntities<Customer>(),
  withState(initialState),
  withComputed(({ entityMap, total, pageSize }) => ({
    allCustomers: computed(() => Object.values(entityMap())),
    totalPages: computed(() => Math.ceil(total() / pageSize())),
  })),
  withMethods((store) => {
    const salesService = inject(SalesService);
    const i18n = inject(I18nService);
    const ordersStore = inject(OrdersStore);

    const loadCustomersAction = rxMethod<{ page: number; limit: number; search?: string }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          salesService.getCustomers(params).pipe(
            tapResponse({
              next: (res) => patchState(store,
                setAllEntities(res.data),
                { 
                  loading: false, 
                  total: res.total, 
                  currentPage: params.page, 
                  pageSize: params.limit,
                  searchTerm: params.search || '',
                  lastFetched: Date.now(),
                  lastParams: JSON.stringify(params)
                }
              ),
              error: (err: any) => patchState(store, { 
                loading: false, 
                error: err.error?.message || i18n.t('errors.load_customers') 
              }),
            })
          )
        )
      )
    );

    return {
      loadCustomers: loadCustomersAction,

      ensureLoaded: (params: { page: number; limit: number; search?: string }, force = false) => {
        const CACHE_TTL = 5 * 60 * 1000;
        const last = store.lastFetched();
        const lastP = store.lastParams();
        const currentP = JSON.stringify(params);
        
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        const paramsChanged = lastP !== currentP;
        
        if (isStale || paramsChanged || force || store.ids().length === 0) {
          loadCustomersAction(params);
        }
      },

      updateCustomer: rxMethod<{ id: string; changes: Partial<Customer> }>(
        pipe(
          switchMap(({ id, changes }) =>
            salesService.updateCustomer(id, changes).pipe(
              tapResponse({
                next: (updated) => {
                  patchState(store, updateEntity({ id, changes: updated }));
                  ordersStore.syncCustomerUpdate(updated);
                },
                error: (err: any) => patchState(store, { 
                  error: err.error?.message || i18n.t('errors.update_customer') 
                }),
              })
            )
          )
        )
      ),

      createCustomer: rxMethod<Partial<Customer>>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((data) =>
            salesService.createCustomer(data).pipe(
              tapResponse({
                next: (newC) => patchState(store, addEntity(newC), { loading: false, total: store.total() + 1 }),
                error: (err: any) => patchState(store, { 
                  loading: false, 
                  error: err.error?.message || i18n.t('errors.create_customer') 
                }),
              })
            )
          )
        )
      ),

      clearError: () => {
        patchState(store, { error: null });
      },
      
      deleteCustomer: rxMethod<string>(
        pipe(
          switchMap((id) =>
            salesService.deleteCustomer(id).pipe(
              tapResponse({
                next: () => patchState(store, removeEntity(id), { total: store.total() - 1 }),
                error: (err: any) => patchState(store, { 
                  error: err.error?.message || i18n.t('errors.delete_customer') 
                }),
              })
            )
          )
        )
      )
    };
  })
);
