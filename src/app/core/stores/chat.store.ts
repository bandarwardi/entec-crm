import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { tapResponse } from '@ngrx/operators';
import { ChatService } from '../services/chat.service';
import { AuthStore } from './auth.store';
import { I18nService } from '../i18n/i18n.service';
import { API_BASE_URL } from '../constants/api.constants';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'file' | null;
  originalFileName: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

export interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string | Date | null;
  isTyping?: boolean;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  hasMore: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  messagesLoading: false,
  sending: false,
  hasMore: false,
  error: null,
  initialized: false,
};

let messagesSub: Subscription | null = null;
const metaSubs: Map<string, Subscription> = new Map();

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const http = inject(HttpClient);
    const chatService = inject(ChatService);
    const authStore = inject(AuthStore);
    const i18n = inject(I18nService);
    const router = inject(Router);
    const apiUrl = `${API_BASE_URL}/chat`;

    const loadConversations = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          http.get<Conversation[]>(`${apiUrl}/conversations`).pipe(
            tapResponse({
              next: (conversations) => {
                patchState(store, { conversations, loading: false });
                // Subscribe to each conversation's metadata for live updates
                conversations.forEach(conv => subscribeToMeta(conv.id));
                // Set initialized to true after small delay to avoid notifications on load
                setTimeout(() => patchState(store, { initialized: true }), 2000);
              },
              error: (err: any) => patchState(store, {
                error: err.error?.message || i18n.t('errors.load_conversations'),
                loading: false
              }),
            })
          )
        )
      )
    );

    const subscribeToMeta = (conversationId: string) => {
      if (metaSubs.has(conversationId)) return;
      
      const sub = chatService.getConversationMeta(conversationId).subscribe(meta => {
        patchState(store, (state) => ({
          conversations: state.conversations.map(c => {
            if (c.id === conversationId) {
              const user = authStore.user();
              const myId = user?.id || (user as any)?._id;
              const unreadCount = meta.unreadCounts?.[myId] || 0;
              
              // Notification logic: if unreadCount increased and it's not my message
              if (state.initialized && unreadCount > c.unreadCount && meta.lastMessageSenderId !== myId) {
                // Only show notification if this is not the active conversation
                if (state.activeConversation?.id !== conversationId) {
                  showNotification({
                    senderName: c.otherUser.name,
                    content: meta.lastMessageContent,
                    mediaType: meta.lastMessageMediaType
                  });
                }
              }

              return {
                ...c,
                unreadCount,
                lastMessageAt: meta.lastMessageAt?.toDate() || c.lastMessageAt,
                lastMessage: {
                  ...c.lastMessage,
                  content: meta.lastMessageContent,
                  mediaType: meta.lastMessageMediaType,
                  senderId: meta.lastMessageSenderId
                } as Message
              };
            }
            return c;
          }).sort((a, b) => {
             const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
             const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
             return dateB - dateA;
          })
        }));
      });
      metaSubs.set(conversationId, sub);
    };

    const selectConversation = (conversation: Conversation) => {
      patchState(store, {
        activeConversation: conversation,
        messages: [],
        hasMore: false
      });

      // Cleanup old messages sub
      if (messagesSub) messagesSub.unsubscribe();

      // Subscribe to new messages
      patchState(store, { messagesLoading: true });
      messagesSub = chatService.getMessages(conversation.id).subscribe(messages => {
        patchState(store, { 
          messages: messages as Message[], 
          messagesLoading: false 
        });
        
        // Mark as read when messages arrive and conversation is active
        const user = authStore.user();
        const myId = user?.id || (user as any)?._id;
        if (myId) {
          chatService.markAsRead(conversation.id, myId);
        }
      });
    };

    const showNotification = (data: { senderName: string, content: string | null, mediaType: string | null }) => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const body = data.content || (data.mediaType === 'image' ? i18n.t('chat.image') : i18n.t('chat.file'));
      const notification = new Notification(`رسالة جديدة من ${data.senderName}`, {
        body: body,
        icon: '/favicon.ico'
      });

      notification.onclick = () => {
        window.focus();
        router.navigate(['/chat']);
        notification.close();
      };
    };

    const requestNotificationPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };

    const startConversation = rxMethod<{ userId: string }>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(({ userId }) =>
          http.post<Conversation>(`${apiUrl}/conversations`, { userId }).pipe(
            tapResponse({
              next: (conv) => {
                patchState(store, { loading: false });
                const conversations = store.conversations();
                const existing = conversations.find(c => c.id === conv.id);
                if (existing) {
                  selectConversation(existing);
                } else {
                  loadConversations();
                }
              },
              error: (err: any) => patchState(store, {
                error: err.error?.message || i18n.t('errors.start_conversation'),
                loading: false
              }),
            })
          )
        )
      )
    );

    const sendMessage = (content: string) => {
      const active = store.activeConversation();
      const user = authStore.user();
      if (!active || !user || !content.trim()) return;

      const myId = user.id || (user as any)._id;
      chatService.sendMessage(active.id, myId, user.name, content.trim(), active.otherUser.id)
        .catch(err => patchState(store, { error: i18n.t('errors.send_message') }));
    };

    const sendMedia = (file: File) => {
      const active = store.activeConversation();
      const user = authStore.user();
      if (!active || !user) return;

      const myId = user.id || (user as any)._id;
      const formData = new FormData();
      formData.append('file', file);

      patchState(store, { sending: true });
      http.post<any>(`${apiUrl}/conversations/${active.id}/upload`, formData).pipe(
        tapResponse({
          next: (mediaData) => {
            chatService.sendMediaMessage(active.id, myId, user.name, mediaData, active.otherUser.id)
              .then(() => patchState(store, { sending: false }))
              .catch(err => patchState(store, { 
                error: i18n.t('errors.send_file'),
                sending: false 
              }));
          },
          error: (err: any) => patchState(store, {
            error: err.error?.message || i18n.t('errors.send_file'),
            sending: false
          }),
        })
      ).subscribe();
    };

    const loadMore = () => {
      // Pagination not implemented for Firestore for now
    };

    const init = () => {
      const isLoggedIn = authStore.isLoggedIn();
      const isPresenceActive = authStore.presenceActive();
      
      if (isLoggedIn && isPresenceActive) {
        loadConversations();
        requestNotificationPermission();
      }
    };

    const cleanup = () => {
      if (messagesSub) messagesSub.unsubscribe();
      metaSubs.forEach(sub => sub.unsubscribe());
      metaSubs.clear();
      patchState(store, { 
        conversations: [], 
        messages: [], 
        activeConversation: null,
        initialized: false 
      });
    };

    // Effect to manage chat lifecycle based on presence
    effect(() => {
      const isActive = authStore.presenceActive();
      const isLoggedIn = authStore.isLoggedIn();
      
      if (isLoggedIn && isActive) {
        init();
      } else {
        cleanup();
      }
    });

    const clearError = () => {
      patchState(store, { error: null });
    };

    return {
      loadConversations,
      selectConversation,
      startConversation,
      loadMore,
      sendMessage,
      sendMedia,
      clearError,
      init,
      cleanup
    };
  }),
  withHooks({
    onInit(store) {
      store.init();
    },
    onDestroy(store) {
      store.cleanup();
    }
  })
);
