import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, updateEntity, addEntity, removeEntity, updateAllEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { SalesService, Order, OrderStatus, OrderType, Customer } from '../services/sales.service';
import { Router } from '@angular/router';

import { I18nService } from '../i18n/i18n.service';

interface OrdersState {
  loading: boolean;
  saving: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  filterStatus: OrderStatus | null;
  filterType: OrderType | null;
  error: string | null;
  lastFetched: number | null;
  lastParams: string | null;
}

const initialState: OrdersState = {
  loading: false,
  saving: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchTerm: '',
  filterStatus: null,
  filterType: null,
  error: null,
  lastFetched: null,
  lastParams: null,
};

export const OrdersStore = signalStore(
  { providedIn: 'root' },
  withEntities<Order>(),
  withState(initialState),
  withComputed(({ entities, total, pageSize }) => ({
    allOrders: entities,
    totalPages: computed(() => Math.ceil(total() / pageSize())),
  })),
  withMethods((store) => {
    const salesService = inject(SalesService);
    const router = inject(Router);
    const i18n = inject(I18nService);

    const loadOrdersAction = rxMethod<{ page: number; limit: number; search?: string; status?: OrderStatus; type?: OrderType }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          salesService.getOrders(params).pipe(
            tapResponse({
              next: (res) => patchState(store,
                setAllEntities(res.data),
                { 
                  loading: false, 
                  total: res.total, 
                  currentPage: params.page, 
                  pageSize: params.limit,
                  searchTerm: params.search || '',
                  filterStatus: params.status || null,
                  filterType: params.type || null,
                  lastFetched: Date.now(),
                  lastParams: JSON.stringify(params)
                }
              ),
              error: (err: any) => patchState(store, { 
                loading: false, 
                error: err.error?.message || i18n.t('errors.load_orders') 
              }),
            })
          )
        )
      )
    );

    return {
      loadOrders: loadOrdersAction,

      ensureLoaded: (params: { page: number; limit: number; search?: string; status?: OrderStatus; type?: OrderType }, force = false) => {
        const CACHE_TTL = 5 * 60 * 1000;
        const last = store.lastFetched();
        const lastP = store.lastParams();
        const currentP = JSON.stringify(params);
        
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        const paramsChanged = lastP !== currentP;
        
        if (isStale || paramsChanged || force || store.ids().length === 0) {
          loadOrdersAction(params);
        }
      },

      loadOrder: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) =>
            salesService.getOrder(id).pipe(
              tapResponse({
                next: (order) => patchState(store, addEntity(order), { loading: false }),
                error: (err: any) => patchState(store, { 
                  loading: false, 
                  error: err.error?.message || i18n.t('errors.load_orders') 
                }),
              })
            )
          )
        )
      ),

      createOrder: rxMethod<any>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap((data) =>
            salesService.createOrder(data).pipe(
              tapResponse({
                next: (newOrder) => {
                  patchState(store, addEntity(newOrder), { saving: false, total: store.total() + 1 });
                  router.navigate(['/orders', newOrder.id]);
                },
                error: (err: any) => patchState(store, { 
                  saving: false, 
                  error: err.error?.message || i18n.t('errors.create_order') 
                }),
              })
            )
          )
        )
      ),

      updateOrder: rxMethod<{ id: string; data: any }>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, data }) =>
            salesService.updateOrder(id, data).pipe(
              tapResponse({
                next: (updated) => {
                   patchState(store, updateEntity({ id, changes: updated }), { saving: false });
                   router.navigate(['/orders', id]);
                },
                error: (err: any) => patchState(store, { 
                  saving: false, 
                  error: err.error?.message || i18n.t('errors.update_order') 
                }),
              })
            )
          )
        )
      ),

      updateOrderStatus: rxMethod<{ id: string; status: OrderStatus }>(
        pipe(
          tap(() => patchState(store, { saving: true })),
          switchMap(({ id, status }) =>
            salesService.updateOrder(id, { status }).pipe(
              tapResponse({
                next: (updated) => {
                   patchState(store, updateEntity({ id, changes: { status: updated.status } }), { saving: false });
                },
                error: (err: any) => patchState(store, { 
                  saving: false, 
                  error: err.error?.message || i18n.t('errors.update_order_status') 
                }),
              })
            )
          )
        )
      ),

      deleteOrder: rxMethod<string>(
        pipe(
          switchMap((id) =>
            salesService.deleteOrder(id).pipe(
              tapResponse({
                next: () => patchState(store, removeEntity(id), { total: store.total() - 1 }),
                error: (err: any) => patchState(store, { 
                  error: err.error?.message || i18n.t('errors.delete_order') 
                }),
              })
            )
          )
        )
      ),

      clearError: () => {
        patchState(store, { error: null });
      },

      syncCustomerUpdate: (updatedCustomer: Customer) => {
        patchState(store, updateAllEntities((order) => {
          if (order.customer.id === updatedCustomer.id) {
            return { ...order, customer: updatedCustomer };
          }
          return order;
        }));
      }
    };
  })
);
