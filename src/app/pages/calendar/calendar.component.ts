import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserLeadService, Lead } from '../../core/services/user-lead.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, TagModule, TranslatePipe],
  template: `
    <div class="card p-0 overflow-hidden shadow-2xl border-0 rounded-[2.5rem] dark:bg-surface-900 transition-all">
      <!-- Premium Header -->
      <div class="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-500 p-10 relative overflow-hidden">
        <!-- Abstract shapes for premium feel -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div class="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div class="text-center md:text-left">
            <h3 class="text-4xl font-black m-0 text-white tracking-tight flex items-center gap-4">
               <i class="pi pi-calendar text-3xl"></i>
               {{ 'ui.calendar' | t }}
            </h3>
            <p class="text-indigo-100 font-bold text-sm uppercase tracking-[0.2em] mt-3 opacity-90">{{ 'leads.follow_up_schedule' | t }}</p>
          </div>

          <div class="flex items-center gap-4 bg-white/10 backdrop-blur-md p-2 rounded-3xl border border-white/20">
            <button (click)="prevMonth()" class="p-3 rounded-2xl hover:bg-white/20 text-white transition-all">
              <i class="pi pi-chevron-left text-xl"></i>
            </button>
            <div class="px-6 text-xl font-black text-white min-w-48 text-center uppercase tracking-widest">
              {{ currentMonthName() }} {{ currentYear() }}
            </div>
            <button (click)="nextMonth()" class="p-3 rounded-2xl hover:bg-white/20 text-white transition-all">
              <i class="pi pi-chevron-right text-xl"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="p-8 bg-surface-50/50 dark:bg-surface-950/20">
        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 gap-4">
          <!-- Weekday Headers -->
          @for (day of weekDays(); track day) {
            <div class="text-center py-4 text-xs font-black text-surface-400 uppercase tracking-widest">
              {{ day }}
            </div>
          }

          <!-- Empty slots for previous month -->
          @for (empty of emptySlots(); track $index) {
            <div class="aspect-square bg-transparent"></div>
          }

          <!-- Actual Days -->
          @for (day of daysInMonth(); track day) {
            <div [class]="getDayClasses(day)" class="aspect-square rounded-[1.5rem] p-3 border border-surface-200 dark:border-surface-800 transition-all relative group flex flex-col">
              <span class="text-lg font-black" [class]="day === today() && isCurrentMonth() ? 'text-indigo-600 dark:text-indigo-400' : 'text-surface-600 dark:text-surface-300'">
                {{ day }}
              </span>
              
              <div class="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-full no-scrollbar">
                @for (reminder of getRemindersForDay(day); track reminder.id) {
                  <div (click)="goToLead(reminder.id)" 
                       class="p-2 rounded-xl bg-white dark:bg-surface-800 shadow-sm border border-surface-100 dark:border-surface-700 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group/item overflow-hidden">
                    <div class="flex items-center gap-2">
                       <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                       <span class="text-[10px] font-black text-surface-900 dark:text-white truncate">{{ reminder.name }}</span>
                    </div>
                    <div class="text-[9px] text-surface-400 font-bold mt-1 truncate">{{ reminder.reminderNote }}</div>
                  </div>
                }
              </div>

              @if (getRemindersForDay(day).length > 0) {
                 <div class="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"></div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    .today-card {
      background: rgba(99, 102, 241, 0.05);
      border-color: rgba(99, 102, 241, 0.3) !important;
      box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.05);
    }
  `]
})
export class CalendarComponent implements OnInit {
  private leadService = inject(UserLeadService);
  private i18n = inject(I18nService);
  private router = inject(Router);

  reminders = signal<Lead[]>([]);
  currentDate = signal(new Date());
  today = signal(new Date().getDate());
  
  weekDays = signal(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

  currentMonth = computed(() => this.currentDate().getMonth());
  currentYear = computed(() => this.currentDate().getFullYear());

  currentMonthName = computed(() => {
    return new Intl.DateTimeFormat(this.i18n.currentLang() === 'ar' ? 'ar-EG' : 'en-US', { month: 'long' })
      .format(this.currentDate());
  });

  daysInMonth = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  });

  emptySlots = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1).getDay();
    return Array.from({ length: firstDay });
  });

  ngOnInit() {
    this.loadReminders();
  }

  loadReminders() {
    this.leadService.getReminders().subscribe(res => {
      this.reminders.set(res);
    });
  }

  getRemindersForDay(day: number): Lead[] {
    const year = this.currentYear();
    const month = this.currentMonth();
    return this.reminders().filter(r => {
      if (!r.reminderAt) return false;
      const d = new Date(r.reminderAt);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  }

  prevMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() - 1);
    this.currentDate.set(d);
  }

  nextMonth() {
    const d = new Date(this.currentDate());
    d.setMonth(d.getMonth() + 1);
    this.currentDate.set(d);
  }

  isCurrentMonth() {
    const now = new Date();
    return now.getMonth() === this.currentMonth() && now.getFullYear() === this.currentYear();
  }

  getDayClasses(day: number) {
    let classes = 'bg-white dark:bg-surface-900/50 hover:bg-surface-50 dark:hover:bg-surface-800 ';
    if (day === this.today() && this.isCurrentMonth()) {
      classes += 'today-card ring-2 ring-indigo-500/20 ';
    }
    return classes;
  }

  goToLead(id: string) {
    this.router.navigate(['/leads'], { queryParams: { selectedLeadId: id } });
  }
}
