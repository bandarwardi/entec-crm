import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AiConversation {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id: number;
  conversationId: number;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

export interface SalesScenario {
  id: number;
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
  private apiUrl = 'http://localhost:3000/api/ai-chat';

  // --- Conversations ---

  getConversations(): Observable<AiConversation[]> {
    return this.http.get<AiConversation[]>(`${this.apiUrl}/conversations`);
  }

  createConversation(title?: string): Observable<AiConversation> {
    return this.http.post<AiConversation>(`${this.apiUrl}/conversations`, { title });
  }

  getMessages(conversationId: number): Observable<AiMessage[]> {
    return this.http.get<AiMessage[]>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  sendMessage(conversationId: number, message: string): Observable<AiMessage> {
    return this.http.post<AiMessage>(`${this.apiUrl}/conversations/${conversationId}/messages`, { message });
  }

  deleteConversation(conversationId: number): Observable<any> {
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

  updateScenario(id: number, data: Partial<SalesScenario>): Observable<SalesScenario> {
    return this.http.put<SalesScenario>(`${this.apiUrl}/scenarios/${id}`, data);
  }

  deleteScenario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/scenarios/${id}`);
  }
}
