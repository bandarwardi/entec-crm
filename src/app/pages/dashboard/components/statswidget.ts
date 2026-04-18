import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule, RouterModule, TranslatePipe],
    template: `
        <!-- Orders -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div routerLink="/orders" class="card mb-0 shadow-sm border-t-4 border-t-blue-500 border-surface-100 dark:border-surface-800 rounded-2xl p-6 bg-gradient-to-br from-white to-blue-50/30 dark:from-surface-900 dark:to-blue-900/10 transition-all hover:scale-[1.02] hover:shadow-lg h-full cursor-pointer">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest mb-1">{{ 'dashboard.stats.orders' | t }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-black text-3xl font-mono">{{ kpis().totalOrders }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-500/20 rounded-xl w-12 h-12 shadow-sm text-blue-600">
                        <i class="pi pi-shopping-cart text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span [class]="getGrowthClass(kpis().totalOrders, kpis().prevOrders)">
                        {{ getGrowth(kpis().totalOrders, kpis().prevOrders) }}%
                    </span>
                    <span class="text-surface-400 dark:text-surface-500 text-xs font-bold">{{ 'dashboard.stats.since_prev' | t }}</span>
                </div>
            </div>
        </div>

        <!-- Revenue -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div routerLink="/orders" class="card mb-0 shadow-sm border-t-4 border-t-emerald-500 border-surface-100 dark:border-surface-800 rounded-2xl p-6 bg-gradient-to-br from-white to-emerald-50/30 dark:from-surface-900 dark:to-emerald-900/10 transition-all hover:scale-[1.02] hover:shadow-lg h-full cursor-pointer">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest mb-1">{{ 'dashboard.stats.revenue' | t }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-black text-3xl font-mono">{{ kpis().totalRevenue | currency }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 rounded-xl w-12 h-12 shadow-sm text-emerald-600">
                        <i class="pi pi-dollar text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span [class]="getGrowthClass(kpis().totalRevenue, kpis().prevRevenue)">
                        {{ getGrowth(kpis().totalRevenue, kpis().prevRevenue) }}%
                    </span>
                    <span class="text-surface-400 dark:text-surface-500 text-xs font-bold">{{ 'dashboard.stats.growth' | t }}</span>
                </div>
            </div>
        </div>

        <!-- Customers -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div routerLink="/customers" class="card mb-0 shadow-sm border-t-4 border-t-cyan-500 border-surface-100 dark:border-surface-800 rounded-2xl p-6 bg-gradient-to-br from-white to-cyan-50/30 dark:from-surface-900 dark:to-cyan-900/10 transition-all hover:scale-[1.02] hover:shadow-lg h-full cursor-pointer">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-cyan-600 dark:text-cyan-400 font-black text-xs uppercase tracking-widest mb-1">{{ 'dashboard.stats.customers' | t }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-black text-3xl font-mono">{{ kpis().totalCustomers }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-500/20 rounded-xl w-12 h-12 shadow-sm text-cyan-600">
                        <i class="pi pi-users text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span [class]="getGrowthClass(kpis().totalCustomers, kpis().prevCustomers)">
                        {{ getGrowth(kpis().totalCustomers, kpis().prevCustomers) }}%
                    </span>
                    <span class="text-surface-400 dark:text-surface-500 text-xs font-bold">{{ 'dashboard.stats.new_customers' | t }}</span>
                </div>
            </div>
        </div>

        <!-- Leads -->
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div routerLink="/leads" class="card mb-0 shadow-sm border-t-4 border-t-violet-500 border-surface-100 dark:border-surface-800 rounded-2xl p-6 bg-gradient-to-br from-white to-violet-50/30 dark:from-surface-900 dark:to-violet-900/10 transition-all hover:scale-[1.02] hover:shadow-lg h-full cursor-pointer">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-violet-600 dark:text-violet-400 font-black text-xs uppercase tracking-widest mb-1">{{ 'dashboard.stats.leads' | t }}</span>
                        <div class="text-surface-900 dark:text-surface-0 font-black text-3xl font-mono">{{ kpis().totalLeads }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 rounded-xl w-12 h-12 shadow-sm text-violet-600">
                        <i class="pi pi-filter text-xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-white font-black text-[10px] px-2.5 py-1 bg-violet-500 rounded-full shadow-sm">{{ 'dashboard.stats.active' | t }}</span>
                    <span class="text-surface-400 dark:text-surface-500 text-xs font-bold">{{ 'dashboard.stats.in_funnel' | t }}</span>
                </div>
            </div>
        </div>
    `
})
export class StatsWidget {
    kpis = input.required<any>();

    getGrowth(current: number, previous: number): number {
        if (!previous) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
    }

    getGrowthClass(current: number, previous: number): string {
        const growth = this.getGrowth(current, previous);
        return growth >= 0 
            ? 'text-green-500 font-black text-xs px-2 py-0.5 bg-green-500/10 rounded-full' 
            : 'text-red-500 font-black text-xs px-2 py-0.5 bg-red-500/10 rounded-full';
    }
}
