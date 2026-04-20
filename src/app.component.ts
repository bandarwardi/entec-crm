import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthStore } from './app/core/stores/auth.store';
import { NotificationsStore } from './app/core/stores/notifications.store';

@Component({
    selector: 'app-root',
    imports: [RouterModule, ToastModule],
    template: `
        <p-toast (onClick)="onToastClick($event)"></p-toast>
        <router-outlet></router-outlet>
    `
})
export class AppComponent implements OnInit {
    private authStore = inject(AuthStore);
    private notificationsStore = inject(NotificationsStore);
    private router = inject(Router);

    ngOnInit() {
        this.authStore.init();
    }

    onToastClick(event: any) {
        // message is in event.message
        const notif = event.message?.data;
        if (!notif) return;

        if (notif.type === 'whatsapp_message') {
            this.router.navigate(['/whatsapp/inbox'], { 
                queryParams: { 
                    phone: notif.payload?.phoneNumber,
                    leadId: notif.payload?.leadId,
                    channelId: notif.payload?.channelId
                } 
            });
        } else if (notif.payload?.leadId) {
            this.router.navigate(['/leads'], { queryParams: { id: notif.payload.leadId } });
        }

        // Mark as read when clicked
        if (!notif.read) {
            this.notificationsStore.markAsRead(notif.id);
        }
    }
}
