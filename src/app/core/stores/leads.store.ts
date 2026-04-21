import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { withEntities, setAllEntities, addEntity, updateEntity, removeEntity } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { inject, computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { UserLeadService, Lead, LeadStatus } from '../services/user-lead.service';

import { I18nService } from '../i18n/i18n.service';

interface LeadsState {
  loading: boolean;
  adding: boolean;
  updating: boolean;
  total: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  filterStatus: string | null;
  filterState: string | null;
  filterHasReminder: string | null;
  filterCreatedBy: string | null;
  error: string | null;
  selectedLeadId: string | null;
  lastFetched: number | null;
  lastParams: string | null; // JSON string of last successful load params
}

const initialState: LeadsState = {
  loading: false,
  adding: false,
  updating: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchTerm: '',
  filterStatus: null,
  filterState: null,
  filterHasReminder: null,
  filterCreatedBy: null,
  error: null,
  selectedLeadId: null,
  lastFetched: null,
  lastParams: null
};

export const LeadsStore = signalStore(
  { providedIn: 'root' },
  withEntities<Lead>(),
  withState(initialState),
  withComputed(({ entities, total, currentPage, pageSize }) => ({
    allLeads: entities,
    totalPages: computed(() => Math.ceil(total() / pageSize())),
    isEmpty: computed(() => entities().length === 0),
  })),
  withMethods((store) => {
    const leadService = inject(UserLeadService);
    const i18n = inject(I18nService);

    const loadLeadsAction = rxMethod<{ page: number; limit: number; search?: string; status?: string; state?: string; hasReminder?: string; createdBy?: string }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((params) =>
          leadService.getLeads(params).pipe(
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
                  filterState: params.state || null,
                  filterHasReminder: params.hasReminder || null,
                  filterCreatedBy: params.createdBy || null,
                  lastFetched: Date.now(),
                  lastParams: JSON.stringify(params)
                }
              ),
              error: (err: any) => patchState(store, { 
                loading: false, 
                error: err.error?.message || i18n.t('errors.load_leads') 
              }),
            })
          )
        )
      )
    );

    return {
      loadLeads: loadLeadsAction,
      
      ensureLoaded: (params: { page: number; limit: number; search?: string; status?: string; state?: string; hasReminder?: string; createdBy?: string }, force = false) => {
        const CACHE_TTL = 5 * 60 * 1000;
        const last = store.lastFetched();
        const lastP = store.lastParams();
        const currentP = JSON.stringify(params);
        
        const isStale = !last || (Date.now() - last) > CACHE_TTL;
        const paramsChanged = lastP !== currentP;
        
        if (isStale || paramsChanged || force || store.isEmpty()) {
          loadLeadsAction(params);
        }
      },

      importLeads: rxMethod<Partial<Lead>[]>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((leads) =>
            leadService.bulkImport(leads).pipe(
              tapResponse({
                next: () => {
                  patchState(store, { loading: false });
                  // Reload current page to see new data
                  loadLeadsAction({ 
                    page: store.currentPage(), 
                    limit: store.pageSize(),
                    search: store.searchTerm(),
                    status: store.filterStatus() || undefined,
                    state: store.filterState() || undefined,
                    hasReminder: store.filterHasReminder() || undefined,
                    createdBy: store.filterCreatedBy() || undefined
                  });
                },
                error: (err: any) => patchState(store, { 
                  loading: false, 
                  error: err.error?.message || i18n.t('errors.import_failed') 
                }),
              })
            )
          )
        )
      ),

      createLead: rxMethod<Partial<Lead>>(
        pipe(
          tap(() => patchState(store, { adding: true })),
          switchMap((data) =>
            leadService.createLead(data).pipe(
              tapResponse({
                next: (lead) => {
                  patchState(store, addEntity(lead), { adding: false, total: store.total() + 1 });
                  // Reload the first page to show the new lead and ensure list consistency
                  loadLeadsAction({ 
                    page: 1, 
                    limit: store.pageSize(),
                    search: store.searchTerm(),
                    status: store.filterStatus() || undefined,
                    state: store.filterState() || undefined,
                    hasReminder: store.filterHasReminder() || undefined,
                    createdBy: store.filterCreatedBy() || undefined
                  });
                },
                error: (err: any) => patchState(store, { 
                  adding: false, 
                  error: err.error?.message || i18n.t('errors.create_lead') 
                }),
              })
            )
          )
        )
      ),

      updateLead: rxMethod<{ id: string; changes: Partial<Lead> }>(
        pipe(
          tap(() => patchState(store, { updating: true })),
          switchMap(({ id, changes }) =>
            leadService.updateLead(id, changes).pipe(
              tapResponse({
                next: (updated) => patchState(store, updateEntity({ id, changes: updated }), { updating: false }),
                error: (err: any) => patchState(store, { 
                  updating: false,
                  error: err.error?.message || i18n.t('errors.update_lead') 
                }),
              })
            )
          )
        )
      ),

      updateLeadLocal(id: string, changes: Partial<Lead>) {
        patchState(store, updateEntity({ id, changes }));
      },

      deleteLead: rxMethod<string>(
        pipe(
          switchMap((id) =>
            leadService.deleteLead(id).pipe(
              tapResponse({
                next: () => patchState(store, removeEntity(id), { total: store.total() - 1 }),
                error: (err: any) => patchState(store, { 
                  error: err.error?.message || i18n.t('errors.delete_lead') 
                }),
              })
            )
          )
        )
      ),
      
      setSearch(term: string) {
        patchState(store, { searchTerm: term });
      },

      setPage(page: number) {
        patchState(store, { currentPage: page });
      },

      setSelectedLeadId(id: string | null) {
        patchState(store, { selectedLeadId: id });
      },

      clearError() {
        patchState(store, { error: null });
      }
    };
  })
);
