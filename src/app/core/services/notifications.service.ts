import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { db, messaging } from '../firebase/firebase.config';
import { getToken } from 'firebase/messaging';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  doc, 
  updateDoc, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { AuthStore } from '../stores/auth.store';
import { MessageService } from 'primeng/api';
import { I18nService } from '../i18n/i18n.service';
import { Observable } from 'rxjs';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: 'lead_reminder' | 'whatsapp_message' | 'whatsapp_qr' | 'whatsapp_status';
  title: string;
  body: string;
  payload: any;
  read: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private i18n = inject(I18nService);
  private unsubscribe?: () => void;

  notifications = signal<AppNotification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor() {
    effect(() => {
      const user = this.authStore.user();
      const isPresenceActive = this.authStore.presenceActive();

      if (user && isPresenceActive) {
        const userId = user.id || (user as any)._id;
        if (userId) {
          this.startListening(userId);
          this.requestPushPermission();
        } else {
          console.warn('Firebase: User found but no ID available', user);
        }
      } else {
        this.stopListening();
      }
    });
  }

  async requestPushPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BPNjF0kY0W0C5W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C0W5C' // Replace with your actual VAPID key
        });
        if (token) {
          this.authStore.saveFCMToken(token);
        }
      }
    } catch (error) {
      console.error('Failed to get push permission', error);
    }
  }

  private startListening(userId: string) {
    if (this.unsubscribe) return;

    console.log(`Firebase: Starting listener for user: ${userId}`);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`Firebase: Received ${snapshot.docs.length} notifications for user ${userId}`);
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data()['createdAt'] as Timestamp)?.toDate() || new Date()
      })) as AppNotification[];

      // Show toast for new unread notifications
      const prevNotifications = this.notifications();
      // Update unread badge count, but don't show visual popups (toasts)
      // newNotifications.forEach(notif => {
      //   if (!notif.read && !prevNotifications.find(p => p.id === notif.id)) {
      //     this.showToast(notif);
      //   }
      // });

      this.notifications.set(newNotifications);
    }, (error) => {
      console.error('Firebase: Notifications listener failed', error);
    });
  }

  private showToast(notif: AppNotification) {
    this.messageService.add({
      severity: 'info',
      summary: notif.title,
      detail: notif.body,
      life: 8000,
      data: notif // Pass the whole notification object
    });
  }

  private stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.notifications.set([]);
  }

  async markAsRead(id: string) {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { read: true });
  }

  async markAllAsRead() {
    const unread = this.notifications().filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const docRef = doc(db, 'notifications', n.id);
      batch.update(docRef, { read: true });
    });
    await batch.commit();
  }
}
