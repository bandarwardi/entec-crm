import { Component, effect, inject, input, signal } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from '@/app/layout/service/layout.service';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [ChartModule, TranslatePipe],
    template: `<div class="card shadow-md border-t-4 border-t-emerald-500 border-surface-100 dark:border-surface-800 rounded-3xl p-6 bg-white dark:bg-surface-900 font-tajawal mb-8 transition-all hover:shadow-lg">
        <div class="flex justify-between items-center mb-6">
            <div>
                <div class="font-black text-lg text-surface-900 dark:text-surface-0 mb-1">{{ 'dashboard.revenue_stream.title' | t }}</div>
                <p class="text-surface-400 dark:text-surface-500 text-[10px] font-bold uppercase tracking-widest">{{ 'dashboard.revenue_stream.subtitle' | t }}</p>
            </div>
            <div class="w-10 h-10 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/10">
                <i class="pi pi-chart-line text-xl"></i>
            </div>
        </div>
        <div class="h-80">
            <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" class="w-full h-full" />
        </div>
    </div>`
})
export class RevenueStreamWidget {
    layoutService = inject(LayoutService);
    i18n = inject(I18nService);
    monthlyRevenue = input.required<any[]>();

    chartData = signal<any>(null);
    chartOptions = signal<any>(null);

    constructor() {
        effect(() => {
            const data = this.monthlyRevenue();
            const lang = this.i18n.currentLang(); // Trigger effect on lang change
            this.initChart(data);
        });
    }

    initChart(data: any[]) {
        const documentStyle = getComputedStyle(document.documentElement);
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        const labels = data.map(d => d.month);
        const values = data.map(d => parseFloat(d.revenue));

        this.chartData.set({
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: this.i18n.t('dashboard.revenue_stream.label'),
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                    hoverBackgroundColor: documentStyle.getPropertyValue('--p-primary-600'),
                    data: values,
                    barThickness: 24,
                    borderRadius: 6
                }
            ]
        });

        this.chartOptions.set({
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textMutedColor,
                        font: { weight: '800', size: 10 }
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textMutedColor,
                        font: { weight: '800', size: 10 }
                    },
                    grid: {
                        color: borderColor,
                        drawBorder: false,
                        drawTicks: false
                    }
                }
            }
        });
    }
}
