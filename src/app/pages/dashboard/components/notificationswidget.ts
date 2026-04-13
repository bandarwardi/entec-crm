import { Component, input, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '@/app/layout/service/layout.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-notifications-widget',
    imports: [CommonModule, ChartModule, TranslatePipe],
    template: `<div class="card shadow-md border-t-4 border-t-violet-500 border-surface-100 dark:border-surface-800 rounded-3xl p-8 bg-white dark:bg-surface-900 font-tajawal transition-all hover:shadow-lg">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <!-- Orders Distribution -->
            <div>
                <div class="font-black text-lg text-surface-900 dark:text-surface-0 mb-2">{{ 'dashboard.notifications.orders_dist' | t }}</div>
                <p class="text-surface-400 dark:text-surface-500 text-[10px] font-bold uppercase tracking-widest mb-4">{{ 'dashboard.notifications.orders_desc' | t }}</p>
                <div class="h-48 flex items-center justify-center">
                    <p-chart type="doughnut" [data]="orderChartData()" [options]="orderChartOptions()" class="w-full h-full" />
                </div>
            </div>

            <!-- Leads Funnel -->
            <div>
                <div class="font-black text-lg text-surface-900 dark:text-surface-0 mb-2">{{ 'dashboard.notifications.leads_analysis' | t }}</div>
                <p class="text-surface-400 dark:text-surface-500 text-[10px] font-bold uppercase tracking-widest mb-4">{{ 'dashboard.notifications.leads_desc' | t }}</p>
                <div class="h-48 flex items-center justify-center">
                    <p-chart type="bar" [data]="leadChartData()" [options]="leadChartOptions()" class="w-full h-full" />
                </div>
            </div>
        </div>
    </div>`
})
export class NotificationsWidget {
    layoutService = inject(LayoutService);
    i18n = inject(I18nService);
    ordersByType = input.required<any[]>();
    leadsFunnel = input.required<any[]>();

    orderChartData = signal<any>(null);
    orderChartOptions = signal<any>(null);
    leadChartData = signal<any>(null);
    leadChartOptions = signal<any>(null);

    constructor() {
        effect(() => {
            const orders = this.ordersByType();
            const leads = this.leadsFunnel();
            const lang = this.i18n.currentLang(); // Trigger on lang change
            this.initOrderChart(orders);
            this.initLeadChart(leads);
        });
    }

    initOrderChart(data: any[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        this.orderChartData.set({
            labels: data.map(d => this.translateType(d.type)),
            datasets: [{
                data: data.map(d => d.count),
                backgroundColor: [
                    documentStyle.getPropertyValue('--p-primary-500'),
                    documentStyle.getPropertyValue('--p-primary-300'),
                    documentStyle.getPropertyValue('--p-primary-100')
                ],
                borderWidth: 0
            }]
        });

        this.orderChartOptions.set({
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        font: { weight: '800', size: 10 }
                    }
                }
            }
        });
    }

    initLeadChart(data: any[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        this.leadChartData.set({
            labels: data.map(d => this.translateStatus(d.status)),
            datasets: [{
                label: this.i18n.t('ui.count') || 'Count',
                data: data.map(d => d.count),
                backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                borderRadius: 4,
                barThickness: 12
            }]
        });

        this.leadChartOptions.set({
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { display: false } },
                y: { 
                    grid: { display: false },
                    ticks: { font: { weight: '800', size: 9 } }
                }
            }
        });
    }

    translateType(type: string) {
        const map: any = { 
            'new': this.i18n.t('dashboard.types.new'), 
            'renewal': this.i18n.t('dashboard.types.renewal'), 
            'referral': this.i18n.t('dashboard.types.referral') 
        };
        return map[type] || type;
    }

    translateStatus(status: string) {
        const map: any = { 
            'new': this.i18n.t('dashboard.types.new'), 
            'interested': this.i18n.t('dashboard.status.interested'), 
            'converted': this.i18n.t('dashboard.status.converted'),
            'not_interested': this.i18n.t('dashboard.status.not_interested'),
            'pending_callback': this.i18n.t('dashboard.status.pending_callback')
        };
        return map[status] || status;
    }
}
