import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  id: number;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  orders?: Order[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderDevice {
  id: number;
  macAddress: string;
  deviceKey: string;
  deviceName: string;
}

export interface Order {
  id: number;
  customer: Customer;
  leadAgent: { id: number; name: string };
  closerAgent: { id: number; name: string };
  type: OrderType;
  referrerName: string | null;
  amount: number;
  paymentMethod: string;
  serverName: string | null;
  serverExpiryDate: string | null;
  appType: string | null;
  appYears: number | null;
  appExpiryDate: string | null;
  notes: string | null;
  status: OrderStatus;
  devices: OrderDevice[];
  deviceCount?: number;
  attachments?: string[];
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
  recentOrders: { id: number; customerName: string; amount: number; status: string; createdAt: string }[];
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
  private apiUrl = 'http://localhost:3000/api/sales';

  // Customers
  getCustomers(params: any): Observable<PaginatedResponse<Customer>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) httpParams = httpParams.set(key, (value as any).toString());
    });
    return this.http.get<PaginatedResponse<Customer>>(`${this.apiUrl}/customers`, { params: httpParams });
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/customers/${id}`);
  }

  createCustomer(data: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/customers`, data);
  }

  updateCustomer(id: number, data: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/customers/${id}`, data);
  }

  getDashboardStats(period: string = '30days'): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`, { params: { period } });
  }

  // Orders
  getOrders(params: any): Observable<PaginatedResponse<Order>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) httpParams = httpParams.set(key, (value as any).toString());
    });
    return this.http.get<PaginatedResponse<Order>>(`${this.apiUrl}/orders`, { params: httpParams });
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  createOrder(data: any): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, data);
  }

  updateOrder(id: number, data: any): Observable<Order> {
    return this.http.put<Order>(`${this.apiUrl}/orders/${id}`, data);
  }

  deleteOrder(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/orders/${id}`);
  }

  sendInvoiceEmail(orderId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders/${orderId}/send-invoice`, {});
  }

  geocode(address: string, state: string): Observable<{ latitude: number, longitude: number }> {
    return this.http.get<{ latitude: number, longitude: number }>(`${this.apiUrl}/geocode`, {
      params: { address, state }
    });
  }

  uploadAttachment(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload-attachment`, formData);
  }
}
