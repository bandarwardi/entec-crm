import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [CommonModule, RouterModule, TableModule, ButtonModule, TagModule, TranslatePipe],
    template: `
        <div class="card shadow-md border-t-4 border-t-primary border-surface-100 dark:border-surface-800 rounded-3xl p-6 bg-white dark:bg-surface-900 font-tajawal transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <div class="font-black text-lg text-surface-900 dark:text-surface-0 mb-1">{{ 'dashboard.recent_sales.title' | t }}</div>
                    <p class="text-surface-400 dark:text-surface-500 text-[10px] font-bold uppercase tracking-widest">{{ 'dashboard.recent_sales.subtitle' | t }}</p>
                </div>
                <div class="w-10 h-10 bg-primary/5 dark:bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/10">
                    <i class="pi pi-shopping-bag text-xl"></i>
                </div>
            </div>

            <p-table [value]="orders()" [rows]="5" [responsiveLayout]="'scroll'" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                    <tr>
                        <th class="bg-surface-50/50 dark:bg-surface-800/50 text-surface-400 dark:text-surface-400 font-black text-[10px] uppercase tracking-wider py-4 border-none rounded-r-2xl">{{ 'dashboard.recent_sales.order' | t }}</th>
                        <th class="bg-surface-50/50 dark:bg-surface-800/50 text-surface-400 dark:text-surface-400 font-black text-[10px] uppercase tracking-wider py-4 border-none">{{ 'dashboard.recent_sales.customer' | t }}</th>
                        <th class="bg-surface-50/50 dark:bg-surface-800/50 text-surface-400 dark:text-surface-400 font-black text-[10px] uppercase tracking-wider py-4 border-none text-center">{{ 'dashboard.recent_sales.amount' | t }}</th>
                        <th class="bg-surface-50/50 dark:bg-surface-800/50 text-surface-400 dark:text-surface-400 font-black text-[10px] uppercase tracking-wider py-4 border-none text-left rounded-l-2xl">{{ 'dashboard.recent_sales.status' | t }}</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-order>
                    <tr class="border-b border-surface-50 dark:border-surface-800 last:border-none">
                        <td class="py-4 font-black text-primary text-xs">#{{order.id.slice(0, 5)}}</td>
                        <td class="py-4 font-bold text-surface-700 dark:text-surface-300 text-xs">{{order.customerName}}</td>
                        <td class="py-4 text-center font-black text-surface-900 dark:text-surface-0 text-xs font-mono">{{order.amount | currency}}</td>
                        <td class="py-4 text-left">
                            <span [class]="'font-black text-[9px] px-3 py-1 rounded-full uppercase shadow-sm ' + (order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20')">
                                {{ ('orders.status.' + order.status) | t }}
                            </span>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class RecentSalesWidget {
    orders = input.required<any[]>();

    getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'completed': return 'success';
            case 'pending': return 'warn';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }
}
