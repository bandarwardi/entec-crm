import { Injectable, inject, computed } from '@angular/core';
import { AuthStore, User } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private store = inject(AuthStore);

  // Maintain signals for compatibility if needed
  currentUser = this.store.user;
  token = this.store.token;

  login(credentials: { email: string; password: string }) {
    // Note: This returns void because rxMethod doesn't return Observable directly
    // If components need Observable, we might need a separate service or just update components.
    // I've already updated the components that use login() to use the store directly.
    return this.store.login(credentials);
  }

  logout() {
    this.store.logout();
  }

  isLoggedIn(): boolean {
    return this.store.isLoggedIn();
  }

  hasRole(role: string): boolean {
    return this.store.hasRole()(role);
  }

  getUserProfile(): User | null {
    return this.store.user();
  }
}
