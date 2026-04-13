import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-best-selling-widget',
    imports: [CommonModule, TranslatePipe],
    template: `
        <div class="card shadow-md border-t-4 border-t-blue-500 border-surface-100 dark:border-surface-800 rounded-3xl p-6 bg-white dark:bg-surface-900 font-tajawal transition-all hover:shadow-lg">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <div class="font-black text-lg text-surface-900 dark:text-surface-0 mb-1">{{ 'dashboard.best_selling.title' | t }}</div>
                    <p class="text-surface-400 dark:text-surface-500 text-[10px] font-bold uppercase tracking-widest">{{ 'dashboard.best_selling.subtitle' | t }}</p>
                </div>
                <div class="w-10 h-10 bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10">
                    <i class="pi pi-trophy text-xl"></i>
                </div>
            </div>

            <ul class="list-none p-0 m-0" *ngIf="agents().length > 0">
                <li *ngFor="let agent of agents(); let i = index" class="mb-4 last:mb-0">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-bold text-surface-700 dark:text-surface-300">{{ agent.name }}</span>
                        <span class="text-xs font-black text-blue-600 dark:text-blue-400">{{ agent.totalRevenue | currency }}</span>
                    </div>
                    <div class="w-full bg-surface-50 dark:bg-surface-800 rounded-full h-2 border border-surface-100 dark:border-surface-700 overflow-hidden">
                        <div class="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm" 
                             [style.width.%]="getProgress(agent.totalRevenue)">
                        </div>
                    </div>
                    <div class="flex justify-end mt-1.5">
                        <span class="text-[9px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-tighter bg-surface-50 dark:bg-surface-800 px-2 py-0.5 rounded-md border border-surface-100 dark:border-surface-700">{{ agent.orderCount }} {{ 'dashboard.best_selling.order_count' | t }}</span>
                    </div>
                </li>
            </ul>

            <div *ngIf="agents().length === 0" class="py-10 text-center bg-surface-50 dark:bg-surface-800/50 rounded-2xl border border-dashed border-surface-200 dark:border-surface-700">
                <i class="pi pi-chart-bar text-surface-200 dark:text-surface-700 text-4xl mb-3"></i>
                <p class="text-surface-400 dark:text-surface-500 font-bold text-sm">{{ 'dashboard.best_selling.empty' | t }}</p>
            </div>
        </div>`
})
export class BestSellingWidget {
    agents = input.required<any[]>();

    maxRevenue = computed(() => {
        const list = this.agents();
        if (list.length === 0) return 0;
        return Math.max(...list.map(a => parseFloat(a.totalRevenue)));
    });

    getProgress(revenue: string | number): number {
        const rev = typeof revenue === 'string' ? parseFloat(revenue) : revenue;
        const max = this.maxRevenue();
        if (!max) return 0;
        return (rev / max) * 100;
    }
}
