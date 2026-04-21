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

  sendMessage(channelId: string, leadId: string | null, content: string, messageType: string = 'text', mediaUrl?: string, phoneNumber?: string, quotedMessageId?: string, quotedContent?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/messages/send`, { channelId, leadId, content, messageType, mediaUrl, phoneNumber, quotedMessageId, quotedContent });
  }

  getMessages(channelId: string, phoneNumber: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/channels/${channelId}/messages/${phoneNumber}`);
  }

  checkNumber(channelId: string, phoneNumber: string): Observable<{ jid: string, exists: boolean }> {
    return this.http.get<{ jid: string, exists: boolean }>(`${this.baseUrl}/channels/${channelId}/check-number`, {
      params: { phoneNumber }
    });
  }

  formatPhoneForWhatsapp(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    // US Number: 10 digits
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    // Egyptian Number: 11 digits starting with 01
    if (cleaned.length === 11 && cleaned.startsWith('01')) {
      cleaned = '2' + cleaned;
    }

    return cleaned;
  }

  getAiSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ai-settings`);
  }

  updateAiSettings(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ai-settings`, data);
  }

  getAiSuggestion(channelId: string, phoneNumber: string): Observable<{ suggestion: string | null }> {
    return this.http.post<{ suggestion: string | null }>(`${this.baseUrl}/ai-suggest`, { channelId, phoneNumber });
  }

  markAsRead(leadId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/leads/${leadId}/mark-as-read`, {});
  }

  getTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/templates`);
  }

  createTemplate(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/templates`, data);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/templates/${id}`);
  }

  toggleArchive(leadId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/leads/${leadId}/toggle-archive`, {});
  }
}
