import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { OrdersStore } from '../../core/stores/orders.store';
import { OrderStatus, OrderType } from '../../core/services/sales.service';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectModule } from 'primeng/select';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { effect } from '@angular/core';
import { AuthStore } from '../../core/stores/auth.store';
import { TooltipModule } from 'primeng/tooltip';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, FormsModule, TagModule, SelectButtonModule, SelectModule, IconFieldModule, InputIconModule, ToastModule, TranslatePipe, TooltipModule, DialogModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <div class="card font-tajawal shadow-2xl overflow-hidden border-0 rounded-[2.5rem] dark:bg-surface-900 transition-all hover:shadow-2xl">
      <!-- Header Section -->
      <div class="p-8 sm:p-10 bg-gradient-to-br from-emerald-600 to-teal-500 relative overflow-hidden">
        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div class="flex items-center gap-6">
            <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
              <i class="pi pi-shopping-bag text-3xl font-bold"></i>
            </div>
            <div>
              <h1 class="text-3xl font-black text-white m-0 tracking-tight">
                {{ 'menu.sales' | t }}
              </h1>
              <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest mt-1">{{ 'orders.list.description' | t }}</p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <p-iconField iconPosition="left" class="flex-grow md:flex-initial">
              <p-inputIcon class="pi pi-search text-white/70" />
              <input pInputText type="text" [(ngModel)]="searchTerm" (input)="onSearchChange()" 
                     [placeholder]="'ui.search' | t" 
                     autocomplete="off" dir="ltr"
                     class="w-full md:w-80 h-12 rounded-2xl border-white/30 bg-white/10 backdrop-blur-md text-white placeholder:text-white/60 focus:ring-white/30 px-6 font-medium text-left" />
            </p-iconField>
            <p-button [label]="'ui.add' | t" icon="pi pi-plus" routerLink="/orders/new" 
                      styleClass="rounded-2xl px-8 h-12 font-black bg-white text-emerald-600 border-none shadow-xl transform hover:scale-105 transition-all text-md uppercase tracking-widest"></p-button>
          </div>
        </div>
      </div>

      <!-- Filters & Table Section -->
      <div class="p-8">
        <div class="flex flex-wrap gap-4 mb-8 p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-3xl border border-emerald-100/50 dark:border-emerald-800/20 backdrop-blur-sm items-center">
          <div class="flex items-center gap-2 mr-2">
            <div class="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
               <i class="pi pi-filter-fill"></i>
            </div>
            <span class="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest">{{ 'orders.list.filter.advanced' | t }}</span>
          </div>
          <p-select appendTo="body" [options]="statusOptions" [(ngModel)]="filterStatus" (onChange)="onSearchManual()" 
                   [placeholder]="'orders.list.filter.status' | t" class="w-64" styleClass="rounded-xl border-emerald-100 dark:border-emerald-800/30" [showClear]="true"></p-select>
          <p-select appendTo="body" [options]="typeOptions" [(ngModel)]="filterType" (onChange)="onSearchManual()" 
                   [placeholder]="'orders.list.filter.type' | t" class="w-64" styleClass="rounded-xl border-emerald-100 dark:border-emerald-800/30" [showClear]="true"></p-select>
        </div>

      <p-table [value]="store.allOrders()" [loading]="store.loading()" 
               [totalRecords]="store.total()" [lazy]="true" (onLazyLoad)="loadData($event)"
               [first]="first" [rows]="store.pageSize()" [paginator]="true" responsiveLayout="scroll"
               styleClass="p-datatable-sm shadow-sm rounded-lg overflow-hidden">
        <ng-template pTemplate="header">
          <tr>
            <th style="width: 8%">{{ 'orders.list.table.order_no' | t }}</th>
            <th style="width: 25%">{{ 'orders.list.table.customer' | t }}</th>
            <th style="width: 8%">{{ 'orders.list.table.type' | t }}</th>
            <th style="width: 10%">{{ 'orders.list.table.amount' | t }}</th>
            <th style="width: 10%">{{ 'orders.list.table.payment_method' | t }}</th>
            <th style="width: 10%">{{ 'orders.list.table.devices' | t }}</th>
            <th style="width: 10%">{{ 'orders.list.table.status' | t }}</th>
            <th style="width: 10%">{{ 'orders.list.table.date' | t }}</th>
            <th style="width: 9%">{{ 'ui.actions' | t }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-order let-i="rowIndex">
          <tr>
            <td class="font-mono text-xs" [pTooltip]="order.id" tooltipPosition="top">#{{ first + i + 1 }}</td>
            <td>
                <div class="font-bold cursor-pointer hover:text-primary" [routerLink]="['/customers', order.customer?.id]">
                    {{ order.customer?.name }}
                </div>
                <div class="text-xs text-gray-500"><span dir="ltr">{{ order.customer?.phone }}</span></div>
            </td>
            <td>
                <p-tag [value]="('dashboard.types.' + order.type) | t" [severity]="getTypeSeverity(order.type)"></p-tag>
            </td>
            <td class="font-bold text-green-600 font-mono">{{ order.amount | currency }}</td>
            <td>
                <span class="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{{ getPaymentMethodLabel(order.paymentMethod) }}</span>
            </td>
            <td>
                <span class="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-bold">
                    {{ order.deviceCount }} أجهزة
                </span>
            </td>
            <td>
                <p-tag [value]="('orders.status.' + order.status) | t" [severity]="getStatusSeverity(order.status)"></p-tag>
            </td>
            <td>{{ order.createdAt | date:'shortDate' }}</td>
            <td>
              <div class="flex gap-2">
                <p-button type="button" icon="pi pi-eye" severity="info" [routerLink]="['/orders', order.id]" size="small"></p-button>
                <p-button type="button" icon="pi pi-pencil" severity="secondary" [routerLink]="['/orders', order.id, 'edit']" size="small"></p-button>
                @if (isSuperAdmin()) {
                  <p-button type="button" icon="pi pi-trash" severity="danger" (click)="$event.stopPropagation(); onDeleteOrder(order)" size="small"></p-button>
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr>
            <td colspan="9" class="text-center p-4">لا توجد طلبات مطابقة للفلترة</td>
          </tr>
        </ng-template>
      </p-table>
      </div>
    </div>
    <p-confirmdialog></p-confirmdialog>
  `,
  styles: [`
    .font-tajawal { font-family: 'Tajawal', sans-serif; }
  `]
})
export class OrdersListComponent implements OnInit {
  readonly store = inject(OrdersStore);
  private authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(I18nService);
  isSuperAdmin = computed(() => this.authStore.user()?.role === 'super-admin');
  searchTerm = '';
  filterStatus: OrderStatus | undefined = undefined;
  filterType: OrderType | undefined = undefined;
  first = 0;
  private searchSubject = new Subject<string>();

  statusOptions = [
    { label: this.i18n.t('orders.status.pending'), value: 'pending' },
    { label: this.i18n.t('orders.status.completed'), value: 'completed' },
    { label: this.i18n.t('orders.status.cancelled'), value: 'cancelled' }
  ];

  typeOptions = [
    { label: this.i18n.t('dashboard.types.new'), value: 'new' },
    { label: this.i18n.t('dashboard.types.renewal'), value: 'renewal' },
    { label: this.i18n.t('dashboard.types.referral'), value: 'referral' }
  ];

  constructor() {
    effect(() => {
      const error = this.store.error();
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ في المبيعات',
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
      this.store.loadOrders({
        page: 1,
        limit: this.store.pageSize(),
        search: term,
        status: this.filterStatus,
        type: this.filterType
      });
    });
  }

  loadData(event: any) {
    this.first = event.first;
    const page = (event.first / event.rows) + 1;
    this.store.loadOrders({
      page,
      limit: event.rows,
      search: this.searchTerm,
      status: this.filterStatus,
      type: this.filterType
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  onSearchManual() {
    this.first = 0;
    this.store.loadOrders({
      page: 1,
      limit: this.store.pageSize(),
      search: this.searchTerm,
      status: this.filterStatus,
      type: this.filterType
    });
  }

  getTypeSeverity(type: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (type) {
      case 'new': return 'success';
      case 'renewal': return 'info';
      case 'referral': return 'warn';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warn';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  }

  getPaymentMethodLabel(method: string): string {
    if (!method) return '';
    const normalizedMethod = method.trim();
    const map: { [key: string]: string } = {
      'credit card': 'order_form.pm_credit',
      'zelle': 'order_form.pm_zelle',
      'cash app': 'order_form.pm_cashapp',
      'venmo': 'order_form.pm_venmo',
      'paypal': 'order_form.pm_paypal',
      'apple pay': 'order_form.pm_apple',
      'google pay': 'order_form.pm_google',
      'ach transfer': 'order_form.pm_ach',
      'cash': 'order_form.pm_cash',
      'check': 'order_form.pm_check',
      'other': 'order_form.pm_other'
    };
    const key = map[normalizedMethod.toLowerCase()] || 'order_form.pm_other';
    return this.i18n.t(key);
  }

  onDeleteOrder(order: any) {
    this.confirmationService.confirm({
      message: this.i18n.t('orders.list.delete.confirm_msg'),
      header: this.i18n.t('orders.list.delete.confirm_title'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('ui.yes'),
      rejectLabel: this.i18n.t('ui.no'),
      accept: () => {
        this.store.deleteOrder(order.id);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.t('ui.success'),
          detail: this.i18n.t('orders.list.delete.success')
        });
      }
    });
  }
}
