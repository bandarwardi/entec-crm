import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

export interface PerformanceDay {
  date: string;
  dayOfWeek: string;
  isHoliday: boolean;
  holidayName?: string;
  hasData?: boolean;
  activeMinutes?: number;
  busyMinutes?: number;
  breakMinutes?: number;
  lateMinutes?: number;
  excessBreakMinutes?: number;
  deductionAmount?: number;
  firstLogin?: string;
}

export interface MonthlyPerformance {
  user: { id: string; name: string; email: string };
  year: number;
  month: number;
  workSettings: any;
  days: PerformanceDay[];
  totals: {
    totalActiveMinutes: number;
    totalBusyMinutes: number;
    totalBreakMinutes: number;
    totalLateMinutes: number;
    totalExcessBreakMinutes: number;
    totalDeductionAmount: number;
    workingDays: number;
    holidaysCount: number;
  };
}

export interface DailyPerformance {
  user: { id: string; name: string; email: string };
  date: string;
  shiftStart: string;
  shiftEnd: string;
  activities: any[];
  totals: {
    activeMinutes: number;
    busyMinutes: number;
    breakMinutes: number;
    lateMinutes: number;
    excessBreakMinutes: number;
    deductionAmount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/users`;

  getMonthlyPerformance(userId: string, year: number, month: number): Observable<MonthlyPerformance> {
    return this.http.get<MonthlyPerformance>(`${this.apiUrl}/${userId}/performance?year=${year}&month=${month}`);
  }

  getDailyPerformance(userId: string, date: string): Observable<DailyPerformance> {
    return this.http.get<DailyPerformance>(`${this.apiUrl}/${userId}/performance/${date}`);
  }
}
