import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PerformanceService, MonthlyPerformance } from '@/app/core/services/performance.service';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-employee-performance',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule, CardModule, AvatarModule, ButtonModule, DatePickerModule, FormsModule, TranslatePipe, TooltipModule],
  template: `
    <div class="card font-tajawal shadow-md border-t-4 border-t-primary rounded-[2rem] dark:bg-surface-900 overflow-hidden transition-all hover:shadow-lg">
      <!-- Header -->
      <div class="p-5 md:p-8 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 relative overflow-hidden">
        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 relative z-10">
          <div class="flex flex-row items-center gap-3 md:gap-4 max-w-full w-full">
            <div class="shrink-0">
              <p-button 
                icon="pi pi-arrow-right" 
                styleClass="rounded-xl w-10 md:w-12 h-10 md:h-12 bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20 transition-all shadow-sm"
                (onClick)="backToList()"
              ></p-button>
            </div>
            <div class="flex-1 min-w-0">
              <h1 class="text-lg sm:text-2xl lg:text-3xl font-black text-white m-0 tracking-tight leading-tight break-words">
                {{ 'performance.title' | t }}: {{ performance()?.user?.name }}
              </h1>
              <p class="text-emerald-50/80 font-bold text-[9px] sm:text-xs uppercase tracking-widest mt-1 block leading-snug break-words">
                {{ 'performance.subtitle' | t }}
              </p>
            </div>
          </div>

          <div class="flex flex-row items-center gap-3 w-full lg:w-auto bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-sm">
            <span class="text-[10px] md:text-xs font-black text-emerald-50 uppercase tracking-[0.1em] whitespace-nowrap">{{ 'performance.month' | t }}:</span>
            <p-datepicker 
              [(ngModel)]="selectedMonth" 
              view="month" 
              dateFormat="mm/yy" 
              [readonlyInput]="true"
              styleClass="w-full sm:w-44"
              [showIcon]="true"
              (onSelect)="onMonthChange()"
            ></p-datepicker>
          </div>
        </div>
      </div>

      <!-- Monthly Performance View -->
      @if (loading()) {
        <div class="p-12 text-center bg-white dark:bg-surface-900">
          <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
          <p class="mt-4 text-surface-500 dark:text-surface-400 font-bold tracking-widest uppercase text-xs">{{ 'performance.loading' | t }}</p>
        </div>
      } @else if (performance()) {
        <div class="p-8 grid grid-cols-1 md:grid-cols-4 gap-6 bg-surface-50/50 dark:bg-surface-800/30">
          <!-- Stats Card 1: Hours -->
          <div class="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 p-6 rounded-3xl border border-blue-200/50 dark:border-blue-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-blue-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-blue-500">
               <i class="pi pi-clock font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest block mb-2">{{ 'performance.total_hours' | t }}</span>
             <span class="text-3xl font-black text-blue-800 dark:text-blue-100">{{ formatMinutes(performance()!.totals.totalActiveMinutes) }}</span>
          </div>

          <!-- Stats Card 2: Breaks -->
          <div class="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-amber-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-amber-500">
               <i class="pi pi-pause font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-amber-600/60 dark:text-amber-400/60 uppercase tracking-widest block mb-1">{{ 'performance.total_breaks' | t }}</span>
             <span class="text-3xl font-black text-amber-800 dark:text-amber-100">{{ formatMinutes(performance()!.totals.totalBreakMinutes) }}</span>
          </div>

          <!-- Stats Card 3: Late -->
          <div class="bg-gradient-to-br from-rose-500/10 to-red-500/10 dark:from-rose-500/20 dark:to-red-500/20 p-6 rounded-3xl border border-rose-200/50 dark:border-rose-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-rose-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-rose-500">
               <i class="pi pi-exclamation-circle font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-rose-600/60 dark:text-rose-400/60 uppercase tracking-widest block mb-1">{{ 'performance.total_late' | t }}</span>
             <span class="text-3xl font-black text-rose-800 dark:text-rose-100">{{ performance()!.totals.totalLateMinutes }} <span class="text-xs">{{ 'performance.minutes_unit' | t }}</span></span>
          </div>

          <!-- Stats Card 4: Deductions -->
          <div class="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 p-6 rounded-3xl border border-emerald-200/50 dark:border-emerald-700/30 relative overflow-hidden group hover:scale-[1.02] transition-transform">
             <div class="absolute top-0 end-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[2rem] rtl:rounded-bl-none rtl:rounded-br-[2rem] flex items-center justify-center text-emerald-500">
               <i class="pi pi-dollar font-bold text-xl"></i>
             </div>
             <span class="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest block mb-1">{{ 'performance.total_deductions' | t }}</span>
             <div class="text-3xl font-black text-emerald-800 dark:text-emerald-100">
               {{ performance()!.totals.totalDeductionAmount | number:'1.2-2' }} <span class="text-xs uppercase">{{ 'performance.egp_unit' | t }}</span>
             </div>
          </div>
        </div>

        <div class="p-8 pt-0">
          <p-table [value]="performance()!.days" styleClass="p-datatable-sm" [responsiveLayout]="'scroll'">
            <ng-template pTemplate="header">
              <tr>
                <th class="dark:bg-surface-800">{{ 'performance.table.date' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.day' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.first_login' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.status' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.active' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.break' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.late' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.deduction' | t }}</th>
                <th class="dark:bg-surface-800">{{ 'performance.table.details' | t }}</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-day>
              <tr [class.bg-blue-50/50]="day.isHoliday" [class.dark:bg-blue-900/10]="day.isHoliday" [class.opacity-60]="day.isHoliday" class="dark:border-surface-700">
                <td class="font-mono text-xs">{{ day.date | date:'dd/MM/yyyy' }}</td>
                <td class="text-xs font-bold">{{ getDayLabel(day.dayOfWeek) }}</td>
                <td class="text-sm font-bold" [class.text-red-500]="isLate(day.firstLogin)">
                   @if (day.firstLogin) {
                     <div class="flex items-center gap-1.5">
                       <i class="pi pi-sign-in text-xs" [class.text-red-500]="isLate(day.firstLogin)" [class.text-emerald-500]="!isLate(day.firstLogin)"></i>
                       {{ day.firstLogin | date:'HH:mm' }}
                     </div>
                   } @else { - }
                </td>
                <td>
                  @if (day.isHoliday) {
                    <p-tag [value]="'performance.status.holiday' | t" severity="info" styleClass="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg"></p-tag>
                  } @else if (!day.hasData) {
                    <span class="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase">{{ 'performance.table.no_record' | t }}</span>
                  } @else {
                    <p-tag [value]="'performance.status.work_day' | t" severity="success" styleClass="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg"></p-tag>
                  }
                </td>
                <td class="font-bold text-surface-700 dark:text-surface-200">{{ day.activeMinutes ? formatMinutes(day.activeMinutes) : '-' }}</td>
                <td [class.text-orange-600]="day.excessBreakMinutes > 0" [class.dark:text-orange-400]="day.excessBreakMinutes > 0">
                  <div class="flex items-center gap-1">
                    {{ day.breakMinutes ? formatMinutes(day.breakMinutes) : '-' }}
                    @if (day.excessBreakMinutes > 0) {
                      <i class="pi pi-exclamation-triangle text-xs text-red-500" [pTooltip]="'Excess break: ' + day.excessBreakMinutes + 'm'"></i>
                    }
                  </div>
                </td>
                <td class="font-bold" [class.text-red-500]="day.lateMinutes > 0">
                  {{ day.lateMinutes ? day.lateMinutes + ' ' + ('performance.minutes_unit' | t) : '-' }}
                </td>
                <td class="font-black text-red-600 dark:text-red-400">
                  {{ day.deductionAmount ? (day.deductionAmount | number:'1.2-2') + ' ' + ('performance.egp_unit' | t) : '-' }}
                </td>
                <td>
                  @if (!day.isHoliday && day.hasData) {
                    <p-button 
                      icon="pi pi-search" 
                      styleClass="rounded-lg w-8 h-8 p-0"
                      (onClick)="viewDayDetails(day.date)"
                      [pTooltip]="'performance.table.view_day' | t"
                    ></p-button>
                  } @else {
                    <span class="text-surface-300 dark:text-surface-700">-</span>
                  }
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="footer">
              <tr class="bg-surface-50 dark:bg-surface-800 font-black dark:text-surface-100">
                <td colspan="4" class="text-right uppercase tracking-widest text-xs pr-4">{{ 'performance.total' | t }}:</td>
                <td class="text-blue-600 dark:text-blue-400">{{ formatMinutes(performance()!.totals.totalActiveMinutes) }}</td>
                <td class="text-amber-600 dark:text-amber-400">{{ formatMinutes(performance()!.totals.totalBreakMinutes) }}</td>
                <td class="text-red-500 dark:text-red-400">{{ performance()!.totals.totalLateMinutes }} {{ 'performance.minutes_unit' | t }}</td>
                <td class="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20">{{ performance()!.totals.totalDeductionAmount | number:'1.2-2' }} {{ 'performance.egp_unit' | t }}</td>
                <td></td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep .p-datepicker .p-inputtext {
      padding: 0.25rem 0.5rem;
      font-size: 0.875rem;
      // background: transparent;
      // border: 1px solid #cbd5e1;
    }
    :host-context(.app-dark) :host ::ng-deep .p-datepicker .p-inputtext {
      border-color: #334155;
      color: #f1f5f9;
    }
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
export class EmployeePerformanceComponent implements OnInit {
  private performanceService = inject(PerformanceService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private i18n = inject(I18nService);

  performance = signal<MonthlyPerformance | null>(null);
  loading = signal(false);

  selectedUserId = signal<string | null>(null);
  selectedMonth: Date = new Date();

  ngOnInit() {
    this.route.params.subscribe(params => {
      const userId = params['id'];
      if (userId) {
        this.selectedUserId.set(userId);
        this.loadPerformance();
      } else {
        this.router.navigate(['/super-admin/users']);
      }
    });
  }

  loadPerformance() {
    const userId = this.selectedUserId();
    if (!userId) return;

    this.loading.set(true);
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth() + 1;

    this.performanceService.getMonthlyPerformance(userId, year, month).subscribe({
      next: (data: MonthlyPerformance) => {
        this.performance.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onMonthChange() {
    this.loadPerformance();
  }

  backToList() {
    this.router.navigate(['/super-admin/users']);
  }

  viewDayDetails(date: string) {
    const userId = this.selectedUserId();
    this.router.navigate(['/super-admin/employee-performance', userId, 'day', date]);
  }

  isLate(firstLogin?: string): boolean {
    if (!firstLogin) return false;
    const date = new Date(firstLogin);
    let hours: number;
    let minutes: number;

    if (!isNaN(date.getTime())) {
      hours = date.getHours();
      minutes = date.getMinutes();
    } else {
      const parts = firstLogin.split(':');
      if (parts.length < 2) return false;
      hours = Number(parts[0]);
      minutes = Number(parts[1]);
    }
    return hours > 10 || (hours === 10 && minutes > 0);
  }

  formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}:${m < 10 ? '0' + m : m}`;
  }

  getDayLabel(day: string): string {
    const days: any = {
      'Monday': this.i18n.t('days.monday'),
      'Tuesday': this.i18n.t('days.tuesday'),
      'Wednesday': this.i18n.t('days.wednesday'),
      'Thursday': this.i18n.t('days.thursday'),
      'Friday': this.i18n.t('days.friday'),
      'Saturday': this.i18n.t('days.saturday'),
      'Sunday': this.i18n.t('days.sunday')
    };
    return days[day] || day;
  }
}
