import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { CustomersStore } from '../../core/stores/customers.store';
import { SalesService } from '../../core/services/sales.service';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { effect, signal } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthStore } from '../../core/stores/auth.store';

import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { COUNTRIES } from '../../core/constants/countries.constants';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, RouterModule, TableModule, ButtonModule, InputTextModule, FormsModule, TagModule, IconFieldModule, InputIconModule, ToastModule, TranslatePipe, TooltipModule, DialogModule, TextareaModule, ConfirmDialogModule, SelectModule],
  providers: [MessageService, ConfirmationService],
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
                     autocomplete="off" dir="ltr"
                     class="w-full md:w-96 rounded-2xl border-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-white/50 focus:ring-white/20 text-left" />
            </p-iconField>
            @if (!isAgent()) {
              <p-button [label]="'تحديث الإحداثيات' | t" icon="pi pi-map" (onClick)="onGeocodeAll()" 
                      [loading]="isGeocodingAll"
                      styleClass="rounded-2xl px-6 py-3 font-black bg-teal-600 text-white border-none shadow-xl transform hover:scale-105 transition-all text-md"></p-button>
              <p-button [label]="'customers.list.add_button' | t" icon="pi pi-plus" routerLink="/orders/new" 
                      styleClass="rounded-2xl px-8 py-3 font-black bg-white text-emerald-600 border-none shadow-xl transform hover:scale-105 transition-all text-lg"></p-button>
            }
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
              <td><span dir="ltr">{{ customer.phone }}</span></td>
              <td>{{ customer.email || '---' }}</td>
              <td>{{ customer.state || '---' }}</td>
              <td>{{ customer.createdAt | date:'shortDate' }}</td>
              <td>
                <div class="flex gap-2">
                  <p-button icon="pi pi-eye" severity="info" [routerLink]="['/customers', customer.id]" [pTooltip]="'customers.table.view_details' | t"></p-button>
                  @if (!isAgent()) {
                    <p-button icon="pi pi-pencil" severity="warn" (onClick)="editCustomer(customer)" [pTooltip]="'customers.table.edit' | t"></p-button>
                    <p-button icon="pi pi-plus" severity="success" [routerLink]="['/orders/new']" [queryParams]="{customerId: customer.id}" [pTooltip]="'customers.table.new_order' | t"></p-button>
                  }
                  @if (isSuperAdmin()) {
                    <p-button type="button" icon="pi pi-trash" severity="danger" (click)="$event.stopPropagation(); onDeleteCustomer(customer)" [pTooltip]="'ui.delete' | t"></p-button>
                  }
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
    <p-confirmdialog></p-confirmdialog>
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
          <input pInputText type="text" [(ngModel)]="editingCustomer.phone" dir="ltr" style="text-align: right;" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.country' | t }}</label>
            <p-select [options]="countries" [(ngModel)]="editingCustomer.country" 
                     [filter]="true" filterBy="label" optionLabel="label" optionValue="value"
                     [placeholder]="'Select Country'" appendTo="body"
                     styleClass="w-full h-10 rounded-xl border-surface-300 dark:border-surface-700"></p-select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.state' | t }}</label>
            <input pInputText [(ngModel)]="editingCustomer.state" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.address' | t }}</label>
            <input pInputText [(ngModel)]="editingCustomer.address" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.latitude' | t }}</label>
            <input pInputText type="number" [(ngModel)]="editingCustomer.latitude" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-bold text-sm">{{ 'customers.dialog.longitude' | t }}</label>
            <input pInputText type="number" [(ngModel)]="editingCustomer.longitude" />
          </div>
        </div>

        <div class="col-span-full">
          <p-button [label]="'order_form.auto_location_button' | t" icon="pi pi-map-marker" 
                   (onClick)="fetchGeocoding()" [loading]="isGeocoding" 
                   styleClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 rounded-xl font-bold"></p-button>
          @if (editingCustomer.latitude) {
            <div class="text-[10px] font-black mt-2 text-emerald-600/60 uppercase tracking-widest ml-2">
              <i class="pi pi-check-circle mr-1"></i> {{ 'order_form.coords_received' | t }}: {{ editingCustomer.latitude }}, {{ editingCustomer.longitude }}
            </div>
          }
        </div>
      </div>
      <ng-template pTemplate="footer">
        <p-button [label]="'ui.cancel' | t" icon="pi pi-times" [outlined]="true" (onClick)="displayEditDialog = false" severity="secondary"></p-button>
        <p-button [label]="'ui.save' | t" icon="pi pi-check" (onClick)="saveCustomer()" severity="success"></p-button>
      </ng-template>
    </p-dialog>

    <!-- Password Confirmation Dialog -->
    <!-- Removed this dialog -->

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
  private authStore = inject(AuthStore);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private i18n = inject(I18nService);
  isAgent = computed(() => this.authStore.user()?.role === 'agent');
  isSuperAdmin = computed(() => this.authStore.user()?.role === 'super-admin');
  searchTerm = '';
  first = 0;
  private searchSubject = new Subject<string>();

  displayEditDialog = false;
  editingCustomer: any = {};
  isGeocoding = false;
  isGeocodingAll = false;
  countries = COUNTRIES;
  private salesService = inject(SalesService);

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
    this.store.ensureLoaded({
      page,
      limit: event.rows,
      search: this.searchTerm
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.searchTerm);
  }

  editCustomer(customer: any) {
    if (this.isAgent()) return;
    this.editingCustomer = { ...customer };
    this.displayEditDialog = true;
  }

  fetchGeocoding() {
    const addr = this.editingCustomer.address;
    const state = this.editingCustomer.state;
    const country = this.editingCustomer.country;
    if (!addr) {
      this.messageService.add({ severity: 'warn', summary: this.i18n.t('ui.warning'), detail: this.i18n.t('order_form.geocoding_warning') });
      return;
    }
    this.isGeocoding = true;
    this.salesService.geocode(addr, state, country).subscribe({
      next: (coords) => {
        if (coords) {
          this.editingCustomer.latitude = coords.latitude;
          this.editingCustomer.longitude = coords.longitude;
          this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('order_form.geocoding_success') });
        } else {
          this.messageService.add({ severity: 'error', summary: this.i18n.t('ui.error'), detail: this.i18n.t('order_form.geocoding_error') });
        }
        this.isGeocoding = false;
      },
      error: () => this.isGeocoding = false
    });
  }

  onGeocodeAll() {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من رغبتك في جلب الإحداثيات لجميع العملاء الذين ليس لديهم إحداثيات؟ قد تستغرق هذه العملية بعض الوقت.',
      header: 'تحديث إحداثيات العملاء',
      icon: 'pi pi-map-marker',
      acceptLabel: this.i18n.t('ui.yes'),
      rejectLabel: this.i18n.t('ui.no'),
      accept: () => {
        this.isGeocodingAll = true;
        this.salesService.geocodeAllCustomers().subscribe({
          next: (res) => {
            this.messageService.add({ 
              severity: 'success', 
              summary: 'تمت العملية', 
              detail: `تم تحديث إحداثيات ${res.geocoded} عميل من أصل ${res.total}` 
            });
            this.isGeocodingAll = false;
            this.store.loadCustomers({ page: 1, limit: this.store.pageSize(), search: this.searchTerm });
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل جلب الإحداثيات' });
            this.isGeocodingAll = false;
          }
        });
      }
    });
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
        state: this.editingCustomer.state,
        country: this.editingCustomer.country,
        latitude: this.editingCustomer.latitude,
        longitude: this.editingCustomer.longitude
      }
    });
    
    this.displayEditDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: this.i18n.t('ui.success'),
      detail: this.i18n.t('errors.update_customer_success') || 'تم تحديث بيانات العميل بنجاح',
      life: 3000
    });
  }

  onDeleteCustomer(customer: any) {
    this.confirmationService.confirm({
      message: this.i18n.t('customers.list.delete.confirm_msg'),
      header: this.i18n.t('customers.list.delete.confirm_title'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('ui.yes'),
      rejectLabel: this.i18n.t('ui.no'),
      accept: () => {
        this.store.deleteCustomer(customer.id);
        this.messageService.add({ 
          severity: 'success', 
          summary: this.i18n.t('ui.success'), 
          detail: this.i18n.t('customers.list.delete.success') 
        });
      }
    });
  }
}
