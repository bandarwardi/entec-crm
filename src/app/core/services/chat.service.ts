import { Injectable, inject } from '@angular/core';
import * as socketIo from 'socket.io-client';
import { AuthStore } from '../stores/auth.store';
import { SOCKET_URL } from '../constants/api.constants';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: any = null;
  private authStore = inject(AuthStore);
  private apiUrl = SOCKET_URL;

  private newMessageSubject = new Subject<any>();
  newMessage$ = this.newMessageSubject.asObservable();

  private userTypingSubject = new Subject<any>();
  userTyping$ = this.userTypingSubject.asObservable();

  private messagesReadSubject = new Subject<any>();
  messagesRead$ = this.messagesReadSubject.asObservable();

  connect() {
    const token = this.authStore.token();
    console.log('Attempting to connect to Chat WebSocket...', { url: this.apiUrl, hasToken: !!token });
    
    if (!token) {
      console.warn('No token found, skipping chat connection');
      return;
    }

    if (this.socket && this.socket.connected) {
      console.log('Socket already connected');
      return;
    }

    const ioFunc = (socketIo as any).io || (socketIo as any).default || socketIo;
    this.socket = ioFunc(this.apiUrl, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('newMessage', (message: any) => {
      console.log('WS: Received newMessage', message);
      this.newMessageSubject.next(message);
    });

    this.socket.on('userTyping', (data: any) => {
      this.userTypingSubject.next(data);
    });

    this.socket.on('messagesRead', (data: any) => {
      this.messagesReadSubject.next(data);
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to Chat WebSocket successfully');
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ WS Connection error:', error);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Disconnected from Chat WebSocket:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: { conversationId: string; content?: string; mediaUrl?: string; mediaType?: string; originalFileName?: string }) {
    if (this.socket) {
      this.socket.emit('sendMessage', data);
    }
  }

  emitTyping(conversationId: string, recipientId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, recipientId, isTyping });
    }
  }

  markAsRead(conversationId: string, recipientId: string) {
    if (this.socket) {
      this.socket.emit('markAsRead', { conversationId, recipientId });
    }
  }
}
