import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from '@/app/core/services/sales.service';
import { AdminDailyStatsWidget } from '../../dashboard/components/admindailystatswidget';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-daily-stats',
    standalone: true,
    imports: [CommonModule, AdminDailyStatsWidget, ButtonModule, RouterModule],
    template: `
    <div class="flex flex-col gap-8 font-tajawal">
        <div class="flex items-center gap-4">
            <p-button icon="pi pi-arrow-right" [text]="true" [routerLink]="['/super-admin/users']" styleClass="p-button-rounded text-surface-600" />
            <h1 class="text-2xl font-black text-surface-900 dark:text-white m-0">الإحصائيات اليومية التفصيلية</h1>
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

    ngOnInit() {
        this.loadTodayStats();
    }

    loadTodayStats() {
        this.loading.set(true);
        this.salesService.getTodayAdminStats().subscribe({
            next: (res: any) => {
                this.todayStats.set(res);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Failed to load today stats', err);
                this.loading.set(false);
            }
        });
    }
}
