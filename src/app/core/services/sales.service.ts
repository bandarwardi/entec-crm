import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

export enum OrderType {
  NEW = 'new',
  RENEWAL = 'renewal',
  REFERRAL = 'referral',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  orders?: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderDevice {
  id: string;
  macAddress: string;
  deviceKey: string;
  deviceName: string;
  username?: string;
}

export interface Order {
  id: string;
  customer: Customer;
  leadAgent: { id: string; name: string };
  closerAgent: { id: string; name: string };
  leadAgentName?: string;
  closerAgentName?: string;
  type: OrderType;
  referrerName: string | null;
  amount: number;
  paymentMethod: string;
  serverName: string | null;
  serverExpiryDate: string | null;
  appType: string | null;
  appYears: number | null;
  appExpiryDate?: string;
  notes?: string;
  status: OrderStatus;
  devices: OrderDevice[];
  attachments?: string[];
  invoiceFile?: string;
  subscriptionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  kpis: {
    totalOrders: number;
    prevOrders: number;
    totalRevenue: number;
    prevRevenue: number;
    totalCustomers: number;
    prevCustomers: number;
    totalLeads: number;
    prevLeads: number;
  };
  recentOrders: { id: string; customerName: string; amount: number; status: string; createdAt: string }[];
  revenueByMonth: { month: string; revenue: number }[];
  topAgents: { name: string; totalRevenue: number; orderCount: number }[];
  ordersByType: { type: string; count: number }[];
  leadsFunnel: { status: string; count: number }[];
  topStates: { name: string; count: number }[];
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
export class SalesService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/sales`;

  // Invoice Settings
  getInvoiceSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice-settings`);
  }

  updateInvoiceSettings(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/invoice-settings`, data);
  }

  // Customers
  getCustomers(params: any): Observable<PaginatedResponse<Customer>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) httpParams = httpParams.set(key, (value as any).toString());
    });
    return this.http.get<PaginatedResponse<Customer>>(`${this.apiUrl}/customers`, { params: httpParams });
  }

  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/customers/${id}`);
  }

  createCustomer(data: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/customers`, data);
  }

  updateCustomer(id: string, data: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/customers/${id}`, data);
  }

  getDashboardStats(period: string = '30days'): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, { params: { period } });
  }

    getTodayAdminStats(date?: string): Observable<{ todayLeadsCount: number; employeePerformance: any[] }> {
        const params = date ? new HttpParams().set('date', date) : undefined;
        return this.http.get<any>(`${API_BASE_URL}/admin/dashboard/today`, { params });
    }

  // Orders
  getOrders(params: any): Observable<PaginatedResponse<Order>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) httpParams = httpParams.set(key, (value as any).toString());
    });
    return this.http.get<PaginatedResponse<Order>>(`${this.apiUrl}/orders`, { params: httpParams });
  }

  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, data);
  }

  updateOrder(id: string, data: any): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}`, data);
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`);
  }

  sendInvoiceEmail(orderId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/send-invoice`, {});
  }

  geocode(address: string, state: string, country?: string): Observable<{ latitude: number, longitude: number }> {
    return this.http.get<{ latitude: number, longitude: number }>(`${this.apiUrl}/geocode`, {
      params: { address, state, country: country || '' }
    });
  }

  geocodeAllCustomers(): Observable<{ success: boolean, total: number, geocoded: number }> {
    return this.http.post<{ success: boolean, total: number, geocoded: number }>(`${this.apiUrl}/customers/geocode-all`, {});
  }

  uploadAttachment(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-attachment`, formData);
  }

  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customers/${id}`);
  }

  exportOrders(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/excel-export`, { responseType: 'blob' });
  }

  importOrders(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/import/excel`, formData);
  }
}
