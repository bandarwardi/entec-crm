import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../constants/api.constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/users`;

  getUsers(search?: string): Observable<User[]> {
    let url = this.apiUrl;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    return this.http.get<User[]>(url);
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: string, user: any): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // --- Devices ---
  getAllowedDevices(userId: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${userId}/devices`);
  }

  addAllowedDevice(userId: string, fingerprint: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/devices`, { fingerprint });
  }

  removeAllowedDevice(userId: string, fingerprint: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/devices/${fingerprint}`);
  }
}
