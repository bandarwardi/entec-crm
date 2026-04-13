import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsModule } from 'primeng/tabs';
import { WorkSettingsComponent } from '../work-settings/work-settings.component';
import { ScenariosComponent } from '../scenarios/scenarios.component';
import { InvoiceSettingsComponent } from '../invoice-settings/invoice-settings.component';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [CommonModule, TabsModule, WorkSettingsComponent, ScenariosComponent, InvoiceSettingsComponent, TranslatePipe],
  template: `
    <div class="card p-0 overflow-hidden shadow-xl border-0 rounded-[2rem] dark:bg-surface-900 transition-all hover:shadow-2xl">
      <!-- Gradient Header -->
      <div class="bg-gradient-to-br from-emerald-600 to-teal-500 p-8">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/10">
            <i class="pi pi-cog text-2xl font-bold animate-spin-slow"></i>
          </div>
          <div>
            <h1 class="text-3xl font-black m-0 text-white tracking-tight">{{ 'settings.title' | t }}</h1>
            <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest mt-1">{{ 'settings.subtitle' | t }}</p>
          </div>
        </div>
      </div>
        
        <p-tabs value="0">
            <p-tablist styleClass="bg-surface-50 dark:bg-slate-900/40 px-4">
                <p-tab value="0" class="flex items-center gap-2 py-4">
                    <i class="pi pi-calendar-clock"></i>
                    <span class="font-bold">{{ 'settings.tabs.work_hours' | t }}</span>
                </p-tab>
                <p-tab value="1" class="flex items-center gap-2 py-4">
                    <i class="pi pi-book"></i>
                    <span class="font-bold">{{ 'settings.tabs.ai_scenarios' | t }}</span>
                </p-tab>
                <p-tab value="2" class="flex items-center gap-2 py-4">
                    <i class="pi pi-file-edit"></i>
                    <span class="font-bold">{{ 'settings.tabs.advanced' | t }}</span>
                </p-tab>
            </p-tablist>
            <p-tabpanels class="p-6">
                <p-tabpanel value="0">
                    <app-work-settings></app-work-settings>
                </p-tabpanel>
                <p-tabpanel value="1">
                    <app-scenarios></app-scenarios>
                </p-tabpanel>
                <p-tabpanel value="2">
                    <app-invoice-settings></app-invoice-settings>
                </p-tabpanel>
            </p-tabpanels>
        </p-tabs>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
        .font-tajawal { font-family: 'Tajawal', sans-serif; }
        .p-tablist-tab-list {
            border-bottom: 0 !important;
        }
    }
  `]
})
export class SuperAdminSettingsComponent {}
