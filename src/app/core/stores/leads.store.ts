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
  total: number;
  currentPage: number;
  pageSize: number;
  searchTerm: string;
  filterStatus: string | null;
  filterState: string | null;
  filterHasReminder: string | null;
  filterCreatedBy: string | null;
  error: string | null;
}

const initialState: LeadsState = {
  loading: false,
  adding: false,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  searchTerm: '',
  filterStatus: null,
  filterState: null,
  filterHasReminder: null,
  filterCreatedBy: null,
  error: null,
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
        switchMap(({ page, limit, search, status, state, hasReminder, createdBy }) =>
          leadService.getLeads({ page, limit, search, status, state, hasReminder, createdBy }).pipe(
            tapResponse({
              next: (res) => patchState(store,
                setAllEntities(res.data),
                { 
                  loading: false, 
                  total: res.total, 
                  currentPage: page, 
                  pageSize: limit,
                  searchTerm: search || '',
                  filterStatus: status || null,
                  filterState: state || null,
                  filterHasReminder: hasReminder || null,
                  filterCreatedBy: createdBy || null
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
          switchMap(({ id, changes }) =>
            leadService.updateLead(id, changes).pipe(
              tapResponse({
                next: (updated) => patchState(store, updateEntity({ id, changes: updated })),
                error: (err: any) => patchState(store, { 
                  error: err.error?.message || i18n.t('errors.update_lead') 
                }),
              })
            )
          )
        )
      ),

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

      clearError() {
        patchState(store, { error: null });
      }
    };
  })
);
