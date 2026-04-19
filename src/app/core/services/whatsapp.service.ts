import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../constants/api.constants';
import { Observable, map } from 'rxjs';

export interface WhatsappChannel {
  id: string;
  phoneNumber: string;
  label: string;
  sessionId: string;
  status: 'connected' | 'disconnected' | 'qr_pending' | 'banned' | 'wrong_number';
  qrCode?: string;
  lastConnectedAt?: Date;
  assignedAgents: any[];
  allAgentsAccess: boolean;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WhatsappService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/whatsapp`;

  getChannels(): Observable<WhatsappChannel[]> {
    return this.http.get<any[]>(`${this.baseUrl}/channels`).pipe(
      map((channels: any[]) => channels.map((c: any) => ({ ...c, id: c.id || c._id })))
    );
  }

  createChannel(label: string): Observable<WhatsappChannel> {
    return this.http.post<any>(`${this.baseUrl}/channels`, { label }).pipe(
      map((c: any) => ({ ...c, id: c.id || c._id }))
    );
  }

  deleteChannel(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/channels/${id}`);
  }

  reconnectChannel(id: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/channels/${id}/reconnect`, {});
  }

  updateChannelAgents(id: string, agents: string[], allAgentsAccess: boolean): Observable<WhatsappChannel> {
    return this.http.patch<any>(`${this.baseUrl}/channels/${id}/agents`, { agents, allAgentsAccess }).pipe(
      map((c: any) => ({ ...c, id: c.id || c._id }))
    );
  }

  sendMessage(channelId: string, leadId: string, content: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages/send`, { channelId, leadId, content });
  }

  getMessages(channelId: string, phoneNumber: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/channels/${channelId}/messages/${phoneNumber}`);
  }

  // Future: get conversations, etc.
}
