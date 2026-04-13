import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { UserLeadService, Lead } from './user-lead.service';
import { interval, switchMap, startWith, Subscription } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private leadService = inject(UserLeadService);
  private authService = inject(AuthService);
  private pollingSubscription?: Subscription;

  reminders = signal<Lead[]>([]);
  unreadCount = computed(() => this.reminders().length);

  constructor() {
    // Start polling when logged in, stop when logged out
    effect(() => {
      if (this.authService.isLoggedIn()) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  startPolling() {
    if (this.pollingSubscription) return;

    this.pollingSubscription = interval(60000) // 1 minute
      .pipe(
        startWith(0),
        switchMap(() => this.leadService.getReminders())
      )
      .subscribe({
        next: (data) => this.reminders.set(data),
        error: (err) => console.error('Error polling reminders', err)
      });
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
    this.reminders.set([]);
  }
}
