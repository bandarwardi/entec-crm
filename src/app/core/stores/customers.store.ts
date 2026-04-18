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
}

const initialState: CustomersState = {
  loading: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchTerm: '',
  error: null,
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

    return {
      loadCustomers: rxMethod<{ page: number; limit: number; search?: string }>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({ page, limit, search }) =>
            salesService.getCustomers({ page, limit, search }).pipe(
              tapResponse({
                next: (res) => patchState(store,
                  setAllEntities(res.data),
                  { 
                    loading: false, 
                    total: res.total, 
                    currentPage: page, 
                    pageSize: limit,
                    searchTerm: search || ''
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
      ),

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
