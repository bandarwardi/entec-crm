import { signalStore, withMethods, withComputed } from '@ngrx/signals';
import { inject, computed } from '@angular/core';
import { NotificationsService } from '../services/notifications.service';

export const NotificationsStore = signalStore(
  { providedIn: 'root' },
  withComputed(() => {
    const notificationsService = inject(NotificationsService);
    return {
      reminders: computed(() => notificationsService.notifications()),
      unreadCount: computed(() => notificationsService.unreadCount()),
      hasReminders: computed(() => notificationsService.notifications().length > 0),
    };
  }),
  withMethods(() => {
    const notificationsService = inject(NotificationsService);

    return {
      markAsRead(id: string) {
        notificationsService.markAsRead(id);
      },
      markAllAsRead() {
        notificationsService.markAllAsRead();
      }
    };
  })
);
