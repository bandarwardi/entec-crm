import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit, ViewChild, effect, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { UserService, User } from '../../core/services/user.service';
import { SalesService, Order } from '../../core/services/sales.service';
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
import { WhatsappStore } from '../../core/stores/whatsapp.store';
import { WhatsappService } from '../../core/services/whatsapp.service';

import { PLATFORMS } from '../../core/constants/platforms.constants';
import { SCREENS } from '../../core/constants/screens.constants';
import { InputNumberModule } from 'primeng/inputnumber';

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
    TranslatePipe,
    InputNumberModule
  ],
  template: `
    <div class="card p-0 overflow-visible shadow-xl border-0 rounded-[2rem] dark:bg-surface-900 transition-all hover:shadow-2xl">
      <!-- Gradient Header -->
      <div class="bg-gradient-to-br from-emerald-600 to-teal-500 p-8 rounded-t-[2rem]">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div class="flex items-center gap-4">
            <!-- <div class="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner">
              <i class="pi pi-phone text-2xl font-bold"></i>
            </div> -->
            <div>
              <h3 class="text-3xl font-black m-0 text-white tracking-tight">{{ 'leads.title' | t }}</h3>
              <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest mt-1">{{ 'leads.subtitle' | t }}</p>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-3 w-full md:w-auto">
            <p-iconField iconPosition="left" class="flex-grow md:flex-initial">
              <p-inputIcon class="pi pi-search text-white/70" />
              <input pInputText type="text" (input)="onSearch($event)" 
                     [placeholder]="'leads.list.search_placeholder' | t" 
                     autocomplete="off" dir="ltr"
                     class="w-full md:w-96 rounded-2xl header-search-input" />
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
          
          @if (isSuperAdmin() || isAdmin()) {
            <p-select [options]="filterAgentOptions()" [(ngModel)]="selectedCreatedBy" (onChange)="applyFilters()" [filter]="true" [placeholder]="'leads.filter.all_agents' | t" class="w-full md:w-48" styleClass="rounded-xl bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700" appendTo="body"></p-select>
          }
          <p-select [options]="filterStatusOptions()" [(ngModel)]="selectedStatus" (onChange)="applyFilters()" [placeholder]="'leads.filter.all_statuses' | t" class="w-full md:w-48" styleClass="rounded-xl bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700" appendTo="body"></p-select>
          <p-select [options]="reminderOptions()" [(ngModel)]="selectedReminder" (onChange)="applyFilters()" [placeholder]="'leads.filter.all_reminders' | t" class="w-full md:w-48" styleClass="rounded-xl bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700" appendTo="body"></p-select>
          <p-select [options]="filterStateOptions()" [(ngModel)]="selectedState" (onChange)="applyFilters()" [filter]="true" [filterBy]="stateFilterBy()" (onFilter)="handleStateFilter($event)" [placeholder]="'leads.filter.all_states' | t" class="w-full md:w-48" styleClass="rounded-xl bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700" appendTo="body"></p-select>
          <p-button [label]="'leads.filter.clear' | t" icon="pi pi-filter-slash" [text]="true" (onClick)="clearFilters()" severity="secondary" styleClass="text-emerald-600 dark:text-emerald-400 font-bold ml-auto"></p-button>
        </div>

        <!-- Add Button Bar -->
        <div class="flex justify-between items-center mb-4">
          <p-button [label]="'ui.add' | t" icon="pi pi-plus" (onClick)="displayAddLead = true" severity="success" styleClass="rounded-2xl px-8 font-black shadow-lg shadow-emerald-500/20"></p-button>
          <p-button [label]="'leads.check_subscription' | t" icon="pi pi-search-plus" (onClick)="displayCheckSub = true" styleClass="rounded-2xl bg-amber-500 border-none text-white hover:bg-amber-600 px-6 font-bold"></p-button>
        </div>

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
        [paginatorDropdownAppendTo]="'body'"
        dataKey="id"
        [tableStyle]="{ 'min-width': '70rem' }"
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
          <tr [attr.data-index]="getGlobalIndex(ri)">
            <td (mousedown)="onMouseDown($event, ri, 0)" 
                (mouseenter)="onMouseEnter(ri, 0)" 
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
            <td (mousedown)="onMouseDown($event, ri, 1)" 
                (mouseenter)="onMouseEnter(ri, 1)" 
                [class.selected-cell]="isCellSelected(ri, 1)"
                [pEditableColumn]="lead.phone" pEditableColumnField="phone" [pEditableColumnDisabled]="editingLeadId !== null">
              <p-cellEditor>
                <ng-template pTemplate="input">
                  <input pInputText type="text" [(ngModel)]="lead.phone" (blur)="onEditLead(lead)" dir="ltr" class="w-full" style="text-align: right;" />
                </ng-template>
                <ng-template pTemplate="output">
                  <span dir="ltr">{{ lead.phone }}</span>
                </ng-template>
              </p-cellEditor>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 2)" 
                (mouseenter)="onMouseEnter(ri, 2)" 
                [class.selected-cell]="isCellSelected(ri, 2)"
                [pEditableColumn]="lead.state" pEditableColumnField="state" [pEditableColumnDisabled]="editingLeadId !== null">
              <p-cellEditor>
                <ng-template pTemplate="input">
                  <p-select [options]="states" [(ngModel)]="lead.state" (onChange)="onEditLead(lead)" [filter]="true" [filterBy]="stateFilterBy()" (onFilter)="handleStateFilter($event)" [fluid]="true" appendTo="body"></p-select>
                </ng-template>
                <ng-template pTemplate="output">
                  {{ lead.state }}
                </ng-template>
              </p-cellEditor>
            </td>
            <td (mousedown)="onMouseDown($event, ri, 3)" 
                (mouseenter)="onMouseEnter(ri, 3)" 
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
            <td (mousedown)="onMouseDown($event, ri, 4)" 
                (mouseenter)="onMouseEnter(ri, 4)" 
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
            <td (mousedown)="onMouseDown($event, ri, 5)" 
                (mouseenter)="onMouseEnter(ri, 5)" 
                [class.selected-cell]="isCellSelected(ri, 5)">{{ lead.createdBy?.name }}</td>
            <td (mousedown)="onMouseDown($event, ri, 6)" 
                (mouseenter)="onMouseEnter(ri, 6)" 
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
              <div class="flex gap-2">
                <p-button type="button" icon="pi pi-whatsapp" [rounded]="true" [outlined]="true" severity="success" (click)="$event.stopPropagation(); openWhatsapp(lead)"></p-button>
                <p-button type="button" icon="pi pi-pencil" [rounded]="true" [outlined]="true" severity="primary" (click)="$event.stopPropagation(); openEditLeadDialog(lead)"></p-button>
                @if (isSuperAdmin() || isAdmin() || isAgent()) {
                  <p-button type="button" icon="pi pi-trash" [rounded]="true" [outlined]="true" severity="danger" (click)="$event.stopPropagation(); onDeleteLead(lead)"></p-button>
                }
              </div>
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

    <!-- Full Edit Dialog -->
    <p-dialog [(visible)]="displayEditLead" [header]="'ui.edit' | t" [modal]="true" [style]="{ width: '600px' }" [draggable]="false" [resizable]="false">
      <form [formGroup]="editForm" (ngSubmit)="saveEditLead()" class="flex flex-col gap-4 mt-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.name' | t }}</label>
            <input pInputText formControlName="name" />
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.phone' | t }}</label>
            <input pInputText formControlName="phone" dir="ltr" style="text-align: right;" />
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.state' | t }}</label>
            <p-select [options]="states" formControlName="state" optionLabel="label" optionValue="value" [filter]="true" [fluid]="true" appendTo="body"></p-select>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.status' | t }}</label>
            <p-select [options]="statuses()" formControlName="status" optionLabel="label" optionValue="value" [fluid]="true" appendTo="body"></p-select>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.current_platform' | t }}</label>
            <p-select [options]="platforms()" formControlName="currentPlatform" optionLabel="label" optionValue="value" [filter]="true" [fluid]="true" appendTo="body"></p-select>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.current_device' | t }}</label>
            <p-select [options]="screens()" formControlName="currentDevice" optionLabel="label" optionValue="value" [filter]="true" [fluid]="true" appendTo="body"></p-select>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.subscription_amount' | t }}</label>
            <p-inputNumber formControlName="subscriptionAmount" mode="currency" currency="USD" [fluid]="true"></p-inputNumber>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.subscription_duration' | t }}</label>
            <p-inputNumber formControlName="subscriptionDuration" [showButtons]="true" [min]="0" [fluid]="true"></p-inputNumber>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.reminder_at' | t }}</label>
            <p-datepicker formControlName="reminderAt" [showTime]="true" [showIcon]="true" [fluid]="true" appendTo="body"></p-datepicker>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.reminder_note' | t }}</label>
            <input pInputText formControlName="reminderNote" />
          </div>
        </div>
        <div class="flex flex-col">
          <label class="font-bold mb-1">{{ 'leads.notes' | t }}</label>
          <textarea pTextarea formControlName="notes" [rows]="3" [autoResize]="true"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <p-button [label]="'ui.cancel' | t" icon="pi pi-times" [text]="true" (onClick)="displayEditLead = false" type="button"></p-button>
          <p-button [label]="'ui.save' | t" icon="pi pi-check" type="submit" [loading]="store.updating()"></p-button>
        </div>
      </form>
    </p-dialog>

    <!-- Add Lead Dialog -->
    <p-dialog [(visible)]="displayAddLead" [header]="'ui.add' | t" [modal]="true" [style]="{ width: '600px' }" [draggable]="false" [resizable]="false">
      <form [formGroup]="leadForm" (ngSubmit)="onAddLead()" class="flex flex-col gap-4 mt-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.name' | t }}</label>
            <input pInputText formControlName="name" [placeholder]="'leads.table.name' | t" />
            @if (leadForm.get('name')?.invalid && leadForm.get('name')?.touched) {
              <small class="text-red-500 font-bold mt-1 text-[10px]">{{ 'leads.validation.name_required' | t }}</small>
            }
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.phone' | t }}</label>
            <input pInputText formControlName="phone" dir="ltr" [placeholder]="'leads.table.phone' | t" style="text-align: right;" />
            @if (leadForm.get('phone')?.invalid && leadForm.get('phone')?.touched) {
              <small class="text-red-500 font-bold mt-1 text-[10px]">{{ 'leads.validation.phone_required' | t }}</small>
            }
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.table.state' | t }}</label>
            <p-select [options]="states" formControlName="state" optionLabel="label" optionValue="value" [filter]="true" [filterBy]="stateFilterBy()" (onFilter)="handleStateFilter($event)" [filterPlaceholder]="'ui.search' | t" [placeholder]="'leads.table.state' | t" [fluid]="true" appendTo="body"></p-select>
            @if (leadForm.get('state')?.invalid && leadForm.get('state')?.touched) {
              <small class="text-red-500 font-bold mt-1 text-[10px]">{{ 'leads.validation.state_required' | t }}</small>
            }
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.current_platform' | t }}</label>
            <p-select [options]="platforms()" formControlName="currentPlatform" optionLabel="label" optionValue="value" [filter]="true" [fluid]="true" appendTo="body"></p-select>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.current_device' | t }}</label>
            <p-select [options]="screens()" formControlName="currentDevice" optionLabel="label" optionValue="value" [filter]="true" [fluid]="true" appendTo="body"></p-select>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.subscription_amount' | t }}</label>
            <p-inputNumber formControlName="subscriptionAmount" mode="currency" currency="USD" [fluid]="true"></p-inputNumber>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.subscription_duration' | t }}</label>
            <p-inputNumber formControlName="subscriptionDuration" [showButtons]="true" [min]="0" [fluid]="true"></p-inputNumber>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.reminder_at' | t }}</label>
            <p-datepicker formControlName="reminderAt" [showTime]="true" [showIcon]="true" [fluid]="true" appendTo="body"></p-datepicker>
          </div>
          <div class="flex flex-col">
            <label class="font-bold mb-1">{{ 'leads.form.reminder_note' | t }}</label>
            <input pInputText formControlName="reminderNote" [placeholder]="'leads.reminder.note_placeholder' | t" />
          </div>
        </div>
        <div class="flex flex-col">
          <label class="font-bold mb-1">{{ 'leads.notes' | t }}</label>
          <textarea pTextarea formControlName="notes" [rows]="3" [autoResize]="true" [placeholder]="'leads.notes' | t"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <p-button [label]="'ui.cancel' | t" icon="pi pi-times" [text]="true" (onClick)="displayAddLead = false" type="button"></p-button>
          <p-button [label]="'ui.add' | t" icon="pi pi-check" type="submit" [loading]="store.adding()"></p-button>
        </div>
      </form>
    </p-dialog>

    <!-- Subscription Check Dialog -->
    <p-dialog [(visible)]="displayCheckSub" [header]="'leads.check_subscription' | t" [modal]="true" [style]="{ width: '500px' }" [draggable]="false" [resizable]="false">
      <div class="flex flex-col gap-4 mt-2">
        <div class="flex gap-2">
          <p-iconField iconPosition="left" class="flex-1">
            <p-inputIcon class="pi pi-phone" />
            <input pInputText type="text" [(ngModel)]="checkPhone" [placeholder]="'leads.check_sub_placeholder' | t" dir="ltr" class="w-full" (keyup.enter)="onCheckSubscription()" />
          </p-iconField>
          <p-button [label]="'ui.search' | t" icon="pi pi-search" (onClick)="onCheckSubscription()" [loading]="checkingSub"></p-button>
        </div>

        @if (subResults.length > 0) {
          <div class="mt-4 flex flex-col gap-4">
            <h4 class="font-bold border-b pb-2 text-emerald-600 flex items-center gap-2">
              <i class="pi pi-check-circle"></i>
              {{ 'orders.list.title' | t }} ({{ subResults.length }})
            </h4>
            @for (order of subResults; track order.id) {
              <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm transition-all hover:shadow-md">
                <div class="flex justify-between items-start mb-3">
                  <span class="font-black text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full uppercase tracking-tighter">#{{ order.id.slice(-6).toUpperCase() }}</span>
                  <p-tag [value]="getStatusLabel(order.status)" [severity]="getStatusSeverity(order.status)"></p-tag>
                </div>
                <div class="grid grid-cols-2 gap-y-2 text-sm">
                  <div class="text-surface-500 font-bold text-xs uppercase">{{ 'order_form.customer_data' | t }}:</div>
                  <div class="font-black text-right">{{ order.customer.name }}</div>
                  
                  <div class="text-surface-500 font-bold text-xs uppercase">{{ 'order_form.server_name' | t }}:</div>
                  <div class="text-right">{{ order.serverName || '---' }}</div>

                  <div class="text-surface-500 font-bold text-xs uppercase">{{ 'order_form.app_expiry' | t }}:</div>
                  <div class="text-right text-emerald-600 font-black" [class.text-red-500]="isExpired(order.appExpiryDate!)">
                    {{ order.appExpiryDate | date:'mediumDate' }}
                  </div>
                </div>
              </div>
            }
          </div>
        } @else if (hasChecked && !checkingSub) {
          <div class="mt-8 text-center p-8 bg-surface-50 dark:bg-surface-800 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-700">
            <i class="pi pi-info-circle text-4xl text-surface-400 mb-4 block"></i>
            <p class="font-bold text-surface-500 m-0">{{ 'leads.no_subscriptions_found' | t }}</p>
          </div>
        }
      </div>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep {
      /* HEADER SEARCH BOX (EMERALD AREA) */
      .header-search-input {
        background-color: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        color: #ffffff !important;
        box-shadow: none !important;
      }
      .header-search-input::placeholder {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      /* FORM FIELDS (WHITE AREA) - LIGHT MODE */
      .p-select:not(.header-search-input), 
      .p-inputtext:not(.header-search-input), 
      .p-datepicker-input:not(.header-search-input) {
        background-color: #f1f5f9 !important; /* light gray for contrast */
        border: 1px solid #cbd5e1 !important;
        color: #020617 !important; /* Pure black text */
      }

      /* Force text color for selected values and labels */
      .p-select:not(.header-search-input) .p-select-label,
      .p-select:not(.header-search-input) .p-select-placeholder,
      .p-inputtext:not(.header-search-input) {
        color: #020617 !important;
        font-weight: 700 !important;
      }

      /* Make Placeholders visible in light mode */
      .p-select:not(.header-search-input) .p-select-placeholder,
      .p-inputtext:not(.header-search-input)::placeholder {
        color: #475569 !important; /* Slate 600 */
        font-weight: 600 !important;
      }

      /* DARK MODE OVERRIDES */
      .app-dark .p-select:not(.header-search-input), 
      .app-dark .p-inputtext:not(.header-search-input), 
      .app-dark .p-datepicker-input:not(.header-search-input) {
        background-color: #0f172a !important;
        border-color: #334155 !important;
        color: #f8fafc !important;
      }
      .app-dark .p-select:not(.header-search-input) .p-select-label,
      .app-dark .p-select:not(.header-search-input) .p-select-placeholder,
      .app-dark .p-inputtext:not(.header-search-input) {
        color: #f8fafc !important;
      }
    }
    .cell-selection-table .selected-cell {
      background-color: rgba(59, 130, 246, 0.2) !important;
      outline: 1px solid #3b82f6 !important;
      outline-offset: -1px;
    }
    .cell-selection-table td {
      user-select: none;
    }
  `],
  providers: [MessageService, ConfirmationService, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(I18nService);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);
  private leadService = inject(UserLeadService);
  private salesService = inject(SalesService);
  private authStore = inject(AuthStore);
  private userService = inject(UserService);
  private router = inject(Router);
  readonly store = inject(LeadsStore);
  readonly whatsappStore = inject(WhatsappStore);
  private whatsappService = inject(WhatsappService);

  displayCheckSub = false;
  checkPhone = '';
  checkingSub = false;
  hasChecked = false;
  subResults: Order[] = [];

  stateFilterBy = signal('label,value');

  isAgent = computed(() => this.authStore.user()?.role === 'agent');
  isAdmin = computed(() => this.authStore.user()?.role === 'admin');
  isSuperAdmin = computed(() => this.authStore.user()?.role === 'super-admin');

  private searchSubject = new Subject<string>();

  platforms = signal([{ label: this.i18n.t('leads.form.no_subscription'), value: 'none' }, ...PLATFORMS]);
  screens = signal(SCREENS);

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

  agents = signal<User[]>([]);
  filterAgentOptions = computed(() => [
    { label: 'الكل (موظفين)', value: null },
    ...this.agents().map(a => ({ label: a.name, value: a.id }))
  ]);

  selectedStatus: string | null = null;
  selectedState: string | null = null;
  selectedReminder: string | null = null;
  selectedCreatedBy: string | null = null;

  // Selection Logic
  isSelecting = false;
  startCell = { r: -1, c: -1 }; // Global Index
  endCell = { r: -1, c: -1 };   // Global Index
  private scrollInterval: any;

  leadForm = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    state: ['', Validators.required],
    notes: [''],
    currentPlatform: ['none'],
    currentDevice: [null],
    subscriptionAmount: [{ value: null, disabled: true }],
    subscriptionDuration: [{ value: null, disabled: true }],
    reminderAt: [null],
    reminderNote: ['']
  });

  displayReminder = false;
  displayEditLead = false;
  displayAddLead = false;
  selectedLead: any = {};
  editingLeadId: number | null = null;
  
  leadToDelete: Lead | null = null;

  editForm = this.fb.group({
    id: [''],
    name: ['', Validators.required],
    phone: ['', Validators.required],
    state: ['', Validators.required],
    notes: [''],
    currentPlatform: ['none'],
    currentDevice: [null],
    subscriptionAmount: [{ value: null, disabled: true }],
    subscriptionDuration: [{ value: null, disabled: true }],
    reminderAt: [null],
    reminderNote: [''],
    status: ['']
  });
  
  constructor() {
    // Watch currentPlatform for disabling/enabling amount & duration
    this.leadForm.get('currentPlatform')?.valueChanges.subscribe(val => {
      this.handlePlatformChange(val, this.leadForm);
    });

    this.editForm.get('currentPlatform')?.valueChanges.subscribe(val => {
      this.handlePlatformChange(val, this.editForm);
    });

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
        hasReminder: this.selectedReminder || undefined,
        createdBy: this.selectedCreatedBy || undefined
      });
    });

    effect(() => {
      const error = this.store.error();
      const adding = this.store.adding();
      const updating = this.store.updating();
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

    // Separate effect for success handling to avoid infinite loops or missing state transitions
    effect(() => {
      const adding = this.store.adding();
      const updating = this.store.updating();
      const error = this.store.error();
      
      // If was adding and now finished without error
      if (!adding && !error && this.displayAddLead) {
        this.displayAddLead = false;
        this.leadForm.reset({
          currentPlatform: 'none'
        });
        this.messageService.add({ 
          severity: 'success', 
          summary: this.i18n.t('ui.success'), 
          detail: this.i18n.t('leads.save.success') 
        });
      }

      // If was updating and now finished without error
      if (!updating && !error && this.displayEditLead) {
        this.displayEditLead = false;
        this.messageService.add({ 
          severity: 'success', 
          summary: this.i18n.t('ui.success'), 
          detail: this.i18n.t('leads.save.success') 
        });
      }
    });

    // Effect to handle selected lead from notifications
    effect(() => {
      const selectedId = this.store.selectedLeadId();
      if (selectedId) {
        const lead = this.store.allLeads().find(l => l.id === selectedId);
        if (lead) {
          this.openEditLeadDialog(lead);
          this.store.setSelectedLeadId(null); // Clear after opening
        } else if (!this.store.loading()) {
          // If lead not found in current page and not loading, we might need to search for it
          // For now, let's just wait for next load if it's currently loading
        }
      }
    });
  }

  ngOnInit() {
    this.initialLoad();
    this.whatsappStore.startListening();
  }

  ngOnDestroy() {
    this.searchSubject.complete();
  }

  handleStateFilter(event: any) {
    const query = event.filter || '';
    if (query.length === 2) {
      this.stateFilterBy.set('value');
    } else {
      this.stateFilterBy.set('label');
    }
  }

  initialLoad() {
    this.store.loadLeads({ page: 1, limit: this.store.pageSize() });

    if (this.isSuperAdmin() || this.isAdmin()) {
      this.userService.getUsers().subscribe(users => {
        this.agents.set(users.filter(u => u.role === 'agent'));
      });
    }
  }

  applyFilters() {
    this.store.loadLeads({
      page: 1,
      limit: this.store.pageSize(),
      search: this.store.searchTerm(),
      status: this.selectedStatus || undefined,
      state: this.selectedState || undefined,
      hasReminder: this.selectedReminder || undefined,
      createdBy: this.selectedCreatedBy || undefined
    });
  }

  clearFilters() {
    this.selectedStatus = null;
    this.selectedState = null;
    this.selectedReminder = null;
    this.selectedCreatedBy = null;
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
      hasReminder: this.selectedReminder || undefined,
      createdBy: this.selectedCreatedBy || undefined
    });
  }

  onCheckSubscription() {
    if (!this.checkPhone.trim()) return;
    
    this.checkingSub = true;
    this.hasChecked = true;
    this.salesService.getOrders({ search: this.checkPhone.trim(), limit: 50 }).subscribe({
      next: (res) => {
        this.subResults = res.data;
        this.checkingSub = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.checkingSub = false;
        this.cdr.markForCheck();
      }
    });
  }

  isExpired(date: string | null): boolean {
    if (!date) return false;
    return new Date(date) < new Date();
  }

  onSearch(event: any) {
    this.searchSubject.next(event.target.value);
  }

  private handlePlatformChange(val: any, form: any) {
    const amountCtrl = form.get('subscriptionAmount');
    const durationCtrl = form.get('subscriptionDuration');
    if (val === 'none') {
      amountCtrl?.disable();
      durationCtrl?.disable();
      amountCtrl?.setValue(null);
      durationCtrl?.setValue(null);
    } else {
      amountCtrl?.enable();
      durationCtrl?.enable();
    }
  }

  onAddLead() {
    if (this.leadForm.valid) {
      const payload = this.leadForm.getRawValue();
      this.store.createLead(payload as any);
      
      // We'll use an effect to close the modal and show success
      // But for now, let's keep it simple and just reset if successful
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
      icon: 'pi pi-info-circle',
      rejectLabel: this.i18n.t('ui.cancel'),
      acceptLabel: this.i18n.t('ui.delete'),
      rejectButtonProps: {
        label: this.i18n.t('ui.cancel'),
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: this.i18n.t('ui.delete'),
        severity: 'danger',
      },
      accept: () => {
        this.store.deleteLead(lead.id);
      },
    });
  }

  openWhatsapp(lead: Lead) {
    const channel = this.whatsappStore.channels().find(c => c.status === 'connected');
    
    // If no channel is connected, we still let it navigate because the inbox has its own UI for this
    // but the user wants "verification" specifically.
    if (!channel) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'تنبيه', 
        detail: 'لا توجد قنوات واتساب متصلة حالياً للتحقق من الرقم' 
      });
      // Fallback: regular navigation
      const cleanPhone = this.whatsappService.formatPhoneForWhatsapp(lead.phone);
      this.router.navigate(['/whatsapp/inbox'], { queryParams: { phone: cleanPhone, leadId: lead.id } });
      return;
    }

    const cleanPhone = this.whatsappService.formatPhoneForWhatsapp(lead.phone);
    this.messageService.add({ severity: 'info', summary: 'جاري التحقق', detail: 'يتم التحقق من الرقم في واتساب...' });

    this.whatsappService.checkNumber(channel.id, cleanPhone).subscribe({
      next: (result: any) => {
        if (result && result.exists) {
          const finalPhone = result.jid.split('@')[0];
          this.router.navigate(['/whatsapp/inbox'], { 
            queryParams: { 
              phone: finalPhone, 
              leadId: lead.id,
              channelId: channel.id
            } 
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'غير موجود', detail: 'هذا الرقم غير مسجل في واتساب' });
        }
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل التحقق من الرقم' });
        // Fallback: regular navigation if check fails for other reasons (e.g. session error)
        this.router.navigate(['/whatsapp/inbox'], { queryParams: { phone: cleanPhone, leadId: lead.id } });
      }
    });
  }

  openReminderDialog(lead: Lead) {
    this.selectedLead = { ...lead, reminderAt: lead.reminderAt ? new Date(lead.reminderAt) : null };
    this.displayReminder = true;
  }

  openEditLeadDialog(lead: Lead) {
    this.editForm.patchValue({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      state: lead.state,
      notes: lead.notes,
      currentPlatform: lead.currentPlatform || 'none',
      currentDevice: lead.currentDevice as any,
      subscriptionAmount: lead.subscriptionAmount as any,
      subscriptionDuration: lead.subscriptionDuration as any,
      reminderAt: lead.reminderAt ? new Date(lead.reminderAt) as any : null,
      reminderNote: lead.reminderNote,
      status: lead.status
    });
    this.displayEditLead = true;
  }

  saveEditLead() {
    if (this.editForm.valid) {
      const formValue = this.editForm.getRawValue();
      const id = formValue.id!;
      const changes = { ...formValue };
      delete (changes as any).id;
      
      this.store.updateLead({ id, changes: changes as any });
    } else {
      this.editForm.markAllAsTouched();
    }
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
          const headers = data[0].map(h => String(h || '').trim());
          
          // Find column indices by name (flexible)
          const nameIdx = headers.findIndex(h => h.toLowerCase() === 'name');
          const phoneIdx = headers.findIndex(h => h.toLowerCase() === 'phone');
          const stateIdx = headers.findIndex(h => h.toLowerCase() === 'state');
          const notesIdx = headers.findIndex(h => h.toLowerCase() === 'notes');

          if (phoneIdx !== -1) {
            const leadsToImport = data.slice(1).map(row => ({
              name: nameIdx !== -1 ? String(row[nameIdx] || '') : '',
              phone: String(row[phoneIdx] || ''),
              state: stateIdx !== -1 ? String(row[stateIdx] || '') : '',
              notes: notesIdx !== -1 ? String(row[notesIdx] || '') : '',
              status: LeadStatus.NEW
            })).filter(l => l.phone && l.phone.trim() !== ''); // Require at least a phone number

            if (leadsToImport.length > 0) {
              this.confirmationService.confirm({
                message: this.i18n.t('leads.import.confirm_msg').replace('{count}', leadsToImport.length.toString()),
                header: this.i18n.t('leads.import.confirm'),
                accept: () => {
                  this.store.importLeads(leadsToImport);
                  event.target.value = '';
                }
              });
            } else {
              this.messageService.add({ severity: 'warn', summary: this.i18n.t('ui.warning'), detail: 'لا توجد بيانات صالحة للاستيراد (يجب توفر رقم الهاتف على الأقل)' });
              event.target.value = '';
            }
          } else {
            this.messageService.add({ severity: 'error', summary: this.i18n.t('ui.error'), detail: 'يجب أن يحتوي ملف الإكسيل على عمود باسم "Phone"' });
            event.target.value = '';
          }
        }
      };
      reader.readAsBinaryString(file);
    }
  }

  // Selection Logic
  getGlobalIndex(ri: number): number {
    return ((this.store.currentPage() - 1) * this.store.pageSize()) + ri;
  }

  onMouseDown(event: MouseEvent, r: number, c: number) {
    this.isSelecting = true;
    const globalR = this.getGlobalIndex(r);
    this.startCell = { r: globalR, c };
    this.endCell = { r: globalR, c };
  }

  onMouseEnter(r: number, c: number) {
    if (this.isSelecting) {
      this.endCell = { r: this.getGlobalIndex(r), c };
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onGlobalMouseMove(event: MouseEvent) {
    if (!this.isSelecting) return;

    // Auto-scroll logic
    const scrollThreshold = 100;
    const scrollSpeed = 15;
    const viewportHeight = window.innerHeight;

    if (this.scrollInterval) clearInterval(this.scrollInterval);

    if (event.clientY < scrollThreshold) {
      this.scrollInterval = setInterval(() => window.scrollBy(0, -scrollSpeed), 20);
    } else if (event.clientY > viewportHeight - scrollThreshold) {
      this.scrollInterval = setInterval(() => window.scrollBy(0, scrollSpeed), 20);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isSelecting = false;
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  isCellSelected(r: number, c: number): boolean {
    if (this.startCell.r === -1) return false;
    const globalR = this.getGlobalIndex(r);
    const minR = Math.min(this.startCell.r, this.endCell.r);
    const maxR = Math.max(this.startCell.r, this.endCell.r);
    const minC = Math.min(this.startCell.c, this.endCell.c);
    const maxC = Math.max(this.startCell.c, this.endCell.c);

    return globalR >= minR && globalR <= maxR && c >= minC && c <= maxC;
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
    // We can only copy what's loaded in memory, but now indexing is global.
    const allLeads = this.store.allLeads();

    for (let r = minR; r <= maxR; r++) {
      let rowData = [];
      // Find row index in the current loaded leads array
      // Note: This logic assumes the range matches the currently displayed leads.
      // If we want a global selection that works across virtual scroll it's harder,
      // but for lazy landing pages we usually only select visible ones.
      const lead = allLeads.find((_, idx) => this.getGlobalIndex(idx) === r);
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
