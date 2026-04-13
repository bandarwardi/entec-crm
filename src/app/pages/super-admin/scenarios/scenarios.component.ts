import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AiChatService, SalesScenario } from '@/app/core/services/ai-chat.service';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

@Component({
  selector: 'app-scenarios',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    ButtonModule, 
    InputTextModule, 
    TextareaModule, 
    DialogModule, 
    ToastModule, 
    ConfirmDialogModule,
    InputNumberModule,
    ToggleButtonModule,
    TranslatePipe
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <div class="card p-8 bg-surface-0 dark:bg-surface-900 shadow-xl border-0 rounded-[2.5rem] relative overflow-hidden transition-all hover:shadow-2xl flex flex-col">
      <div class="absolute top-0 end-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem]"></div>
      
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
            <i class="pi pi-sparkles text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-black m-0 tracking-tight">{{ 'scenarios.title' | t }}</h2>
            <p class="text-sm text-surface-500 mt-1">إعدادات سيناريوهات الذكاء الاصطناعي والمحادثات</p>
          </div>
        </div>
        <p-button [label]="'scenarios.add_button' | t" icon="pi pi-plus" (onClick)="openNew()"
                  styleClass="rounded-xl px-6 font-bold"></p-button>
      </div>

      <div>
        <p-table [value]="scenarios()" [rows]="10" [paginator]="true" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem"></th>
              <th>{{ 'scenarios.table.title' | t }}</th>
              <th>{{ 'scenarios.table.category' | t }}</th>
              <th>{{ 'scenarios.table.order' | t }}</th>
              <th>{{ 'scenarios.table.status' | t }}</th>
              <th style="width: 10rem">{{ 'ui.actions' | t }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-scenario>
            <tr>
              <td><i [class]="scenario.icon || 'pi pi-tag'" class="text-primary text-xl"></i></td>
              <td>
                <div class="font-bold text-surface-900 dark:text-surface-0">{{ scenario.title }}</div>
                <div class="text-xs text-slate-500 truncate max-w-xs">{{ scenario.description }}</div>
              </td>
              <td>
                <span class="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {{ getCategoryLabel(scenario.category) }}
                </span>
              </td>
              <td class="font-mono font-bold">{{ scenario.sortOrder }}</td>
              <td>
                <i class="pi" [class.pi-check-circle]="scenario.isActive" [class.text-emerald-500]="scenario.isActive"
                   [class.pi-times-circle]="!scenario.isActive" [class.text-red-500]="!scenario.isActive"></i>
              </td>
              <td>
                <div class="flex gap-2">
                  <p-button icon="pi pi-pencil" [text]="true" [rounded]="true" (onClick)="editScenario(scenario)"></p-button>
                  <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" (onClick)="deleteScenario(scenario)"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Scenario Dialog -->
      <p-dialog [(visible)]="showDialog" [header]="editingScenario.id ? ('scenarios.dialog.edit_title' | t) : ('scenarios.add_button' | t)" [modal]="true" [style]="{width: '500px'}">
        <div class="flex flex-col gap-4 p-fluid">
          <div class="field">
            <label class="font-bold block mb-2">{{ 'scenarios.table.title' | t }}</label>
            <input type="text" pInputText [(ngModel)]="editingScenario.title" [placeholder]="'scenarios.dialog.title_placeholder' | t" />
          </div>
          
          <div class="field">
            <label class="font-bold block mb-2">{{ 'scenarios.dialog.description' | t }}</label>
            <input type="text" pInputText [(ngModel)]="editingScenario.description" [placeholder]="'scenarios.dialog.description_placeholder' | t" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="field">
              <label class="font-bold block mb-2">{{ 'scenarios.table.category' | t }}</label>
              <input type="text" pInputText [(ngModel)]="editingScenario.category" placeholder="objections, closing, etc." />
            </div>
            <div class="field">
              <label class="font-bold block mb-2">{{ 'scenarios.dialog.icon' | t }}</label>
              <input type="text" pInputText [(ngModel)]="editingScenario.icon" placeholder="pi-tag" />
            </div>
          </div>

          <div class="field">
            <label class="font-bold block mb-2">{{ 'scenarios.dialog.prompt' | t }}</label>
            <textarea pTextarea [(ngModel)]="editingScenario.prompt" rows="5" [placeholder]="'scenarios.dialog.prompt_placeholder' | t"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="field">
              <label class="font-bold block mb-2">{{ 'scenarios.table.order' | t }}</label>
              <p-inputNumber [(ngModel)]="editingScenario.sortOrder"></p-inputNumber>
            </div>
            <div class="field flex items-center gap-3 pt-8">
              <p-toggleButton [(ngModel)]="editingScenario.isActive" [onLabel]="'ui.active' | t" [offLabel]="'ui.disabled' | t"></p-toggleButton>
              <label class="font-bold">{{ 'scenarios.table.status' | t }}</label>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <p-button [label]="'ui.cancel' | t" icon="pi pi-times" styleClass="p-button-text" (onClick)="showDialog = false"></p-button>
          <p-button [label]="'ui.save' | t" icon="pi pi-check" (onClick)="saveScenario()"></p-button>
        </ng-template>
      </p-dialog>

      <p-confirmDialog [acceptLabel]="'ui.yes' | t" [rejectLabel]="'ui.no' | t"></p-confirmDialog>
    </div>
  `,
})
export class ScenariosComponent implements OnInit {
  private aiChatService = inject(AiChatService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(I18nService);

  scenarios = signal<SalesScenario[]>([]);
  showDialog = false;
  editingScenario: Partial<SalesScenario> = {};

  ngOnInit() {
    this.loadScenarios();
  }

  loadScenarios() {
    this.aiChatService.getAllScenarios().subscribe(data => {
      this.scenarios.set(data);
    });
  }

  openNew() {
    this.editingScenario = {
      isActive: true,
      sortOrder: this.scenarios().length + 1,
      icon: 'pi pi-tag'
    };
    this.showDialog = true;
  }

  editScenario(scenario: SalesScenario) {
    this.editingScenario = { ...scenario };
    this.showDialog = true;
  }

  deleteScenario(scenario: SalesScenario) {
    this.confirmationService.confirm({
      message: this.i18n.t('scenarios.delete.confirm_msg').replace('{title}', scenario.title),
      header: this.i18n.t('ui.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.aiChatService.deleteScenario(scenario.id).subscribe(() => {
          this.loadScenarios();
          this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('leads.delete.success') });
        });
      }
    });
  }

  saveScenario() {
    if (!this.editingScenario.title || !this.editingScenario.prompt) {
      this.messageService.add({ severity: 'error', summary: this.i18n.t('ui.error'), detail: this.i18n.t('ui.error') });
      return;
    }

    const obs = this.editingScenario.id 
      ? this.aiChatService.updateScenario(this.editingScenario.id, this.editingScenario)
      : this.aiChatService.createScenario(this.editingScenario);

    obs.subscribe(() => {
      this.loadScenarios();
      this.showDialog = false;
      this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('ui.success') });
    });
  }

  getCategoryLabel(category: string): string {
    const labels: any = {
      'objections': this.i18n.t('scenarios.category.objections'),
      'closing': this.i18n.t('scenarios.category.closing'),
      'follow-up': this.i18n.t('scenarios.category.follow_up'),
      'support': this.i18n.t('scenarios.category.support'),
      'other': this.i18n.t('scenarios.category.other')
    };
    return labels[category] || category;
  }
}
