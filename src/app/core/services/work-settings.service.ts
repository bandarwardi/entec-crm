import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

export interface WorkSettings {
  id: number;
  shiftStartHour: number;
  shiftStartMinute: number;
  shiftEndHour: number;
  shiftEndMinute: number;
  breakDurationMinutes: number;
  deductionRatePerMinute: number;
  timezone: string;
  securityEnabled: boolean;
  autoLogoutDelayMinutes: number;
  challengeExpiryMinutes: number;
  leadAgentCommissionRate?: number;
  closerAgentCommissionRate?: number;
}

export interface AllowedZone {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface Holiday {
  id?: number;
  name: string;
  dayOfWeek?: number;
  specificDate?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkSettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/work-settings`;

  getSettings(): Observable<WorkSettings> {
    return this.http.get<WorkSettings>(this.apiUrl);
  }

  updateSettings(data: Partial<WorkSettings>): Observable<WorkSettings> {
    return this.http.put<WorkSettings>(this.apiUrl, data);
  }

  getHolidays(): Observable<Holiday[]> {
    return this.http.get<Holiday[]>(`${this.apiUrl}/holidays`);
  }

  addHoliday(data: Partial<Holiday>): Observable<Holiday> {
    return this.http.post<Holiday>(`${this.apiUrl}/holidays`, data);
  }

  deleteHoliday(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/holidays/${id}`);
  }

  // --- Allowed Zones ---
  getZones(): Observable<AllowedZone[]> {
    return this.http.get<AllowedZone[]>(`${this.apiUrl}/zones`);
  }

  addZone(data: Partial<AllowedZone>): Observable<AllowedZone> {
    return this.http.post<AllowedZone>(`${this.apiUrl}/zones`, data);
  }

  updateZone(id: string, data: Partial<AllowedZone>): Observable<AllowedZone> {
    return this.http.put<AllowedZone>(`${this.apiUrl}/zones/${id}`, data);
  }

  deleteZone(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/zones/${id}`);
  }
}
