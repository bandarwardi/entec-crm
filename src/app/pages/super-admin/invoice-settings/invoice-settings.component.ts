import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from '@/app/core/services/sales.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-invoice-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  template: `
    <div class="p-4">
      <p-toast></p-toast>
      
      @if (loading()) {
        <div class="flex justify-center items-center h-96">
          <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
        </div>
      } @else {
        <!-- Invoice Settings Form -->
        <div class="card p-8 bg-surface-0 dark:bg-surface-900 shadow-xl border-0 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl">
          <div class="absolute top-0 end-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem]"></div>
          
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
              <i class="pi pi-file-edit text-xl"></i>
            </div>
            <h2 class="text-xl font-black m-0 tracking-tight">{{ 'settings.invoice.title' | t }}</h2>
          </div>

          <div class="flex flex-col gap-8 relative z-10">
            
            <!-- Company Details -->
            <div>
              <h3 class="text-sm font-bold text-surface-400 mb-4 uppercase tracking-wider">{{ 'settings.invoice.company_details' | t }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-100 dark:border-surface-700/50">
                
                <!-- Company Name -->
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.company_name' | t }}</label>
                  <div class="relative w-full">
                    <i class="pi pi-building absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 z-20"></i>
                    <input type="text" pInputText [(ngModel)]="settings.companyName" class="w-full rounded-xl pl-12 dark:bg-surface-900 border-surface-200 dark:border-surface-700 relative z-10">
                  </div>
                </div>

                <!-- Tagline -->
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.tagline' | t }}</label>
                  <div class="relative w-full">
                    <i class="pi pi-bookmark absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 z-20"></i>
                    <input type="text" pInputText [(ngModel)]="settings.tagline" class="w-full rounded-xl pl-12 dark:bg-surface-900 border-surface-200 dark:border-surface-700 relative z-10">
                  </div>
                </div>

                <!-- Email -->
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.email' | t }}</label>
                  <div class="relative w-full">
                    <i class="pi pi-envelope absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 z-20"></i>
                    <input type="email" pInputText [(ngModel)]="settings.email" class="w-full rounded-xl pl-12 dark:bg-surface-900 border-surface-200 dark:border-surface-700 relative z-10">
                  </div>
                </div>

                <!-- Phone -->
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.phone' | t }}</label>
                  <div class="relative w-full">
                    <i class="pi pi-phone absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 z-20"></i>
                    <input type="text" pInputText [(ngModel)]="settings.phone" dir="ltr" class="w-full rounded-xl pl-12 dark:bg-surface-900 border-surface-200 dark:border-surface-700 relative z-10" style="text-align: right;">
                  </div>
                </div>

              </div>
            </div>

            <!-- Referral & Promotions -->
            <div>
              <h3 class="text-sm font-bold text-surface-400 mb-4 uppercase tracking-wider">{{ 'settings.invoice.referral_rules' | t }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-100 dark:border-surface-700/50">
                
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.referral_1' | t }}</label>
                  <textarea pTextarea [(ngModel)]="settings.referralRule1" rows="2" class="w-full rounded-xl dark:bg-surface-900 border-surface-200 dark:border-surface-700 resize-none leading-relaxed text-sm"></textarea>
                </div>

                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.referral_2' | t }}</label>
                  <textarea pTextarea [(ngModel)]="settings.referralRule2" rows="2" class="w-full rounded-xl dark:bg-surface-900 border-surface-200 dark:border-surface-700 resize-none leading-relaxed text-sm"></textarea>
                </div>

              </div>
            </div>

            <!-- Notices & Agreements -->
            <div>
              <h3 class="text-sm font-bold text-surface-400 mb-4 uppercase tracking-wider">{{ 'settings.invoice.notices' | t }}</h3>
              <div class="grid grid-cols-1 gap-6 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-100 dark:border-surface-700/50">
                
                <div class="flex flex-col gap-2">
                  <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'settings.invoice.notice_text' | t }}</label>
                  <textarea pTextarea [(ngModel)]="settings.noticeText" rows="6" class="w-full rounded-xl dark:bg-surface-900 border-surface-200 dark:border-surface-700 resize-y leading-relaxed text-sm"></textarea>
                </div>

              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end mt-4">
              <p-button [label]="'ui.save' | t" icon="pi pi-check" (onClick)="saveSettings()" [loading]="saving()" 
                styleClass="bg-gradient-to-r from-blue-600 to-indigo-500 border-0 rounded-2xl px-10 py-3 font-black shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"></p-button>
            </div>

          </div>
        </div>
      }
    </div>
  `
})
export class InvoiceSettingsComponent implements OnInit {
  private messageService = inject(MessageService);
  private salesService = inject(SalesService);
  
  saving = signal(false);
  loading = signal(true);

  settings = {
    companyName: '',
    tagline: '',
    email: '',
    phone: '',
    referralRule1: '',
    referralRule2: '',
    noticeText: ''
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.salesService.getInvoiceSettings().subscribe({
      next: (data) => {
        if (data) {
          this.settings = { 
            companyName: data.companyName || '',
            tagline: data.tagline || '',
            email: data.email || '',
            phone: data.phone || '',
            referralRule1: data.referralRule1 || '',
            referralRule2: data.referralRule2 || '',
            noticeText: data.noticeText || ''
          };
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveSettings() {
    this.saving.set(true);
    
    this.salesService.updateInvoiceSettings(this.settings).subscribe({
      next: () => {
        this.saving.set(false);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Saved Successfully', 
          detail: 'Invoice settings have been updated.' 
        });
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to update settings.' 
        });
      }
    });
  }
}
