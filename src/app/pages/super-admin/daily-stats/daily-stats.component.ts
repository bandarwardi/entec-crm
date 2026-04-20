import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from '@/app/core/services/sales.service';
import { AdminDailyStatsWidget } from '../../dashboard/components/admindailystatswidget';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

@Component({
    selector: 'app-daily-stats',
    standalone: true,
    imports: [CommonModule, AdminDailyStatsWidget, ButtonModule, RouterModule, DatePickerModule, FormsModule, TranslatePipe],
    template: `
    <div class="flex flex-col gap-8 font-tajawal">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
                <p-button icon="pi pi-arrow-right" [text]="true" [routerLink]="['/super-admin/users']" styleClass="p-button-rounded text-surface-600" />
                <h1 class="text-2xl font-black text-surface-900 dark:text-white m-0">{{ 'daily_stats.title' | t }}</h1>
            </div>
            
            <div class="flex items-center gap-3 bg-white dark:bg-surface-900 p-2 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm">
                <span class="text-sm font-bold text-surface-500 px-2">{{ 'daily_stats.select_date' | t }}:</span>
                <p-datepicker 
                    [(ngModel)]="selectedDate" 
                    (onSelect)="onDateChange($any($event))" 
                    [showIcon]="true" 
                    [maxDate]="maxDate"
                    dateFormat="yy-mm-dd"
                    placeholder="YYYY-MM-DD"
                    styleClass="w-full md:w-48"
                    inputStyleClass="border-0 bg-transparent font-bold text-sm" />
            </div>
        </div>

        @if (loading()) {
            <div class="flex justify-center p-20">
                <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
            </div>
        } @else {
            <app-admin-daily-stats-widget 
                [todayLeadsCount]="todayStats()?.todayLeadsCount || 0" 
                [employeePerformance]="todayStats()?.employeePerformance || []" />
        }
    </div>
    `
})
export class DailyStatsComponent implements OnInit {
    private salesService = inject(SalesService);
    
    loading = signal(true);
    todayStats = signal<{ todayLeadsCount: number; employeePerformance: any[] } | null>(null);
    selectedDate: Date = new Date();
    maxDate: Date = new Date();

    ngOnInit() {
        this.loadStats();
    }

    onDateChange(date: Date) {
        this.selectedDate = date;
        this.loadStats();
    }

    loadStats() {
        this.loading.set(true);
        // Format date to ISO string (YYYY-MM-DD)
        const dateStr = this.selectedDate.toISOString().split('T')[0];
        this.salesService.getTodayAdminStats(dateStr).subscribe({
            next: (res: any) => {
                this.todayStats.set(res);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load stats', err);
                this.loading.set(false);
            }
        });
    }
}
