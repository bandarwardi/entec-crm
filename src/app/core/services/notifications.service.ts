import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { UserLeadService, Lead } from './user-lead.service';
import { interval, switchMap, startWith, Subscription, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { MessageService } from 'primeng/api';
import { I18nService } from '../i18n/i18n.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private leadService = inject(UserLeadService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private i18n = inject(I18nService);
  private pollingSubscription?: Subscription;
  private notifiedIds = new Set<string>();

  reminders = signal<Lead[]>([]);
  unreadCount = computed(() => this.reminders().filter(r => !r.reminderRead).length);

  constructor() {
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

    console.log('Notifications: Starting polling every 60s...');
    this.pollingSubscription = interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.leadService.getReminders()),
        tap(data => {
          console.log(`Notifications: Received ${data.length} reminders from server`);
          this.notifyNewReminders(data);
        })
      )
      .subscribe({
        next: (data) => this.reminders.set(data),
        error: (err) => console.error('Error polling reminders', err)
      });
  }

  private notifyNewReminders(data: Lead[]) {
    data.forEach(lead => {
      const id = lead.id || (lead as any)._id || (lead as any).id;
      if (id && !this.notifiedIds.has(id)) {
        this.notifiedIds.add(id);
        
        console.log(`Notifications: Showing Toast for reminder ${id} (${lead.name})`);
        // Show Toast
        this.messageService.add({
          severity: 'info',
          summary: this.i18n.t('notifications.new_reminder'),
          detail: `${lead.name}: ${lead.reminderNote}`,
          life: 8000
        });
      }
    });
  }

  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
    this.reminders.set([]);
    this.notifiedIds.clear();
  }
}
