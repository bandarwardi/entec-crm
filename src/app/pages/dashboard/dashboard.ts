import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DashboardStore } from '../../core/stores/dashboard.store';
import { AuthStore } from '../../core/stores/auth.store';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { TopStatesWidget } from './components/topstateswidget';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectButtonModule, StatsWidget, RecentSalesWidget, BestSellingWidget, RevenueStreamWidget, NotificationsWidget, TopStatesWidget, TranslatePipe],
  template: `
        <div class="flex flex-col gap-8 font-tajawal">
            <!-- Global Dashboard Header -->
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 p-8 rounded-[2.5rem] shadow-xl border border-white/10 relative overflow-hidden shrink-0">
                <!-- Decorative background elements -->
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
                
                <div class="relative z-10">
                  <h1 class="text-4xl font-black text-white mb-2">{{ 'dashboard.title' | t }}</h1>
                  <!-- <p class="text-emerald-50 font-bold text-xs uppercase tracking-[0.2em] opacity-80">EN TEC Analytics & Global Performance</p> -->
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3 md:gap-5 relative z-10 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-sm rtl:mr-auto ltr:ml-auto w-full sm:w-auto">
                  <span class="text-[10px] md:text-xs font-black text-emerald-50 uppercase tracking-[0.1em] whitespace-nowrap">{{ 'dashboard.period.label' | t }}</span>
                  <div class="flex flex-wrap items-center justify-center gap-2">
                    @for (option of periodOptions(); track option.value) {
                      <button 
                        (click)="selectedPeriod.set(option.value); loadStats()"
                        [class]="selectedPeriod() === option.value ? 
                          'bg-white text-emerald-600 shadow-xl px-4 md:px-5 py-2 md:py-2 flex-grow sm:flex-grow-0 rounded-[14px] text-xs font-bold transition-all duration-300 transform -translate-y-0.5 border border-white ring-2 ring-white/20' : 
                          'bg-white/10 text-emerald-50 hover:bg-white/20 border border-white/20 flex-grow sm:flex-grow-0 px-4 md:px-5 py-2 md:py-2 rounded-[14px] text-xs font-bold transition-all duration-300 hover:text-white'"
                      >
                        {{ option.label }}
                      </button>
                    }
                  </div>
                </div>
            </div>

            <!-- Loading State -->
             @if (store.loading()) {
                <div class="py-20 text-center w-full">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
                    <p class="font-black text-surface-400">{{ 'dashboard.loading' | t }}</p>
                </div>
             }

            @if (!store.loading() && store.stats()) {
              <!-- Main Dashboard Content Grid -->
              <div class="grid grid-cols-12 gap-8">
                <!-- Main KPIs -->
                <app-stats-widget class="contents" [kpis]="store.stats()!.kpis" />
                
                <!-- Secondary Widgets -->
                <div class="col-span-12 xl:col-span-6 flex flex-col gap-8">
                    <app-recent-sales-widget [orders]="store.stats()!.recentOrders" />
                    <app-best-selling-widget [agents]="store.stats()!.topAgents" />
                    <app-top-states-widget class="md:col-span-1" [data]="store.stats()!.topStates" />
                </div>
                
                <div class="col-span-12 xl:col-span-6 flex flex-col gap-8">
                    <app-revenue-stream-widget [monthlyRevenue]="store.stats()!.revenueByMonth" />
                    <div class="grid grid-cols-1 gap-8">
                      <app-notifications-widget class="md:col-span-1" [ordersByType]="store.stats()!.ordersByType" [leadsFunnel]="store.stats()!.leadsFunnel" />
                    </div>
                </div>
              </div>
            }
        </div>
    `,
  styles: []
})
export class Dashboard implements OnInit {
  private i18n = inject(I18nService);
  readonly authStore = inject(AuthStore);
  readonly store = inject(DashboardStore);

  selectedPeriod = signal('30days');

  periodOptions = computed(() => [
    { label: this.i18n.t('dashboard.period.7days'), value: '7days' },
    { label: this.i18n.t('dashboard.period.30days'), value: '30days' },
    { label: this.i18n.t('dashboard.period.ytd'), value: 'ytd' },
    { label: this.i18n.t('dashboard.period.all'), value: 'all' }
  ]);

  ngOnInit() {
    this.loadStats();
    if (this.authStore.currentRole() === 'admin' || this.authStore.currentRole() === 'super-admin') {
      this.store.loadTodayAdminStats();
    }
  }

  loadStats() {
    this.store.ensureStatsLoaded(this.selectedPeriod());
  }
}

