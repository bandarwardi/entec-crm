import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { WorkSettingsService, WorkSettings, Holiday, AllowedZone } from '@/app/core/services/work-settings.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';
import { I18nService } from '@/app/core/i18n/i18n.service';

@Component({
  selector: 'app-work-settings',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    CardModule, 
    InputNumberModule, 
    InputTextModule,
    ButtonModule, 
    TableModule, 
    TagModule,
    DatePickerModule, 
    SelectModule,
    ToastModule,
    CheckboxModule,
    TranslatePipe
  ],
  providers: [MessageService],
  template: `
    <div class="flex flex-col gap-8 p-4">
      <p-toast></p-toast>
      
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
      <!-- Work Hours Settings -->
      <div class="card p-8 bg-surface-0 dark:bg-surface-900 shadow-xl border-0 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl">
        <div class="absolute top-0 end-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem]"></div>
        
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
            <i class="pi pi-calendar-clock text-xl"></i>
          </div>
          <h2 class="text-xl font-black m-0 tracking-tight">{{ 'work_settings.title' | t }}</h2>
        </div>

        <div class="flex flex-col gap-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-100 dark:border-surface-700/50">
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'work_settings.shift_start_hour' | t }}</label>
              <p-inputnumber [(ngModel)]="settings().shiftStartHour" [min]="0" [max]="23" [showButtons]="true" styleClass="w-full custom-input-number" dir="ltr"></p-inputnumber>
              <small class="text-surface-400 italic text-[10px]">{{ 'work_settings.24h_format_start' | t }}</small>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'work_settings.shift_start_minute' | t }}</label>
              <p-inputnumber [(ngModel)]="settings().shiftStartMinute" [min]="0" [max]="59" [showButtons]="true" styleClass="w-full custom-input-number" dir="ltr"></p-inputnumber>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-100 dark:border-surface-700/50">
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'work_settings.shift_end_hour' | t }}</label>
              <p-inputnumber [(ngModel)]="settings().shiftEndHour" [min]="0" [max]="23" [showButtons]="true" styleClass="w-full custom-input-number" dir="ltr"></p-inputnumber>
              <small class="text-surface-400 italic text-[10px]">{{ 'work_settings.24h_format_end' | t }}</small>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'work_settings.shift_end_minute' | t }}</label>
              <p-inputnumber [(ngModel)]="settings().shiftEndMinute" [min]="0" [max]="59" [showButtons]="true" styleClass="w-full custom-input-number" dir="ltr"></p-inputnumber>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
            <div class="flex flex-col gap-2">
              <label class="text-sm font-black text-surface-700 dark:text-surface-200">{{ 'work_settings.break_duration' | t }}</label>
              <p-inputnumber [(ngModel)]="settings().breakDurationMinutes" [min]="0" [showButtons]="true" styleClass="w-full custom-input-number" dir="ltr"
                suffix=" {{ 'performance.minutes_unit' | t }}"></p-inputnumber>
              <small class="text-surface-400">{{ 'work_settings.break_hint' | t }}</small>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-black text-surface-700 dark:text-surface-200">{{ 'work_settings.deduction_rate' | t }}</label>
              <p-inputnumber [(ngModel)]="settings().deductionRatePerMinute" mode="decimal" [minFractionDigits]="2" [maxFractionDigits]="2" [showButtons]="true" styleClass="w-full custom-input-number" dir="ltr"
                suffix=" {{ 'performance.egp_unit' | t }}"></p-inputnumber>
              <small class="text-surface-400">{{ 'work_settings.deduction_hint' | t }}</small>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <p-button [label]="'work_settings.save' | t" icon="pi pi-check" (onClick)="saveSettings()" [loading]="saving()" 
              styleClass="bg-gradient-to-r from-emerald-600 to-teal-500 border-0 rounded-2xl px-8 py-3 font-black shadow-lg shadow-emerald-500/20"></p-button>
          </div>
        </div>
      </div>

      <!-- Holidays Management -->
      <div class="card p-8 bg-surface-0 dark:bg-surface-900 shadow-xl border-0 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl flex flex-col">
        <div class="absolute top-0 end-0 w-32 h-32 bg-teal-500/5 rounded-bl-[4rem]"></div>
        
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600">
            <i class="pi pi-gift text-xl"></i>
          </div>
          <h2 class="text-xl font-black m-0 tracking-tight">{{ 'work_settings.holidays.title' | t }}</h2>
        </div>

        <div class="flex flex-col gap-8">
          <!-- Add New Holiday Form -->
          <div class="bg-gradient-to-br from-surface-50 to-white dark:from-surface-800/40 dark:to-surface-900/40 p-6 rounded-3xl border border-surface-200 dark:border-surface-700/50 shadow-inner flex flex-col gap-4">
            <span class="font-black text-surface-800 dark:text-white text-md uppercase tracking-widest text-xs">{{ 'work_settings.holidays.add_title' | t }}</span>
            
            <div class="flex flex-col gap-1">
              <label class="text-[10px] font-black text-surface-400 uppercase ml-1">{{ 'work_settings.holidays.name' | t }}</label>
              <input type="text" pInputText [(ngModel)]="newHoliday.name" class="w-full rounded-xl border-surface-200 dark:border-surface-800 dark:bg-surface-950/50" [placeholder]="'work_settings.holidays.name_placeholder' | t">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-[10px] font-black text-surface-400 uppercase ml-1">{{ 'work_settings.holidays.weekly' | t }}</label>
                <p-select [options]="daysOfWeek()" [(ngModel)]="newHoliday.dayOfWeek" optionLabel="label" optionValue="value" [placeholder]="'work_settings.holidays.choose_day' | t" styleClass="w-full rounded-xl dark:bg-surface-950/50 dark:border-surface-800"></p-select>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[10px] font-black text-surface-400 uppercase ml-1">{{ 'work_settings.holidays.specific_date' | t }}</label>
                <p-datepicker [(ngModel)]="newHoliday.specificDate" dateFormat="yy-mm-dd" [showIcon]="true" styleClass="w-full rounded-xl" [fluid]="true" appendTo="body"></p-datepicker>
              </div>
            </div>
            
            <div class="flex justify-end pt-2">
              <p-button [label]="'ui.add' | t" icon="pi pi-plus" styleClass="rounded-xl px-6 font-bold" (onClick)="addHoliday()" [disabled]="!newHoliday.name || (newHoliday.dayOfWeek === null && !newHoliday.specificDate)"></p-button>
            </div>
          </div>

          <!-- Holidays Table -->
          <p-table [value]="holidays()" styleClass="p-datatable-sm cell-selection-table">
            <ng-template pTemplate="header">
              <tr>
                <th class="dark:bg-surface-800 border-none">{{ 'work_settings.holidays.table.name' | t }}</th>
                <th class="dark:bg-surface-800 border-none">{{ 'work_settings.holidays.table.type' | t }}</th>
                <th class="dark:bg-surface-800 border-none">{{ 'work_settings.holidays.table.details' | t }}</th>
                <th class="dark:bg-surface-800 border-none text-center" style="width: 4rem"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-h>
              <tr class="dark:bg-surface-900/20 border-surface-100 dark:border-surface-800">
                <td class="font-bold text-surface-700 dark:text-surface-200">{{ h.name }}</td>
                <td>
                  <p-tag [value]="h.dayOfWeek !== null ? ('work_settings.holidays.type.weekly' | t) : ('work_settings.holidays.type.specific' | t)" 
                    [severity]="h.dayOfWeek !== null ? 'info' : 'warn'"
                    styleClass="rounded-lg text-[10px] font-black uppercase px-2"></p-tag>
                </td>
                <td class="text-xs text-surface-500 font-mono">
                  {{ h.dayOfWeek !== null ? getDayLabel(h.dayOfWeek) : (h.specificDate | date:'dd/MM/yyyy') }}
                </td>
                <td class="text-center">
                  <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteHoliday(h.id)" styleClass="p-0 w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      </div>
      </div> <!-- End Grid row 1 -->

      <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <!-- Security Settings -->
        <div class="card p-8 bg-surface-0 dark:bg-surface-900 shadow-xl border-0 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl">
          <div class="absolute top-0 end-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem]"></div>
          
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
              <i class="pi pi-shield text-xl"></i>
            </div>
            <h2 class="text-xl font-black m-0 tracking-tight">إعدادات الأمان (2FA) والطرد التلقائي</h2>
          </div>

          <div class="flex flex-col gap-8">
            <div class="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-800/40 rounded-2xl border border-surface-100 dark:border-surface-700/50">
                <p-checkbox [(ngModel)]="settings().securityEnabled" [binary]="true" inputId="sec-enabled"></p-checkbox>
                <label for="sec-enabled" class="cursor-pointer">
                    <div class="font-bold">تفعيل التحقق الأمني الصارم</div>
                    <small class="text-surface-500 block">يلزم جميع الموظفين تسجيل الدخول عبر البصمة والموقع الجغرافي من تطبيق الهاتف</small>
                </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-100 dark:border-surface-700/50">
                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">تأخير الطرد التلقائي (دقائق)</label>
                    <p-inputnumber [(ngModel)]="settings().autoLogoutDelayMinutes" [min]="0" [showButtons]="true" styleClass="w-full custom-input-number"></p-inputnumber>
                    <small class="text-surface-400 italic text-[10px]">الوقت بعد انتهاء الدوام ليتم طرد الجميع</small>
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">انتهاء صلاحية التحدي (دقائق)</label>
                    <p-inputnumber [(ngModel)]="settings().challengeExpiryMinutes" [min]="1" [showButtons]="true" styleClass="w-full custom-input-number"></p-inputnumber>
                    <small class="text-surface-400 italic text-[10px]">فترة السماح للموظف بالموافقة من هاتفه</small>
                </div>
            </div>

            <div class="flex justify-end mt-4">
                <p-button label="حفظ الإعدادات الأمنية" icon="pi pi-check" (onClick)="saveSettings()" [loading]="saving()" 
                styleClass="bg-gradient-to-r from-blue-600 to-indigo-500 border-0 rounded-2xl px-8 py-3 font-black shadow-lg shadow-blue-500/20"></p-button>
            </div>
          </div>
        </div>

        <!-- Geo Fencing Zones -->
        <div class="card p-8 bg-surface-0 dark:bg-surface-900 shadow-xl border-0 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl flex flex-col">
            <div class="absolute top-0 end-0 w-32 h-32 bg-orange-500/5 rounded-bl-[4rem]"></div>
            
            <div class="flex items-center gap-3 mb-8">
                <div class="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600">
                    <i class="pi pi-map-marker text-xl"></i>
                </div>
                <h2 class="text-xl font-black m-0 tracking-tight">نطاقات الحضور الجغرافية (Geo-Zones)</h2>
            </div>

            <div class="flex flex-col gap-8">
                <!-- Add New Zone Form -->
                <div class="bg-gradient-to-br from-surface-50 to-white dark:from-surface-800/40 dark:to-surface-900/40 p-6 rounded-3xl border border-surface-200 dark:border-surface-700/50 shadow-inner flex flex-col gap-4">
                    <span class="font-black text-surface-800 dark:text-white text-md uppercase tracking-widest text-xs">إضافة نطاق جغرافي جديد</span>
                    
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase ml-1">اسم النطاق (مثال: الفرع الرئيسي)</label>
                        <input type="text" pInputText [(ngModel)]="newZone.name" class="w-full rounded-xl" placeholder="اسم النطاق">
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-surface-400 uppercase ml-1">خط العرض (Latitude)</label>
                            <input type="number" pInputText [(ngModel)]="newZone.latitude" class="w-full rounded-xl">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-surface-400 uppercase ml-1">خط الطول (Longitude)</label>
                            <input type="number" pInputText [(ngModel)]="newZone.longitude" class="w-full rounded-xl">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black text-surface-400 uppercase ml-1">القطر (بالأمتار)</label>
                            <input type="number" pInputText [(ngModel)]="newZone.radiusMeters" class="w-full rounded-xl">
                        </div>
                    </div>
                    
                    <div class="flex justify-end pt-2">
                        <p-button label="إضافة" icon="pi pi-plus" styleClass="rounded-xl px-6 font-bold" (onClick)="addZone()" [disabled]="!newZone.name || !newZone.latitude || !newZone.longitude || !newZone.radiusMeters"></p-button>
                    </div>
                </div>

                <!-- Zones Table -->
                <p-table [value]="zones()" styleClass="p-datatable-sm cell-selection-table">
                    <ng-template pTemplate="header">
                        <tr>
                            <th class="dark:bg-surface-800 border-none">اسم النطاق</th>
                            <th class="dark:bg-surface-800 border-none">الإحداثيات</th>
                            <th class="dark:bg-surface-800 border-none">القطر</th>
                            <th class="dark:bg-surface-800 border-none text-center" style="width: 4rem"></th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-z>
                        <tr class="dark:bg-surface-900/20 border-surface-100 dark:border-surface-800">
                            <td class="font-bold text-surface-700 dark:text-surface-200">{{ z.name }}</td>
                            <td class="text-xs text-surface-500 font-mono">
                                {{ z.latitude }}, {{ z.longitude }}
                            </td>
                            <td>{{ z.radiusMeters }} متر</td>
                            <td class="text-center">
                                <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteZone(z.id)" styleClass="p-0 w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"></p-button>
                            </td>
                        </tr>
                    </ng-template>
                </p-table>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .custom-input-number {
        .p-inputnumber-input {
          width: 100% !important;
          border-radius: 1rem !important;
          padding-top: 0.75rem !important;
          padding-bottom: 0.75rem !important;
          font-weight: bold;
        }
        .p-inputnumber-button {
           border-radius: 0.75rem !important;
           width: 2.5rem !important;
        }
      }
    }
  `]
})
export class WorkSettingsComponent implements OnInit {
  private workSettingsService = inject(WorkSettingsService);
  private messageService = inject(MessageService);
  private i18n = inject(I18nService);

  settings = signal<WorkSettings>({
    id: 0,
    shiftStartHour: 22,
    shiftStartMinute: 0,
    shiftEndHour: 6,
    shiftEndMinute: 0,
    breakDurationMinutes: 60,
    deductionRatePerMinute: 0,
    timezone: 'Africa/Cairo',
    securityEnabled: true,
    autoLogoutDelayMinutes: 60,
    challengeExpiryMinutes: 5
  });
  
  holidays = signal<Holiday[]>([]);
  zones = signal<AllowedZone[]>([]);
  saving = signal(false);

  newHoliday: any = {
    name: '',
    dayOfWeek: null,
    specificDate: null
  };

  newZone: any = {
    name: '',
    latitude: 0,
    longitude: 0,
    radiusMeters: 500,
    isActive: true
  };

  daysOfWeek = computed(() => [
    { label: this.i18n.t('days.saturday'), value: 6 },
    { label: this.i18n.t('days.sunday'), value: 0 },
    { label: this.i18n.t('days.monday'), value: 1 },
    { label: this.i18n.t('days.tuesday'), value: 2 },
    { label: this.i18n.t('days.wednesday'), value: 3 },
    { label: this.i18n.t('days.thursday'), value: 4 },
    { label: this.i18n.t('days.friday'), value: 5 }
  ]);

  ngOnInit() {
    this.loadSettings();
    this.loadHolidays();
    this.loadZones();
  }

  loadSettings() {
    this.workSettingsService.getSettings().subscribe((data: any) => {
      this.settings.set(data);
    });
  }

  loadHolidays() {
    this.workSettingsService.getHolidays().subscribe((data: any) => {
      this.holidays.set(data);
    });
  }

  loadZones() {
    this.workSettingsService.getZones().subscribe((data: any) => {
      this.zones.set(data);
    });
  }

  saveSettings() {
    this.saving.set(true);
    this.workSettingsService.updateSettings(this.settings()).subscribe({
      next: (data: any) => {
        this.settings.set(data);
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ الإعدادات' });
        this.saving.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حفظ الإعدادات' });
        this.saving.set(false);
      }
    });
  }

  addHoliday() {
    const payload = { ...this.newHoliday };
    if (payload.specificDate) {
      payload.specificDate = this.formatDate(payload.specificDate);
    }

    this.workSettingsService.addHoliday(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'تمت الإضافة', detail: 'تمت إضافة الإجازة بنجاح' });
        this.loadHolidays();
        this.newHoliday = { name: '', dayOfWeek: null, specificDate: null };
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل إضافة الإجازة' });
      }
    });
  }

  deleteHoliday(id: number) {
    this.workSettingsService.deleteHoliday(id).subscribe(() => {
      this.messageService.add({ severity: 'info', summary: 'تم الحذف', detail: 'تم حذف الإجازة' });
      this.loadHolidays();
    });
  }

  getDayLabel(day: number): string {
    const d = this.daysOfWeek().find((x: any) => x.value === day);
    return d ? d.label : day.toString();
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  // --- Zones Logic ---
  addZone() {
    const payload = { ...this.newZone };
    this.workSettingsService.addZone(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'تمت الإضافة', detail: 'تم إضافة النطاق بنجاح' });
        this.loadZones();
        this.newZone = { name: '', latitude: 0, longitude: 0, radiusMeters: 500, isActive: true };
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل إضافة النطاق' });
      }
    });
  }

  deleteZone(id: string) {
    this.workSettingsService.deleteZone(id).subscribe(() => {
      this.messageService.add({ severity: 'info', summary: 'تم الحذف', detail: 'تم حذف النطاق' });
      this.loadZones();
    });
  }
}
