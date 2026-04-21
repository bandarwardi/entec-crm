import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappService } from '../../../core/services/whatsapp.service';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-ai-settings-tab',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ButtonModule, 
    TextareaModule, 
    ToggleButtonModule, 
    CardModule, 
    ToastModule,
    InputTextModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-black text-surface-900 dark:text-white m-0">إعدادات الذكاء الاصطناعي للواتساب</h2>
          <p class="text-surface-500 text-sm mt-1">قم بتغذية الذكاء الاصطناعي ببيانات شركتك وكيفية الرد على العملاء</p>
        </div>
        <p-toggleButton 
          [(ngModel)]="settings.isEnabled" 
          onLabel="مفعل" 
          offLabel="معطل" 
          onIcon="pi pi-check" 
          offIcon="pi pi-times"
          styleClass="w-32" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <p-card styleClass="border-0 shadow-sm rounded-2xl overflow-hidden">
            <template pTemplate="header">
              <div class="bg-surface-50 dark:bg-surface-800 p-4 border-b dark:border-surface-700 flex items-center gap-2">
                <i class="pi pi-info-circle text-primary"></i>
                <span class="font-bold">معلومات الشركة وسياسة الرد</span>
              </div>
            </template>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-bold text-sm">التوجيهات والبيانات (System Prompt)</label>
                <textarea 
                  pTextarea 
                  [(ngModel)]="settings.systemPrompt" 
                  rows="12" 
                  class="w-full rounded-xl border-surface-200 dark:border-surface-700 focus:ring-primary/20"
                  placeholder="اكتب هنا كل ما يحتاجه الذكاء الاصطناعي ليعرف عن شركتك (من نحن، الأسعار، الخدمات، سياسة الإرجاع، إلخ)..."></textarea>
                <small class="text-surface-400">هذه هي المعلومات التي سيعتمد عليها الذكاء الاصطناعي لاقتراح الردود على عملائك في الواتساب.</small>
              </div>
              
              <div class="flex justify-end mt-4">
                <p-button 
                  label="حفظ الإعدادات" 
                  icon="pi pi-save" 
                  (click)="saveSettings()" 
                  [loading]="loading"
                  styleClass="rounded-xl px-6" />
              </div>
            </div>
          </p-card>
        </div>

        <div class="flex flex-col gap-6">
          <p-card styleClass="border-0 shadow-sm rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30">
             <div class="flex flex-col gap-3">
               <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                 <i class="pi pi-sparkles font-bold"></i>
                 <span class="font-bold text-sm">كيف يعمل؟</span>
               </div>
               <p class="text-[12px] leading-relaxed text-emerald-800/70 dark:text-emerald-500/70 m-0">
                 عند تفعيل هذه الميزة، سيتم تحليل آخر 10 رسائل في كل محادثة، ودمجها مع التوجيهات التي تكتبها هنا، ثم إرسالها لنموذج Gemini ليقوم باقتراح الرد المناسب لك.
               </p>
             </div>
          </p-card>

          <p-card styleClass="border-0 shadow-sm rounded-2xl overflow-hidden">
            <template pTemplate="header">
                <div class="bg-surface-50 dark:bg-surface-800 p-4 border-b dark:border-surface-700 flex items-center gap-2">
                  <i class="pi pi-microchip text-primary"></i>
                  <span class="font-bold">الموديل المستخدم</span>
                </div>
              </template>
              <div class="flex flex-col gap-2">
                <label class="text-xs font-bold text-surface-500">Google Gemini Model</label>
                <input 
                  type="text" 
                  pInputText 
                  [(ngModel)]="settings.model" 
                  class="w-full rounded-xl" />
                <small class="text-[10px] text-surface-400">النموذج المقترح حالياً: <b>gemini-1.5-flash</b> لسعة الاستجابة.</small>
              </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .p-card .p-card-body { padding: 1.5rem; }
    }
  `]
})
export class AiSettingsTabComponent implements OnInit {
  private whatsappService = inject(WhatsappService);
  private messageService = inject(MessageService);
  
  settings = {
    systemPrompt: '',
    isEnabled: true,
    model: 'gemini-1.5-flash'
  };
  
  loading = false;

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.whatsappService.getAiSettings().subscribe({
      next: (res) => {
        if (res) this.settings = res;
      }
    });
  }

  saveSettings() {
    this.loading = true;
    this.whatsappService.updateAiSettings(this.settings).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ 
            severity: 'success', 
            summary: 'تم بنجاح', 
            detail: 'تم تحديث إعدادات الذكاء الاصطناعي بنجاح' 
        });
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ 
            severity: 'error', 
            summary: 'خطأ', 
            detail: 'فشل في حفظ الإعدادات' 
        });
      }
    });
  }
}
