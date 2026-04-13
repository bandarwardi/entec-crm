import { Injectable, inject } from '@angular/core';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { AuthStore } from '../stores/auth.store';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;
  private authStore = inject(AuthStore);
  private apiUrl = 'http://localhost:3000';

  private newMessageSubject = new Subject<any>();
  newMessage$ = this.newMessageSubject.asObservable();

  private userTypingSubject = new Subject<any>();
  userTyping$ = this.userTypingSubject.asObservable();

  private messagesReadSubject = new Subject<any>();
  messagesRead$ = this.messagesReadSubject.asObservable();

  connect() {
    const token = this.authStore.token();
    if (!token || (this.socket && this.socket.connected)) return;

    this.socket = io(this.apiUrl, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('newMessage', (message: any) => {
      this.newMessageSubject.next(message);
    });

    this.socket.on('userTyping', (data: any) => {
      this.userTypingSubject.next(data);
    });

    this.socket.on('messagesRead', (data: any) => {
      this.messagesReadSubject.next(data);
    });

    this.socket.on('connect', () => {
      console.log('Connected to Chat WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Chat WebSocket');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: { conversationId: number; content?: string; mediaUrl?: string; mediaType?: string; originalFileName?: string }) {
    if (this.socket) {
      this.socket.emit('sendMessage', data);
    }
  }

  emitTyping(conversationId: number, recipientId: number, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { conversationId, recipientId, isTyping });
    }
  }

  markAsRead(conversationId: number, recipientId: number) {
    if (this.socket) {
      this.socket.emit('markAsRead', { conversationId, recipientId });
    }
  }
}
