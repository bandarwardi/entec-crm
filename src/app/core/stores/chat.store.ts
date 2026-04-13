import { signalStore, withState, withMethods, withComputed, patchState, withHooks } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, filter, fromEvent } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { ChatService } from '../services/chat.service';
import { AuthStore } from './auth.store';
import { I18nService } from '../i18n/i18n.service';
import { API_BASE_URL } from '../constants/api.constants';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: 'image' | 'file' | null;
  originalFileName: string | null;
  isRead: boolean;
  createdAt: string | Date; // Backend sends string
  sender?: {
    id: string;
    name: string;
  };
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
}

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  messagesLoading: false,
  sending: false,
  hasMore: true,
  error: null,
};

export const ChatStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const http = inject(HttpClient);
    const chatService = inject(ChatService);
    const authStore = inject(AuthStore);
    const i18n = inject(I18nService);
    const apiUrl = `${API_BASE_URL}/chat`;

    const loadConversations = rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          http.get<Conversation[]>(`${apiUrl}/conversations`).pipe(
            tapResponse({
              next: (conversations) => patchState(store, { conversations, loading: false }),
              error: (err: any) => patchState(store, { 
                error: err.error?.message || i18n.t('errors.load_conversations'), 
                loading: false 
              }),
            })
          )
        )
      )
    );

    const loadMessages = rxMethod<{ conversationId: string; before?: string }>(
      pipe(
        tap(() => patchState(store, { messagesLoading: true })),
        switchMap(({ conversationId, before }) =>
          http.get<Message[]>(`${apiUrl}/conversations/${conversationId}/messages`, {
            params: { before: before || '', limit: 15 }
          }).pipe(
            tapResponse({
              next: (newMessages) => {
                patchState(store, (state) => ({
                  messages: before ? [...newMessages, ...state.messages] : newMessages,
                  messagesLoading: false,
                  hasMore: newMessages.length === 15
                }));
              },
              error: (err: any) => patchState(store, { 
                error: err.error?.message || i18n.t('errors.load_messages'), 
                messagesLoading: false 
              }),
            })
          )
        )
      )
    );

    const selectConversation = (conversation: Conversation) => {
      patchState(store, { 
        activeConversation: conversation, 
        messages: [], 
        hasMore: true 
      });
      loadMessages({ conversationId: conversation.id });
      chatService.markAsRead(conversation.id, conversation.otherUser.id);
      
      patchState(store, (state) => ({
          conversations: state.conversations.map(c => 
              c.id === conversation.id ? { ...c, unreadCount: 0 } : c
          )
      }));
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
      if (!active || !content.trim()) return;

      chatService.sendMessage({
          conversationId: active.id,
          content: content.trim()
      });
    };

    const sendMedia = (file: File) => {
      const active = store.activeConversation();
      if (!active) return;

      const formData = new FormData();
      formData.append('file', file);

      patchState(store, { sending: true });
      http.post<Message>(`${apiUrl}/conversations/${active.id}/upload`, formData).pipe(
          tapResponse({
              next: (message) => {
                  patchState(store, { sending: false });
                  addMessage(message);
              },
              error: (err: any) => patchState(store, { 
                  error: err.error?.message || i18n.t('errors.send_file'), 
                  sending: false 
              }),
          })
      ).subscribe();
    };

    const addMessage = (message: Message) => {
      console.log('ChatStore: addMessage called with', message);
      patchState(store, (state) => {
          const activeConv = state.activeConversation;
          const msgConvId = message.conversationId || (message as any).conversation;
          console.log('ChatStore: msgConvId', msgConvId, 'activeConvId', activeConv?.id);
          const isForActive = activeConv?.id === msgConvId;
          const updatedMessages = isForActive ? [...state.messages, message] : state.messages;
          
          const updatedConversations = state.conversations.map(c => {
              if (c.id === msgConvId) {
                  return { 
                      ...c, 
                      lastMessage: message, 
                      lastMessageAt: message.createdAt,
                      unreadCount: isForActive ? 0 : c.unreadCount + 1
                  };
              }
              return c;
          });

          updatedConversations.sort((a, b) => {
              const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return dateB - dateA;
          });

          if (isForActive && activeConv) {
              chatService.markAsRead(message.conversationId, activeConv.otherUser.id);
          }

          return {
              messages: updatedMessages,
              conversations: updatedConversations
          };
      });
    };

    const updateTyping = (data: { conversationId: string; isTyping: boolean }) => {
      patchState(store, (state) => ({
          conversations: state.conversations.map(c => 
              c.id === data.conversationId ? { ...c, isTyping: data.isTyping } : c
          )
      }));
    };

    const updateMessagesRead = (data: { conversationId: string; readerId: string }) => {
      patchState(store, (state) => {
          // If the reader is NOT the current user, it means the other person read OUR messages
          const isOtherPersonReading = data.readerId !== authStore.user()?.id;
          
          if (isOtherPersonReading && state.activeConversation?.id === data.conversationId) {
              return {
                  messages: state.messages.map(m => ({ ...m, isRead: true }))
              };
          }
          return state;
      });
    };

    const loadMore = () => {
      const active = store.activeConversation();
      const messages = store.messages();
      if (active && messages.length > 0 && store.hasMore() && !store.messagesLoading()) {
        const firstMessage = messages[0];
        loadMessages({ 
          conversationId: active.id, 
          before: firstMessage.createdAt.toString() 
        });
      }
    };

    const init = () => {
        chatService.connect();
        loadConversations();
        chatService.newMessage$.subscribe(msg => {
            console.log('ChatStore: Subscription received newMessage', msg);
            addMessage(msg);
        });
        chatService.userTyping$.subscribe(data => updateTyping(data));
        chatService.messagesRead$.subscribe(data => updateMessagesRead(data));
    };

    const clearError = () => {
        patchState(store, { error: null });
    };

    return {
      loadConversations,
      selectConversation,
      startConversation,
      loadMessages,
      loadMore,
      sendMessage,
      sendMedia,
      addMessage,
      updateTyping,
      clearError,
      init
    };
  }),
  withHooks({
      onInit(store) {
          store.init();
      },
      onDestroy(store) {
          inject(ChatService).disconnect();
      }
  })
);
