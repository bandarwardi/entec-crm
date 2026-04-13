import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, ViewChild, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService, LazyLoadEvent } from 'primeng/api';
import { UserLeadService, Lead, LeadStatus } from '../../core/services/user-lead.service';
import { US_CA_STATES } from '../../core/services/us-ca-states';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { LeadsStore } from '../../core/stores/leads.store';
import { DatePipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { TextareaModule } from 'primeng/textarea';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { HostListener } from '@angular/core';
import * as XLSX from 'xlsx';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    DatePickerModule,
    DialogModule,
    DatePipe,
    TooltipModule,
    PopoverModule,
    TextareaModule,
    TranslatePipe
  ],
  template: `
    <div class="card p-0 overflow-hidden shadow-xl border-0 rounded-[2rem] dark:bg-surface-900 transition-all hover:shadow-2xl">
      <!-- Gradient Header -->
      <div class="bg-gradient-to-br from-emerald-600 to-teal-500 p-8">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner">
              <i class="pi pi-phone text-2xl font-bold"></i>
            </div>
            <div>
              <h3 class="text-3xl font-black m-0 text-white tracking-tight">{{ 'leads.title' | t }}</h3>
              <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest mt-1">{{ 'leads.subtitle' | t }}</p>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3 w-full md:w-auto">
            <p-iconField iconPosition="left" class="w-full md:w-80">
              <p-inputIcon class="pi pi-search text-white/70" />
              <input 
                pInputText 
                type="text" 
                (input)="onSearch($event)" 
                [placeholder]="'leads.search_placeholder' | t" 
                class="w-full rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:ring-white/30 backdrop-blur-md" 
              />
            </p-iconField>
            <p-button [label]="'leads.import' | t" icon="pi pi-file-import" (onClick)="fileInput.click()" [loading]="store.loading()" styleClass="rounded-2xl bg-white/20 border-white/30 text-white hover:bg-white/30 px-6 font-bold"></p-button>
            <p-button [label]="'leads.export' | t" icon="pi pi-file-export" (onClick)="exportExcel()" [loading]="store.loading()" styleClass="rounded-2xl bg-white/20 border-white/30 text-white hover:bg-white/30 px-6 font-bold"></p-button>
            <input #fileInput type="file" (change)="onFileChange($event)" accept=".xlsx, .xls" style="display: none" />
          </div>
        </div>
      </div>

      <div class="p-8">
        <!-- Filters Bar -->
        <div class="flex flex-wrap gap-4 mb-8 p-6 bg-surface-50 dark:bg-surface-800/40 rounded-3xl border border-surface-200 dark:border-surface-700/50 shadow-inner">
          <div class="flex items-center gap-2 mr-2">
             <div class="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
               <i class="pi pi-filter"></i>
             </div>
             <span class="text-xs font-black text-surface-500 dark:text-surface-400 uppercase tracking-widest">{{ 'ui.search' | t }}</span>
          </div>
          <p-select [options]="filterStatusOptions()" [(ngModel)]="selectedStatus" (onChange)="applyFilters()" [placeholder]="'leads.filter.all_statuses' | t" class="w-full md:w-48" styleClass="rounded-xl"></p-select>
          <p-select [options]="reminderOptions()" [(ngModel)]="selectedReminder" (onChange)="applyFilters()" [placeholder]="'leads.filter.all_reminders' | t" class="w-full md:w-48" styleClass="rounded-xl"></p-select>
          <p-select [options]="filterStateOptions()" [(ngModel)]="selectedState" (onChange)="applyFilters()" [filter]="true" [placeholder]="'leads.filter.all_states' | t" class="w-full md:w-48" styleClass="rounded-xl"></p-select>
          <p-button [label]="'leads.filter.clear' | t" icon="pi pi-filter-slash" [text]="true" (onClick)="clearFilters()" severity="secondary" styleClass="text-emerald-600 dark:text-emerald-400 font-bold ml-auto"></p-button>
        </div>

        <!-- Inline Add Form -->
        <form [formGroup]="leadForm" (ngSubmit)="onAddLead()" class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 p-6 bg-gradient-to-br from-surface-100 to-white dark:from-surface-800 dark:to-surface-900 rounded-[2rem] border border-surface-200 dark:border-surface-700 shadow-xl">
          <div class="flex flex-col">
            <label class="text-[10px] font-black text-surface-400 uppercase mb-1 ml-2">{{ 'leads.table.name' | t }}</label>
            <input pInputText formControlName="name" [placeholder]="'leads.table.name' | t" class="w-full dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 rounded-xl" />
            @if (leadForm.get('name')?.invalid && leadForm.get('name')?.touched) {
              <small class="text-red-500 font-bold mt-1 ml-1 text-[10px]">{{ 'leads.validation.name_required' | t }}</small>
            }
          </div>
          <div class="flex flex-col">
            <label class="text-[10px] font-black text-surface-400 uppercase mb-1 ml-2">{{ 'leads.table.phone' | t }}</label>
            <input pInputText formControlName="phone" [placeholder]="'leads.table.phone' | t" class="w-full dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 rounded-xl" />
            @if (leadForm.get('phone')?.invalid && leadForm.get('phone')?.touched) {
              <small class="text-red-500 font-bold mt-1 ml-1 text-[10px]">{{ 'leads.validation.phone_required' | t }}</small>
            }
          </div>
          <div class="flex flex-col">
            <label class="text-[10px] font-black text-surface-400 uppercase mb-1 ml-2">{{ 'leads.table.state' | t }}</label>
            <p-select [options]="states" formControlName="state" optionLabel="label" optionValue="value" [filter]="true" [filterPlaceholder]="'ui.search' | t" [placeholder]="'leads.table.state' | t" [fluid]="true" appendTo="body" styleClass="dark:bg-surface-950 dark:border-surface-800 rounded-xl"></p-select>
            @if (leadForm.get('state')?.invalid && leadForm.get('state')?.touched) {
              <small class="text-red-500 font-bold mt-1 ml-1 text-[10px]">{{ 'leads.validation.state_required' | t }}</small>
            }
          </div>
          <div class="flex flex-col">
            <label class="text-[10px] font-black text-surface-400 uppercase mb-1 ml-2">{{ 'leads.notes' | t }}</label>
            <input pInputText formControlName="notes" [placeholder]="'leads.notes' | t" class="w-full dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 rounded-xl" />
          </div>
          <div class="flex items-end">
            <p-button [label]="'ui.add' | t" icon="pi pi-plus" [loading]="store.adding()" type="submit" styleClass="w-full rounded-xl font-black shadow-lg shadow-emerald-500/20 py-3 uppercase tracking-widest text-xs"></p-button>
          </div>
        </form>

      <!-- Leads Table -->
      <p-table 
        [value]="store.allLeads()" 
        [lazy]="true" 
        (onLazyLoad)="loadLeads($event)" 
        [paginator]="true" 
        [rows]="store.pageSize()" 
        [totalRecords]="store.total()" 
        [loading]="store.loading()" 
        [rowsPerPageOptions]="[10, 20, 50]"
        dataKey="id"
        [tableStyle]="{ 'min-width': '75rem' }"
        styleClass="p-datatable-sm cell-selection-table"
        [rowHover]="true"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'leads.table.name' | t }}</th>
            <th>{{ 'leads.table.phone' | t }}</th>
            <th>{{ 'leads.table.state' | t }}</th>
            <th>{{ 'leads.table.status' | t }}</th>
            <th>{{ 'leads.notes' | t }}</th>
            <th>{{ 'leads.table.creator' | t }}</th>
            <th>{{ 'leads.table.reminder' | t }}</th>
            <th style="width: 8rem"></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-lead let-ri="rowIndex">
          <tr>
            <td (mousedown)="onMouseDown($event, ri, 0)" (mousemove)="onMouseMove($event, ri, 0)" 
                [class.selected-cell]="isCellSelected(ri, 0)"
                [pEditableColumn]="lead.name" pEditableColumnField="name" [pEditableColumnDisabled]="editingLeadId !== null">
              <p-cellEditor>
                <ng-template pTemplate="input">
                  <input pInputText type="text" [(ngModel)]="lead.name" (blur)="onEditLead(lead)" class="w-full" />
                </ng-template>
                <ng-template pTemplate="output">
                  {{ lead.name }}
                </ng-template>
              </p-cellEditor>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 1)" (mousemove)="onMouseMove($event, ri, 1)" 
                [class.selected-cell]="isCellSelected(ri, 1)"
                [pEditableColumn]="lead.phone" pEditableColumnField="phone" [pEditableColumnDisabled]="editingLeadId !== null">
              <p-cellEditor>
                <ng-template pTemplate="input">
                  <input pInputText type="text" [(ngModel)]="lead.phone" (blur)="onEditLead(lead)" class="w-full" />
                </ng-template>
                <ng-template pTemplate="output">
                  {{ lead.phone }}
                </ng-template>
              </p-cellEditor>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 2)" (mousemove)="onMouseMove($event, ri, 2)" 
                [class.selected-cell]="isCellSelected(ri, 2)"
                [pEditableColumn]="lead.state" pEditableColumnField="state" [pEditableColumnDisabled]="editingLeadId !== null">
              <p-cellEditor>
                <ng-template pTemplate="input">
                  <p-select [options]="states" [(ngModel)]="lead.state" (onChange)="onEditLead(lead)" [filter]="true" [fluid]="true" appendTo="body"></p-select>
                </ng-template>
                <ng-template pTemplate="output">
                  {{ lead.state }}
                </ng-template>
              </p-cellEditor>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 3)" (mousemove)="onMouseMove($event, ri, 3)" 
                [class.selected-cell]="isCellSelected(ri, 3)"
                [pEditableColumn]="lead.status" pEditableColumnField="status" [pEditableColumnDisabled]="editingLeadId !== null">
              <p-cellEditor>
                <ng-template pTemplate="input">
                  <p-select [options]="statuses()" [(ngModel)]="lead.status" (onChange)="onEditLead(lead)" [fluid]="true" appendTo="body"></p-select>
                </ng-template>
                <ng-template pTemplate="output">
                  <p-tag [value]="getStatusLabel(lead.status)" [severity]="getStatusSeverity(lead.status)"></p-tag>
                </ng-template>
              </p-cellEditor>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 4)" (mousemove)="onMouseMove($event, ri, 4)" 
                [class.selected-cell]="isCellSelected(ri, 4)"
                (dblclick)="startEditingNotes(lead, notesOp)">
               @if (editingLeadId === lead.id) {
                <input pInputText type="text" [(ngModel)]="lead.notes" (blur)="stopEditingNotes(lead)" class="w-full" />
               } @else {
                 <div class="max-w-[150px] truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-surface-700 dark:text-surface-200" 
                      [pTooltip]="lead.notes" tooltipPosition="top"
                      (click)="notesOp.toggle($event)">
                   {{ lead.notes || '---' }}
                 </div>
               }
               <p-popover #notesOp styleClass="dark:bg-surface-900 dark:border-surface-700">
                 <div class="p-3 max-w-[300px] text-sm break-words whitespace-pre-wrap text-surface-700 dark:text-surface-200">
                    {{ lead.notes }}
                 </div>
               </p-popover>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 5)" (mousemove)="onMouseMove($event, ri, 5)" 
                [class.selected-cell]="isCellSelected(ri, 5)">{{ lead.createdBy?.name }}</td>
            <td (mousedown)="onMouseDown($event, ri, 6)" (mousemove)="onMouseMove($event, ri, 6)" 
                [class.selected-cell]="isCellSelected(ri, 6)"
                (click)="openReminderDialog(lead)" class="cursor-pointer hover:bg-gray-100 dark:hover:bg-surface-800 p-2 rounded transition-colors">
              <i class="pi pi-bell ml-2" [class.text-blue-500]="lead.reminderAt"></i>
              <span class="text-sm text-surface-700 dark:text-surface-200">
                @if (lead.reminderAt) {
                  {{ lead.reminderAt | date:'short' }}
                } @else {
                  {{ 'leads.table.no_reminder' | t }}
                }
              </span>
            </td>
            <td>
              @if (!isAgent()) {
                <p-button icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (onClick)="onDeleteLead(lead)"></p-button>
              }
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-confirmdialog [header]="'leads.delete.confirm_title' | t" icon="pi pi-exclamation-triangle" [acceptLabel]="'ui.yes' | t" [rejectLabel]="'ui.no' | t"></p-confirmdialog>
    <p-toast position="bottom-right"></p-toast>

    <!-- Reminder Dialog -->
    <p-dialog [(visible)]="displayReminder" [header]="'leads.reminder.dialog_title' | t" [modal]="true" [style]="{ width: '400px' }">
      <div class="flex flex-col gap-4 mt-2">
        <div class="flex flex-col">
          <label class="font-bold mb-2">{{ 'leads.reminder.at' | t }}</label>
          <p-datepicker [(ngModel)]="selectedLead.reminderAt" [showTime]="true" [showIcon]="true" appendTo="body" class="w-full" [fluid]="true"></p-datepicker>
        </div>
        <div class="flex flex-col">
          <label class="font-bold mb-2">{{ 'leads.reminder.note' | t }}</label>
          <input pInputText [(ngModel)]="selectedLead.reminderNote" [placeholder]="'leads.reminder.note_placeholder' | t" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button [label]="'ui.cancel' | t" icon="pi pi-times" [text]="true" (onClick)="displayReminder = false"></p-button>
        <p-button [label]="'ui.save' | t" icon="pi pi-check" (onClick)="saveReminder()"></p-button>
      </ng-template>
    </p-dialog>

    <style>
      .cell-selection-table .selected-cell {
        background-color: rgba(59, 130, 246, 0.2) !important;
        outline: 1px solid #3b82f6 !important;
        outline-offset: -1px;
      }
      .cell-selection-table td {
        user-select: none;
      }
    </style>
  `,
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(I18nService);
  private datePipe = inject(DatePipe);
  private leadService = inject(UserLeadService);
  private authStore = inject(AuthStore);
  readonly store = inject(LeadsStore);

  isAgent = computed(() => this.authStore.user()?.role === 'agent');

  private searchSubject = new Subject<string>();

  states = US_CA_STATES;
  statuses = computed(() => [
    { label: this.i18n.t('dashboard.types.new'), value: LeadStatus.NEW },
    { label: this.i18n.t('dashboard.status.interested'), value: LeadStatus.INTERESTED },
    { label: this.i18n.t('dashboard.status.not_interested'), value: LeadStatus.NOT_INTERESTED },
    { label: this.i18n.t('leads.status.subscribed_elsewhere'), value: LeadStatus.SUBSCRIBED_ELSEWHERE },
    { label: this.i18n.t('leads.status.pending_callback'), value: LeadStatus.PENDING_CALLBACK },
    { label: this.i18n.t('dashboard.status.converted'), value: LeadStatus.CONVERTED }
  ]);

  filterStatusOptions = computed(() => [
    { label: this.i18n.t('leads.filter.all_statuses'), value: null },
    ...this.statuses()
  ]);

  filterStateOptions = computed(() => [
    { label: this.i18n.t('leads.filter.all_states'), value: null },
    ...this.states
  ]);

  reminderOptions = computed(() => [
    { label: this.i18n.t('leads.filter.all_reminders'), value: null },
    { label: this.i18n.t('leads.filter.has_reminder'), value: 'true' },
    { label: this.i18n.t('leads.filter.no_reminder'), value: 'false' }
  ]);

  selectedStatus: string | null = null;
  selectedState: string | null = null;
  selectedReminder: string | null = null;

  // Selection Logic
  isSelecting = false;
  startCell = { r: -1, c: -1 };
  endCell = { r: -1, c: -1 };

  leadForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    state: ['', Validators.required],
    notes: ['']
  });

  displayReminder = false;
  selectedLead: any = {};
  editingLeadId: number | null = null;
  
  constructor() {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => {
      this.store.loadLeads({ 
        page: 1, 
        limit: this.store.pageSize(), 
        search: term,
        status: this.selectedStatus || undefined,
        state: this.selectedState || undefined,
        hasReminder: this.selectedReminder || undefined
      });
    });

    effect(() => {
      const error = this.store.error();
      const lang = this.i18n.currentLang(); // Trigger on lang change
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.t('ui.error'),
          detail: error,
          life: 3000
        });
        setTimeout(() => this.store.clearError(), 3100);
      }
    });
  }

  ngOnInit() {
    this.initialLoad();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  initialLoad() {
    this.store.loadLeads({ page: 1, limit: this.store.pageSize() });
  }

  applyFilters() {
    this.store.loadLeads({
      page: 1,
      limit: this.store.pageSize(),
      search: this.store.searchTerm(),
      status: this.selectedStatus || undefined,
      state: this.selectedState || undefined,
      hasReminder: this.selectedReminder || undefined
    });
  }

  clearFilters() {
    this.selectedStatus = null;
    this.selectedState = null;
    this.selectedReminder = null;
    this.applyFilters();
  }

  loadLeads(event: LazyLoadEvent | any) {
    const page = (event.first / event.rows) + 1;
    this.store.loadLeads({ 
      page, 
      limit: event.rows, 
      search: this.store.searchTerm(),
      status: this.selectedStatus || undefined,
      state: this.selectedState || undefined,
      hasReminder: this.selectedReminder || undefined
    });
  }

  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  onAddLead() {
    if (this.leadForm.valid) {
      this.store.createLead(this.leadForm.value as any);
      this.leadForm.reset();
    } else {
      this.leadForm.markAllAsTouched();
    }
  }

  onEditLead(lead: Lead) {
    this.store.updateLead({ id: lead.id, changes: lead });
  }

  onDeleteLead(lead: Lead) {
    this.confirmationService.confirm({
      message: this.i18n.t('leads.delete.confirm_msg'),
      header: this.i18n.t('leads.delete.confirm_title'),
      acceptLabel: this.i18n.t('ui.yes'),
      rejectLabel: this.i18n.t('ui.no'),
      accept: () => {
        this.store.deleteLead(lead.id);
        this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('leads.delete.success') });
      }
    });
  }

  openReminderDialog(lead: Lead) {
    this.selectedLead = { ...lead, reminderAt: lead.reminderAt ? new Date(lead.reminderAt) : null };
    this.displayReminder = true;
  }

  saveReminder() {
    const update = {
      reminderAt: this.selectedLead.reminderAt?.toISOString(),
      reminderNote: this.selectedLead.reminderNote
    };
    this.store.updateLead({ id: this.selectedLead.id, changes: update });
    this.displayReminder = false;
    this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('leads.reminder.success') });
  }

  startEditingNotes(lead: any, op: any) {
    op.hide();
    this.editingLeadId = lead.id;
  }

  stopEditingNotes(lead: any) {
    this.editingLeadId = null;
    this.onEditLead(lead);
  }

  getStatusLabel(status: string) {
    return this.statuses().find(s => s.value === status)?.label || status;
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | undefined {
    switch (status) {
      case LeadStatus.NEW: return 'info';
      case LeadStatus.INTERESTED: return 'success';
      case LeadStatus.NOT_INTERESTED: return 'danger';
      case LeadStatus.SUBSCRIBED_ELSEWHERE: return 'warn';
      case LeadStatus.PENDING_CALLBACK: return 'contrast';
      case LeadStatus.CONVERTED: return 'success';
      default: return 'secondary';
    }
  }

  // Excel Logic
  exportExcel() {
    this.leadService.exportLeads().subscribe(data => {
      const exportData = data.map(l => ({
        [this.i18n.t('leads.table.name')]: l.name,
        [this.i18n.t('leads.table.phone')]: l.phone,
        [this.i18n.t('leads.table.state')]: l.state,
        [this.i18n.t('leads.table.status')]: this.getStatusLabel(l.status),
        [this.i18n.t('leads.notes')]: l.notes,
        [this.i18n.t('leads.table.creator')]: l.createdBy?.name,
        [this.i18n.t('leads.table.reminder')]: l.reminderAt ? this.datePipe.transform(l.reminderAt, 'short') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      XLSX.writeFile(workbook, `Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length > 0) {
          const headers = data[0].map(h => String(h).trim());
          // Check first 3 columns: Name, Phone, State
          if (headers[0] === 'Name' && headers[1] === 'Phone' && headers[2] === 'State') {
            const leadsToImport = data.slice(1).map(row => ({
              name: String(row[0] || ''),
              phone: String(row[1] || ''),
              state: String(row[2] || ''),
              notes: String(row[3] || ''),
              status: LeadStatus.NEW
            })).filter(l => l.name && l.phone);

            this.confirmationService.confirm({
              message: this.i18n.t('leads.import.confirm_msg').replace('{count}', leadsToImport.length.toString()),
              header: this.i18n.t('leads.import.confirm'),
              accept: () => {
                this.store.importLeads(leadsToImport);
                event.target.value = '';
              }
            });
          } else {
            this.messageService.add({ severity: 'error', summary: this.i18n.t('ui.error'), detail: this.i18n.t('leads.import.error_columns') });
            event.target.value = '';
          }
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  // Selection Logic
  onMouseDown(event: MouseEvent, r: number, c: number) {
    this.isSelecting = true;
    this.startCell = { r, c };
    this.endCell = { r, c };
  }

  onMouseMove(event: MouseEvent, r: number, c: number) {
    if (this.isSelecting) {
      this.endCell = { r, c };
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isSelecting = false;
  }

  isCellSelected(r: number, c: number): boolean {
    if (this.startCell.r === -1) return false;
    const minR = Math.min(this.startCell.r, this.endCell.r);
    const maxR = Math.max(this.startCell.r, this.endCell.r);
    const minC = Math.min(this.startCell.c, this.endCell.c);
    const maxC = Math.max(this.startCell.c, this.endCell.c);

    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
      this.copySelectedCells();
    }
  }

  copySelectedCells() {
    if (this.startCell.r === -1) return;

    const minR = Math.min(this.startCell.r, this.endCell.r);
    const maxR = Math.max(this.startCell.r, this.endCell.r);
    const minC = Math.min(this.startCell.c, this.endCell.c);
    const maxC = Math.max(this.startCell.c, this.endCell.c);

    let clipboardRows = [];
    const allLeads = this.store.allLeads();

    for (let r = minR; r <= maxR; r++) {
      let rowData = [];
      const lead = allLeads[r];
      if (!lead) continue;

      for (let c = minC; c <= maxC; c++) {
        switch (c) {
          case 0: rowData.push(lead.name); break;
          case 1: rowData.push(lead.phone); break;
          case 2: rowData.push(lead.state); break;
          case 3: rowData.push(this.getStatusLabel(lead.status)); break;
          case 4: rowData.push(lead.notes || ''); break;
          case 5: rowData.push(lead.createdBy?.name || ''); break;
          case 6: rowData.push(lead.reminderAt ? this.datePipe.transform(lead.reminderAt, 'short') : ''); break;
        }
      }
      clipboardRows.push(rowData.join('\t'));
    }

    const clipboardString = clipboardRows.join('\n');
    navigator.clipboard.writeText(clipboardString).then(() => {
      this.messageService.add({ 
        severity: 'info', 
        summary: this.i18n.t('ui.success'), 
        detail: this.i18n.t('leads.copy.success').replace('{count}', ((maxR - minR + 1) * (maxC - minC + 1)).toString()) 
      });
    });
  }
}
