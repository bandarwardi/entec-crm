import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { PerformanceService, DailyPerformance } from '@/app/core/services/performance.service';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-day-performance-detail',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, ButtonModule, TranslatePipe, TooltipModule],
  template: `
    <div class="card font-tajawal shadow-md border-t-4 border-t-primary rounded-[2rem] dark:bg-surface-900 overflow-hidden transition-all hover:shadow-lg">
      <!-- Header -->
      <div class="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 relative overflow-hidden">
        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div class="flex items-center gap-4">
            <p-button 
              icon="pi pi-arrow-right" 
              styleClass="rounded-xl w-10 h-10 bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
              (onClick)="goBack()"
            ></p-button>
            <div>
              <h1 class="text-4xl font-black text-white mb-1 flex items-center gap-3">
                {{ 'day_details.title' | t }}: {{ date() | date:'dd/MM/yyyy' }}
              </h1>
              <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest">{{ performance()?.user?.name }} - {{ 'day_details.subtitle' | t }}</p>
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="p-12 text-center bg-white dark:bg-surface-900">
          <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
          <p class="mt-4 text-surface-500 dark:text-surface-400 font-bold tracking-widest uppercase text-xs">{{ 'day_details.loading' | t }}</p>
        </div>
      } @else if (performance()) {
        <div class="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 bg-surface-50/50 dark:bg-surface-800/30 border-b border-surface-200/50 dark:border-surface-700/50">
          <!-- Active Hours Card -->
          <div class="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 p-6 rounded-3xl border border-blue-200/50 dark:border-blue-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-blue-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-blue-500">
               <i class="pi pi-clock font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest block mb-2">{{ 'day_details.active_hours' | t }}</span>
             <span class="text-3xl font-black text-blue-800 dark:text-blue-100">{{ formatMinutes(performance()!.totals.activeMinutes) }}</span>
          </div>

          <!-- Breaks Card -->
          <div class="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-amber-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-amber-500">
               <i class="pi pi-pause font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-amber-600/60 dark:text-amber-400/60 uppercase tracking-widest block mb-1">{{ 'day_details.breaks' | t }}</span>
             <span class="text-3xl font-black text-amber-800 dark:text-amber-100">{{ formatMinutes(performance()!.totals.breakMinutes) }}</span>
             @if (performance()!.totals.excessBreakMinutes > 0) {
               <small class="block text-red-500 font-bold mt-1 text-[10px]">+{{ performance()!.totals.excessBreakMinutes }}{{ 'day_details.excess_break' | t }}</small>
             }
          </div>

          <!-- Late Card -->
          <div class="bg-gradient-to-br from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20 p-6 rounded-3xl border border-rose-200/50 dark:border-rose-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-rose-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-rose-500">
               <i class="pi pi-exclamation-circle font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-rose-600/60 dark:text-rose-400/60 uppercase tracking-widest block mb-1">{{ 'day_details.late' | t }}</span>
             <span class="text-3xl font-black text-rose-800 dark:text-rose-100">{{ performance()!.totals.lateMinutes }} <span class="text-xs">{{ 'performance.minutes_unit' | t }}</span></span>
          </div>

          <!-- Deductions Card -->
          <div class="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 p-6 rounded-3xl border border-emerald-200/50 dark:border-emerald-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-emerald-500">
               <i class="pi pi-dollar font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest block mb-1">{{ 'day_details.deductions' | t }}</span>
             <div class="text-3xl font-black text-emerald-800 dark:text-emerald-100">
               {{ performance()!.totals.deductionAmount | number:'1.2-2' }} <span class="text-xs uppercase">{{ 'performance.egp_unit' | t }}</span>
             </div>
          </div>
        </div>

        <div class="p-8 pt-0">
          <p-table [value]="filteredActivities()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th class="dark:bg-surface-800">{{ 'day_details.table.time' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'day_details.table.status' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'day_details.table.reason' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'day_details.table.duration' | t }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-act>
              <tr class="dark:border-surface-700">
                <td class="text-sm font-black text-surface-600 dark:text-surface-300 font-mono">
                  {{ act.timestamp | date:'HH:mm:ss' }}
                </td>
                <td>
                  <p-tag [value]="getStatusLabel(act.status)" [severity]="getStatusSeverity(act.status)" styleClass="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg"></p-tag>
                </td>
                <td>
                  @if (act.breakReason) {
                    <span class="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30">{{ getBreakReasonLabel(act.breakReason) }}</span>
                  } @else {
                    <span class="text-surface-300 dark:text-surface-700">-</span>
                  }
                </td>
                <td class="text-sm font-bold text-surface-500 dark:text-surface-400">
                  {{ formatMinutes(act.duration) }}
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="4" class="text-center p-12 text-surface-400 dark:text-surface-500">
                  <i class="pi pi-inbox text-4xl mb-4 block"></i>
                  {{ 'day_details.empty_msg' | t }}
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-datatable.p-datatable-sm .p-datatable-thead > tr > th {
      background: #f8fafc;
      color: #64748b;
      font-weight: 600;
      font-size: 0.8rem;
      padding: 0.75rem 0.5rem;
    }
    :host-context(.app-dark) :host ::ng-deep .p-datatable.p-datatable-sm .p-datatable-thead > tr > th {
      background: #1e293b;
      color: #cbd5e1;
      border-color: #334155;
    }
    :host-context(.app-dark) :host ::ng-deep .p-datatable .p-datatable-tbody > tr {
        background: #0f172a;
        color: #cbd5e1;
        border-color: #334155;
    }
  `]
})
export class DayPerformanceDetailComponent implements OnInit {
  private performanceService = inject(PerformanceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private i18n = inject(I18nService);

  performance = signal<DailyPerformance | null>(null);
  loading = signal(false);
  date = signal<string>('');
  userId = signal<string>('');

  filteredActivities = computed(() => {
    const perf = this.performance();
    if (!perf) return [];
    // Show only activities that are NOT 'online'
    return perf.activities.filter(act => act.status !== 'online');
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId.set(params['id']);
      this.date.set(params['date']);
      this.loadDetails();
    });
  }

  loadDetails() {
    this.loading.set(true);
    this.performanceService.getDailyPerformance(this.userId(), this.date()).subscribe({
      next: (data) => {
        this.performance.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/super-admin/employee-performance', this.userId()]);
  }

  formatMinutes(minutes: number): string {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return this.i18n.t('day_details.duration_format').replace('{h}', h.toString()).replace('{m}', m.toString());
    return this.i18n.t('day_details.duration_format_m').replace('{m}', m.toString());
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'online': return this.i18n.t('day_details.status.online');
      case 'offline': return this.i18n.t('day_details.status.offline');
      case 'break': return this.i18n.t('day_details.status.break');
      default: return status || this.i18n.t('day_details.status.unknown');
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'secondary';
      case 'break': return 'warn';
      default: return 'info';
    }
  }

  getBreakReasonLabel(reason: string): string {
    switch (reason) {
      case 'urgent_call': return this.i18n.t('day_details.break_reason.urgent_call');
      case 'bathroom': return this.i18n.t('day_details.break_reason.restroom');
      case 'lunch': return this.i18n.t('day_details.break_reason.lunch');
      case 'prayer': return this.i18n.t('day_details.break_reason.prayer');
      case 'other': return this.i18n.t('day_details.break_reason.other');
      default: return reason;
    }
  }
}
