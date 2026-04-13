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
}
