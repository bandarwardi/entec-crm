import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

export enum LeadStatus {
  NEW = 'new',
  INTERESTED = 'interested',
  FOLLOW_UP = 'follow_up',
  NOT_INTERESTED = 'not_interested',
  SUBSCRIBED_ELSEWHERE = 'subscribed_elsewhere',
  PENDING_CALLBACK = 'pending_callback',
  CONVERTED = 'converted',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  state: string;
  notes: string | null;
  status: LeadStatus;
  reminderAt: string | null;
  lastMessageAt?: string | null;
  profilePicUrl?: string | null;
  isOnline?: boolean;
  reminderNote: string | null;
  reminderRead?: boolean;
  currentPlatform?: string;
  currentDevice?: string;
  subscriptionAmount?: number;
  subscriptionDuration?: number;
  isGroup?: boolean;
  groupJid?: string;
  unreadCount?: number;
  isArchived?: boolean;
  createdBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserLeadService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/leads`;

  getLeads(params: { page?: number; limit?: number; search?: string; status?: string; state?: string; hasReminder?: string; createdBy?: string }): Observable<PaginatedResponse<Lead>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PaginatedResponse<Lead>>(this.apiUrl, { params: httpParams });
  }

  bulkImport(leads: Partial<Lead>[]): Observable<Lead[]> {
    return this.http.post<Lead[]>(`${this.apiUrl}/bulk-import`, leads);
  }

  exportLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(`${this.apiUrl}/export`);
  }

  createLead(lead: Partial<Lead>): Observable<Lead> {
    return this.http.post<Lead>(this.apiUrl, lead);
  }

  updateLead(id: string, lead: Partial<Lead>): Observable<Lead> {
    return this.http.put<Lead>(`${this.apiUrl}/${id}`, lead);
  }

  deleteLead(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
