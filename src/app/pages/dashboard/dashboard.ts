import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SalesService, DashboardStats } from '../../core/services/sales.service';
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
        <div class="grid grid-cols-12 gap-8 font-tajawal">
            <!-- Global Dashboard Header -->
            <div class="col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 p-8 rounded-[2.5rem] shadow-xl mb-4 border border-white/10 relative overflow-hidden">
                <!-- Decorative background elements -->
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>
                
                <div class="relative z-10">
                  <h1 class="text-4xl font-black text-white mb-2">{{ 'dashboard.title' | t }}</h1>
                  <p class="text-emerald-50 font-bold text-xs uppercase tracking-[0.2em] opacity-80">EN TEC Analytics & Global Performance</p>
                </div>

                <div class="flex items-center gap-4 relative z-10 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                  <span class="text-xs font-black text-emerald-50 px-3 uppercase tracking-wider">{{ 'dashboard.period.label' | t }}</span>
                  <p-selectButton 
                    [options]="periodOptions()" 
                    [(ngModel)]="selectedPeriod" 
                    optionLabel="label" 
                    optionValue="value"
                    (onOptionClick)="loadStats()"
                    styleClass="dashboard-period-switch">
                  </p-selectButton>
                </div>
            </div>

            <!-- Loading State -->
             @if (loading()) {
                <div class="col-span-12 py-20 text-center">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
                    <p class="font-black text-surface-400">{{ 'dashboard.loading' | t }}</p>
                </div>
             }

            @if (!loading() && data()) {
              <app-stats-widget class="contents" [kpis]="data()!.kpis" />
              
              <div class="col-span-12 xl:col-span-6 flex flex-col gap-8">
                  <app-recent-sales-widget [orders]="data()!.recentOrders" />
                  <app-best-selling-widget [agents]="data()!.topAgents" />
                  <app-top-states-widget class="md:col-span-1" [data]="data()!.topStates" />
              </div>
              
              <div class="col-span-12 xl:col-span-6 flex flex-col gap-8">
                  <app-revenue-stream-widget [monthlyRevenue]="data()!.revenueByMonth" />
                  <div class="grid grid-cols-1 gap-8">
                    <app-notifications-widget class="md:col-span-1" [ordersByType]="data()!.ordersByType" [leadsFunnel]="data()!.leadsFunnel" />
                  </div>
              </div>
            }
        </div>
    `,
    styles: [`
      :host ::ng-deep .dashboard-period-switch .p-button {
        background: var(--surface-50);
        border: 1px solid var(--surface-100);
        padding: 0.5rem 1.5rem;
        font-weight: 800;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--text-color-secondary);
        border-radius: 12px;
        margin: 0 4px;
        transition: all 0.2s;
        box-shadow: none;
      }
      .app-dark :host ::ng-deep .dashboard-period-switch .p-button {
        background: var(--surface-800);
        border-color: var(--surface-700);
        color: var(--surface-400);
      }
      :host ::ng-deep .dashboard-period-switch .p-button.p-highlight {
        background: rgba(var(--primary-color-rgb), 0.1) !important;
        border-color: var(--primary-color) !important;
        color: var(--primary-color) !important;
      }
    `]
})
export class Dashboard implements OnInit {
    private salesService = inject(SalesService);
    private i18n = inject(I18nService);
    
    loading = signal(true);
    data = signal<DashboardStats | null>(null);
    selectedPeriod = signal('30days');

    periodOptions = computed(() => [
        { label: this.i18n.t('dashboard.period.7days'), value: '7days' },
        { label: this.i18n.t('dashboard.period.30days'), value: '30days' },
        { label: this.i18n.t('dashboard.period.ytd'), value: 'ytd' },
        { label: this.i18n.t('dashboard.period.all'), value: 'all' }
    ]);

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.loading.set(true);
        this.salesService.getDashboardStats(this.selectedPeriod()).subscribe({
            next: (res) => {
                this.data.set(res);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }
}
