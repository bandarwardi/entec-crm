import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

@Component({
    selector: 'app-admin-daily-stats-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, TableModule, TranslatePipe],
    template: `
        <div class="card p-6 rounded-[2.5rem] shadow-sm border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h5 class="text-xl font-black text-surface-900 dark:text-white flex items-center gap-2">
                        <i class="pi pi-calendar text-emerald-500"></i>
                        {{ 'daily_stats.title' | t }}
                    </h5>
                    <p class="text-xs text-surface-500 font-bold mt-1">{{ 'daily_stats.subtitle' | t }}</p>
                </div>
                <div class="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                    <div class="flex flex-col items-end">
                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-wider">{{ 'daily_stats.today_total_leads' | t }}</span>
                        <span class="text-3xl font-black text-emerald-700 dark:text-emerald-300 leading-none mt-1">{{ todayLeadsCount }}</span>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-white dark:bg-surface-800 flex items-center justify-center shadow-sm">
                        <i class="pi pi-user-plus text-emerald-500 text-lg"></i>
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto">
                <p-table [value]="employeePerformance" [responsiveLayout]="'scroll'" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="text-xs font-black uppercase tracking-wider">{{ 'daily_stats.employee' | t }}</th>
                            <th class="text-xs font-black uppercase tracking-wider">{{ 'daily_stats.status' | t }}</th>
                            <th class="text-xs font-black uppercase tracking-wider text-center">{{ 'daily_stats.first_login' | t }}</th>
                            <th class="text-xs font-black uppercase tracking-wider text-center">{{ 'daily_stats.late' | t }}</th>
                            <th class="text-xs font-black uppercase tracking-wider text-center">{{ 'daily_stats.break' | t }}</th>
                            <th class="text-xs font-black uppercase tracking-wider text-center">{{ 'daily_stats.leads_count' | t }}</th>
                            <th class="text-xs font-black uppercase tracking-wider text-center">{{ 'daily_stats.deductions' | t }}</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-perf>
                        <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors border-b border-surface-100 dark:border-surface-800 last:border-0">
                            <td class="py-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-black text-xs">
                                        {{ perf.name.substring(0, 1).toUpperCase() }}
                                    </div>
                                    <span class="font-bold text-sm text-surface-700 dark:text-surface-200">{{ perf.name }}</span>
                                </div>
                            </td>
                            <td>
                                <p-tag 
                                    [severity]="getStatusSeverity(perf.status)" 
                                    [value]="perf.status" 
                                    styleClass="text-[9px] px-2 py-0.5 font-black uppercase" />
                            </td>
                            <td class="text-center font-bold text-xs text-surface-600">
                                {{ perf.firstLogin ? (perf.firstLogin | date:'shortTime') : '---' }}
                            </td>
                            <td class="text-center">
                                <span class="font-black text-xs" [class.text-red-500]="perf.lateMinutes > 0" [class.text-surface-400]="perf.lateMinutes === 0">
                                    {{ perf.lateMinutes }} {{ 'performance.minutes_unit' | t }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="font-black text-xs text-orange-500">
                                    {{ perf.breakMinutes }} {{ 'performance.minutes_unit' | t }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="font-black text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                                    {{ perf.leadsCount || 0 }}
                                </span>
                            </td>
                            <td class="text-center">
                                <span class="font-black text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                    {{ perf.deductionAmount | number:'1.0-0' }} {{ 'performance.egp_unit' | t }}
                                </span>
                            </td>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="emptymessage">
                        <tr>
                            <td colspan="7" class="text-center p-8 text-surface-400 font-bold text-sm">{{ 'daily_stats.no_employees' | t }}</td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
    `
})
export class AdminDailyStatsWidget {
    @Input() todayLeadsCount: number = 0;
    @Input() employeePerformance: any[] = [];

    getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (status) {
            case 'online': return 'success';
            case 'break': return 'warn';
            case 'busy': return 'danger';
            case 'offline': return 'secondary';
            default: return 'info';
        }
    }
}
