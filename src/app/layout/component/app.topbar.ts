import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { LayoutService } from '@/app/layout/service/layout.service';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { NotificationsStore } from '../../core/stores/notifications.store';
import { AuthStore, UserStatus, BreakReason } from '../../core/stores/auth.store';
import { DatePipe, CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { StyleClassModule } from 'primeng/styleclass';
import { UserLeadService, Lead } from '../../core/services/user-lead.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

import { HostListener } from '@angular/core';

@Component({
    selector: 'app-topbar',
    template: ` <div class="layout-topbar" [class.dark-mode]="layoutService.isDarkTheme()">
            <!-- Settings Ellipsis (Mobile Only - Far Left) -->
            @if (isMobile()) {
                <button class="absolute left-4 top-1/2 -translate-y-1/2 layout-topbar-action hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-[1000]" (click)="settingsOp.toggle($event)">
                    <i class="pi pi-ellipsis-v text-slate-600 dark:text-slate-300 font-bold"></i>
                </button>
            }

            <div class="layout-topbar-logo-container flex items-center gap-4">
                <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                    <i class="pi pi-bars"></i>
                </button>
                <a class="layout-topbar-logo flex items-center gap-2" routerLink="/">
                    <img src="assets/imgs/logo.jpeg" alt="EN TEC" class="h-10 w-auto rounded-lg shadow-md border border-white/20" />
                    <span class="text-xl font-black text-primary uppercase tracking-wider">EN TEC</span>
                </a>
            </div>

            <div class="layout-topbar-actions ml-auto">
                <!-- Desktop Only Direct Settings -->
                <div class="hidden lg:flex items-center gap-2 mr-2">
                    <!-- Language Toggle -->
                    <button (click)="toggleLang()" class="layout-topbar-action hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" [title]="i18n.currentLang() === 'ar' ? 'English' : 'العربية'">
                        <span class="text-xs font-black">{{ i18n.currentLang() === 'ar' ? 'EN' : 'AR' }}</span>
                    </button>

                    <!-- Theme Toggle -->
                    <button (click)="toggleDarkMode()" class="layout-topbar-action hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <i class="pi" [class.pi-moon]="layoutService.isDarkTheme()" [class.pi-sun]="!layoutService.isDarkTheme()"></i>
                    </button>

                    <!-- Profile Link -->
                    <button routerLink="/profile" class="layout-topbar-action hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <i class="pi pi-user"></i>
                    </button>

                    <div class="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                </div>

                <!-- User Status Picker -->
                <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 relative shadow-inner mr-2">
                    <div [class]="getStatusClass(authStore.user()?.currentStatus || 'offline')" class="w-2.5 h-2.5 rounded-full shadow-sm"></div>
                    <button 
                        class="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-100 bg-transparent border-none p-0 cursor-pointer flex items-center gap-1 hover:text-primary transition-colors"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <span class="hidden md:inline">{{ getStatusLabel(authStore.user()?.currentStatus || 'offline') }}</span>
                        <i class="pi pi-chevron-down text-[10px]"></i>
                    </button>
                    <div class="absolute top-12 right-0 z-[1000] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 min-w-48 hidden">
                        <div class="flex flex-col gap-1">
                            <button (click)="setStatus('online')" class="flex items-center gap-3 p-2 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group text-right">
                                <span class="w-3 h-3 rounded-full bg-teal-500"></span>
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-400">{{ 'status.online' | t }}</span>
                            </button>
                            
                            <div class="border-t dark:border-slate-700 my-1"></div>
                            <div class="px-2 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider text-right">{{ 'status.break_types.title' | t }}</div>
                            
                            <button (click)="setStatus('break', 'urgent_call')" class="flex items-center gap-3 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group text-right">
                                <i class="pi pi-mobile text-amber-500 text-sm"></i>
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">{{ 'status.break_types.phone' | t }}</span>
                            </button>
                            <button (click)="setStatus('break', 'bathroom')" class="flex items-center gap-3 p-3 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group text-right">
                                <i class="pi pi-clock text-amber-500 text-sm"></i>
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">{{ 'status.break_types.restroom' | t }}</span>
                            </button>
                            <button (click)="setStatus('break', 'lunch')" class="flex items-center gap-3 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group text-right">
                                <i class="pi pi-sparkles text-amber-500 text-sm"></i>
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">{{ 'status.break_types.lunch' | t }}</span>
                            </button>
                            <button (click)="setStatus('break', 'prayer')" class="flex items-center gap-3 p-2 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group text-right">
                                <i class="pi pi-heart text-amber-500 text-sm"></i>
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400">{{ 'status.break_types.prayer' | t }}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Notifications Bell -->
                    <button class="layout-topbar-action relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" (click)="onNotificationClick($event, op)">
                        <i class="pi pi-bell text-slate-600 dark:text-slate-300"></i>
                        @if (store.unreadCount() > 0) {
                            <p-badge [value]="store.unreadCount()" severity="danger" class="absolute top-1 right-1 scale-[0.65]"></p-badge>
                        }
                    </button>
                </div>

                <p-popover #settingsOp>
                    <div class="flex flex-col gap-1 w-56 p-2 dark:bg-slate-800 dark:text-slate-100">
                        <button (click)="toggleDarkMode()" class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group">
                             <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <i class="pi" [class.pi-moon]="layoutService.isDarkTheme()" [class.pi-sun]="!layoutService.isDarkTheme()"></i>
                            </div>
                            <span class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ (layoutService.isDarkTheme() ? 'ui.light_mode' : 'ui.dark_mode') | t }}</span>
                        </button>

                        <button (click)="toggleLang()" class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group">
                             <div class="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform font-black text-xs">
                                {{ i18n.currentLang() === 'ar' ? 'EN' : 'AR' }}
                            </div>
                            <span class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ i18n.currentLang() === 'ar' ? 'English' : 'العربية' }}</span>
                        </button>

                        <div class="border-t dark:border-slate-700 my-1"></div>

                        <button routerLink="/profile" (click)="settingsOp.hide()" class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors border-none bg-white dark:bg-transparent w-full cursor-pointer group">
                             <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-110 transition-transform">
                                <i class="pi pi-user"></i>
                            </div>
                            <span class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ 'ui.profile' | t }}</span>
                        </button>
                    </div>
                </p-popover>

                <p-popover #op>
                    <div class="flex flex-col gap-3 w-84 p-2 dark:bg-slate-800 dark:text-slate-100 max-h-[450px] overflow-y-auto" (scroll)="onPopupScroll($event)">
                        <div class="font-bold border-b dark:border-slate-700 pb-2 px-1 text-primary">{{ 'notifications.title' | t }}</div>
                        @if (allNotifications.length === 0 && !loadingNotifications) {
                            <div class="text-xs text-center py-6 text-gray-400 dark:text-slate-500 italic">{{ 'notifications.empty' | t }}</div>
                        } @else {
                            @for (lead of allNotifications; track trackByNotification(lead)) {
                                <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl cursor-pointer border-b dark:border-slate-700 last:border-b-0 transition-colors group" [routerLink]="['/leads']">
                                    <div class="flex justify-between items-start mb-1">
                                        <div class="font-bold text-sm group-hover:text-primary transition-colors" [class.text-blue-600]="!lead.reminderRead">{{ lead.name }}</div>
                                        <div class="text-[10px] text-slate-400">{{ lead.reminderAt | date:'shortTime' }}</div>
                                    </div>
                                    <div class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{{ lead.reminderNote }}</div>
                                </div>
                            }
                            @if (loadingNotifications) {
                                <div class="text-center py-3">
                                    <i class="pi pi-spin pi-spinner text-primary"></i>
                                </div>
                            }
                        }
                    </div>
                </p-popover>
            </div>
        </div>`,
    imports: [RouterModule, BadgeModule, PopoverModule, ButtonModule, DatePipe, CommonModule, SelectModule, FormsModule, TranslatePipe, StyleClassModule]
})
export class AppTopbar {
    layoutService = inject(LayoutService);
    i18n = inject(I18nService);
    readonly store = inject(NotificationsStore);
    readonly authStore = inject(AuthStore);
    readonly leadService = inject(UserLeadService);
    readonly cdr = inject(ChangeDetectorRef);

    allNotifications: Lead[] = [];
    loadingNotifications = false;
    notificationPage = 1;
    hasMoreNotifications = true;

    isMobile() {
        return window.innerWidth < 992;
    }

    @HostListener('window:resize')
    onResize() {
        this.cdr.detectChanges();
    }

    constructor() {
        // Start polling when component initializes
        this.store.startPolling();
    }

    setStatus(status: string, breakReason?: string) {
        this.authStore.updateStatus({
            status: status as UserStatus,
            breakReason: breakReason as BreakReason
        });
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'online': return this.i18n.t('status.online');
            case 'busy': return this.i18n.t('status.busy');
            case 'break': return this.i18n.t('status.break');
            case 'offline': return this.i18n.t('status.offline');
            default: return status;
        }
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'online': return 'bg-teal-500';
            case 'busy': return 'bg-red-500';
            case 'break': return 'bg-amber-500';
            default: return 'bg-slate-400';
        }
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    toggleLang() {
        this.i18n.toggleLang();
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            lang: this.i18n.currentLang()
        }));
    }

    onNotificationClick(event: Event, op: any) {
        this.store.markAsRead();

        // Toggle popover first
        op.toggle(event);

        // Only load if empty, otherwise we rely on scrolling
        if (this.allNotifications.length === 0) {
            this.notificationPage = 1;
            this.loadNotifications();
        }
    }

    loadNotifications() {
        if (this.loadingNotifications || !this.hasMoreNotifications) return;

        this.loadingNotifications = true;
        this.leadService.getAllReminders(this.notificationPage, 20).subscribe({
            next: (res: any) => {
                if (this.notificationPage === 1) {
                    this.allNotifications = res.data;
                } else {
                    this.allNotifications = [...this.allNotifications, ...res.data];
                }
                this.hasMoreNotifications = res.data.length === 20;
                this.loadingNotifications = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loadingNotifications = false;
                this.cdr.detectChanges();
            }
        });
    }

    trackByNotification(lead: any) {
        return lead.id || lead._id || lead;
    }

    onPopupScroll(event: any) {
        const el = event.target;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) {
            if (!this.loadingNotifications && this.hasMoreNotifications) {
                this.notificationPage++;
                this.loadNotifications();
            }
        }
    }
}
