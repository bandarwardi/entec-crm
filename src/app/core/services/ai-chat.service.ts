import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface SalesScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/ai-chat`;

  // --- Conversations ---

  getConversations(): Observable<AiConversation[]> {
    return this.http.get<AiConversation[]>(`${this.apiUrl}/conversations`);
  }

  createConversation(title?: string): Observable<AiConversation> {
    return this.http.post<AiConversation>(`${this.apiUrl}/conversations`, { title });
  }

  getMessages(conversationId: string): Observable<AiMessage[]> {
    return this.http.get<AiMessage[]>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: string, message: string): Observable<AiMessage> {
    return this.http.post<AiMessage>(`${this.apiUrl}/conversations/${conversationId}/messages`, { message });
  }

  deleteConversation(conversationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/conversations/${conversationId}`);
  }

  // --- Scenarios ---

  getScenarios(): Observable<SalesScenario[]> {
    return this.http.get<SalesScenario[]>(`${this.apiUrl}/scenarios`);
  }

  getAllScenarios(): Observable<SalesScenario[]> {
    return this.http.get<SalesScenario[]>(`${this.apiUrl}/scenarios/all`);
  }

  createScenario(data: Partial<SalesScenario>): Observable<SalesScenario> {
    return this.http.post<SalesScenario>(`${this.apiUrl}/scenarios`, data);
  }

  updateScenario(id: string, data: Partial<SalesScenario>): Observable<SalesScenario> {
    return this.http.put<SalesScenario>(`${this.apiUrl}/scenarios/${id}`, data);
  }

  deleteScenario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/scenarios/${id}`);
  }
}
