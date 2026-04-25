import { signalStore, withState, withMethods, patchState, withComputed } from '@ngrx/signals';
import { inject, computed, effect } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { WhatsappService, WhatsappChannel } from '../services/whatsapp.service';
import { MessageService } from 'primeng/api';
import { AuthStore } from './auth.store';
import { db } from '../firebase/firebase.config';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';

interface WhatsappState {
  channels: WhatsappChannel[];
  loading: boolean;
  error: string | null;
}

const initialState: WhatsappState = {
  channels: [],
  loading: false,
  error: null,
};

export const WhatsappStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ channels }) => ({
    connectedCount: computed(() => channels().filter(c => c.status === 'connected').length),
    pendingCount: computed(() => channels().filter(c => c.status === 'qr_pending').length),
  })),
  withMethods((store) => {
    const whatsappService = inject(WhatsappService);
    const messageService = inject(MessageService);
    const authStore = inject(AuthStore);
    let unsubscribe: (() => void) | undefined;

    effect(() => {
      const isPresenceActive = authStore.presenceActive();
      const isLoggedIn = authStore.isLoggedIn();

      if (isLoggedIn && isPresenceActive) {
        // Start listening
        if (!unsubscribe) {
          const q = query(collection(db, 'whatsappChannels'));
          unsubscribe = onSnapshot(q, (snapshot) => {
            const channels = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              lastConnectedAt: (doc.data()['lastConnectedAt'] as Timestamp)?.toDate()
            })) as WhatsappChannel[];
            patchState(store, { channels });
          });
        }
      } else {
        // Stop listening
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        patchState(store, { channels: [] });
      }
    });

    return {
      startListening() {
        // Now handled by effect
      },
      stopListening() {
        // Now handled by effect
      },

      loadChannels: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(() => whatsappService.getChannels().pipe(
            tap((channels) => patchState(store, { channels, loading: false })),
            catchError((err) => {
              patchState(store, { error: err.message, loading: false });
              return of([]);
            })
          ))
        )
      ),

      createChannel: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((label) => whatsappService.createChannel(label).pipe(
            tap((newChannel) => {
              patchState(store, { 
                channels: [...store.channels(), newChannel],
                loading: false 
              });
              messageService.add({ severity: 'success', summary: 'Success', detail: 'Channel created' });
            }),
            catchError((err) => {
              patchState(store, { error: err.message, loading: false });
              messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create channel' });
              return of(null);
            })
          ))
        )
      ),

      deleteChannel: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) => whatsappService.deleteChannel(id).pipe(
            tap(() => {
              patchState(store, { 
                channels: store.channels().filter(c => c.id !== id),
                loading: false 
              });
              messageService.add({ severity: 'success', summary: 'Success', detail: 'Channel deleted' });
            }),
            catchError((err) => {
              patchState(store, { error: err.message, loading: false });
              messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete channel' });
              return of(null);
            })
          ))
        )
      ),

      updateChannelAgents: rxMethod<{id: string, agents: string[], allAgentsAccess: boolean}>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap(({id, agents, allAgentsAccess}) => whatsappService.updateChannelAgents(id, agents, allAgentsAccess).pipe(
            tap((updated) => {
              patchState(store, { 
                channels: store.channels().map(c => c.id === id ? updated : c),
                loading: false 
              });
              messageService.add({ severity: 'success', summary: 'Success', detail: 'Agents updated' });
            }),
            catchError((err) => {
              patchState(store, { error: err.message, loading: false });
              messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update agents' });
              return of(null);
            })
          ))
        )
      ),

      reconnectChannel: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { loading: true })),
          switchMap((id) => whatsappService.reconnectChannel(id).pipe(
            tap(() => patchState(store, { loading: false })),
            catchError((err) => {
              patchState(store, { error: err.message, loading: false });
              return of(null);
            })
          ))
        )
      ),

      updateChannelStatus(sessionId: string, status: any) {
        patchState(store, {
          channels: store.channels().map(c => 
            c.sessionId === sessionId ? { ...c, status } : c
          )
        });
      },

      updateChannelQr(sessionId: string, qrCode: string) {
        patchState(store, {
          channels: store.channels().map(c => 
            c.sessionId === sessionId ? { ...c, qrCode, status: 'qr_pending' } : c
          )
        });
      },

      requestPairingCode(channelId: string, phoneNumber: string) {
        return whatsappService.requestPairingCode(channelId, phoneNumber);
      }
    };
  })
);
