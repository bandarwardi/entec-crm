import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../constants/api.constants';
import { Subject, Observable } from 'rxjs';
import { WhatsappStore } from '../stores/whatsapp.store';

@Injectable({
  providedIn: 'root'
})
export class WhatsappSocketService {
  private socket: Socket | null = null;
  private readonly store = inject(WhatsappStore);
  
  private messageSubject = new Subject<any>();
  public onMessage$ = this.messageSubject.asObservable();

  constructor() {
    const socketUrl = API_BASE_URL.replace('/api', '');
    this.socket = io(`${socketUrl}/whatsapp`, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to WhatsApp socket');
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    // We can't easily listen to dynamic event names here without knowing sessionIds
    // But the store updates will happen in the components that use this service
    // Or we can provide a method to register session listeners
  }

  listenToSession(sessionId: string) {
    if (!this.socket) return;

    this.socket.off(`wa:qr:${sessionId}`);
    this.socket.off(`wa:status:${sessionId}`);
    this.socket.off(`wa:message:${sessionId}`);

    this.socket.on(`wa:qr:${sessionId}`, (data: any) => {
      this.store.updateChannelQr(sessionId, data.qrCode);
    });

    this.socket.on(`wa:status:${sessionId}`, (data: any) => {
      this.store.updateChannelStatus(sessionId, data.status);
    });

    this.socket.on(`wa:message:${sessionId}`, (data: any) => {
      this.messageSubject.next({ sessionId, ...data });
    });
    
    // Join the room for this session
    this.socket.emit('join:session', sessionId);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
