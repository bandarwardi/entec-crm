import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CustomersStore } from '../../core/stores/customers.store';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { effect, signal } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, FormsModule, TagModule, IconFieldModule, InputIconModule, ToastModule, TranslatePipe, TooltipModule, DialogModule, TextareaModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="card font-tajawal shadow-md border-t-4 border-t-primary rounded-[2rem] dark:bg-surface-900 overflow-hidden transition-all hover:shadow-lg">
      <!-- Header Section -->
      <div class="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 relative overflow-hidden">
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div>
            <h1 class="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <i class="pi pi-users text-3xl"></i>
              {{ 'customers.list.title' | t }}
            </h1>
            <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest">{{ 'customers.list.subtitle' | t }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <p-iconField iconPosition="left" class="flex-grow md:flex-initial">
              <p-inputIcon class="pi pi-search text-white/70" />
              <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange()" 
                     [placeholder]="'customers.list.search_placeholder' | t" 
                     class="w-full md:w-96 rounded-2xl border-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-white/50 focus:ring-white/20" />
            </p-iconField>
            <p-button [label]="'customers.list.add_button' | t" icon="pi pi-plus" routerLink="/orders/new" 
                      styleClass="rounded-2xl px-8 py-3 font-black bg-white text-emerald-600 border-none shadow-xl transform hover:scale-105 transition-all text-lg"></p-button>
          </div>
        </div>
      </div>

      <!-- Table Body -->
      <div class="p-4">
        <p-table [value]="store.allCustomers()" [loading]="store.loading()" 
                 [totalRecords]="store.total()" [lazy]="true" (onLazyLoad)="loadData($event)"
                 [first]="first" [rows]="store.pageSize()" [paginator]="true" responsiveLayout="scroll"
                 styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>{{ 'customers.table.name' | t }}</th>
              <th>{{ 'customers.table.phone' | t }}</th>
              <th>{{ 'customers.table.email' | t }}</th>
              <th>{{ 'customers.table.state' | t }}</th>
              <th>{{ 'customers.table.reg_date' | t }}</th>
              <th>{{ 'ui.actions' | t }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-customer>
            <tr>
              <td class="font-bold">{{ customer.name }}</td>
              <td>{{ customer.phone }}</td>
              <td>{{ customer.email || '---' }}</td>
              <td>{{ customer.state || '---' }}</td>
              <td>{{ customer.createdAt | date:'shortDate' }}</td>
              <td>
                <div class="flex gap-2">
                  <p-button icon="pi pi-eye" severity="info" [routerLink]="['/customers', customer.id]" [pTooltip]="'customers.table.view_details' | t"></p-button>
                  <p-button icon="pi pi-pencil" severity="warn" (onClick)="editCustomer(customer)" [pTooltip]="'customers.table.edit' | t"></p-button>
                  <p-button icon="pi pi-plus" severity="success" [routerLink]="['/orders/new']" [queryParams]="{customerId: customer.id}" [pTooltip]="'customers.table.new_order' | t"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">{{ 'customers.table.empty' | t }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Edit Customer Dialog -->
    <p-dialog [(visible)]="displayEditDialog" [header]="'customers.dialog.edit_title' | t" [modal]="true" 
              [style]="{width: '500px'}" styleClass="font-tajawal p-fluid">
      <div class="flex flex-col gap-4 mt-4">
        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm">{{ 'customers.dialog.name' | t }}</label>
          <input pInputText [(ngModel)]="editingCustomer.name" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm">{{ 'customers.dialog.email' | t }}</label>
          <input pInputText [(ngModel)]="editingCustomer.email" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-bold text-sm">{{ 'customers.dialog.phone' | t }}</label>
          <input pInputText [(ngModel)]="editingCustomer.phone" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.state' | t }}</label>
            <input pInputText [(ngModel)]="editingCustomer.state" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.address' | t }}</label>
            <input pInputText [(ngModel)]="editingCustomer.address" />
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button [label]="'ui.cancel' | t" icon="pi pi-times" [outlined]="true" (onClick)="displayEditDialog = false" severity="secondary"></p-button>
        <p-button [label]="'ui.save' | t" icon="pi pi-check" (onClick)="saveCustomer()" severity="success"></p-button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .font-tajawal { font-family: 'Tajawal', sans-serif; }
    :host ::ng-deep .p-dialog-header { border-top-right-radius: 1.5rem; border-top-left-radius: 1.5rem; }
    :host ::ng-deep .p-dialog-content { padding-bottom: 2rem; }
    :host ::ng-deep .p-dialog-footer { border-bottom-right-radius: 1.5rem; border-bottom-left-radius: 1.5rem; }
  `]
})
export class CustomersListComponent implements OnInit {
  readonly store = inject(CustomersStore);
  private messageService = inject(MessageService);
  searchTerm = '';
  first = 0;
  private searchSubject = new Subject<string>();

  displayEditDialog = false;
  editingCustomer: any = {};

  constructor() {
    effect(() => {
      const error = this.store.error();
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: error,
          life: 3000
        });
        setTimeout(() => this.store.clearError(), 3100);
      }
    });
  }

  ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.first = 0;
      this.store.loadCustomers({ page: 1, limit: this.store.pageSize(), search: term });
    });
  }

  loadData(event: any) {
    this.first = event.first;
    const page = (event.first / event.rows) + 1;
    this.store.loadCustomers({
      page,
      limit: event.rows,
      search: this.searchTerm
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  editCustomer(customer: any) {
    this.editingCustomer = { ...customer };
    this.displayEditDialog = true;
  }

  saveCustomer() {
    if (!this.editingCustomer.id) return;
    
    this.store.updateCustomer({
      id: this.editingCustomer.id,
      changes: {
        name: this.editingCustomer.name,
        email: this.editingCustomer.email,
        phone: this.editingCustomer.phone,
        address: this.editingCustomer.address,
        state: this.editingCustomer.state
      }
    });
    
    this.displayEditDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'نجاح',
      detail: 'تم تحديث بيانات العميل بنجاح',
      life: 3000
    });
  }
}
