import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { SalesService, Order, OrderStatus } from '../../core/services/sales.service';
import { OrdersStore } from '../../core/stores/orders.store';
import { InvoicePdfService } from '../../core/services/invoice-pdf.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TableModule, TagModule, SelectModule, FormsModule, ToastModule, TranslatePipe, TooltipModule],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    @if (order()) {
      <div class="font-tajawal max-w-6xl mx-auto px-4 py-8">
      
      <!-- Gradient Header Wrapper -->
      <div class="card p-0 overflow-hidden shadow-2xl border-0 rounded-[2.5rem] mb-10 dark:bg-surface-900 transition-all hover:shadow-2xl no-print">
        <div class="bg-gradient-to-br from-emerald-600 to-teal-500 p-8 sm:p-10">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div class="flex items-center gap-6">
              <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
                <i class="pi pi-box text-3xl font-bold"></i>
              </div>
              <div>
                <div class="flex items-center gap-3">
                  <p-button icon="pi pi-arrow-left" routerLink="/orders" [rounded]="true" [text]="true" styleClass="text-white bg-white/10 hover:bg-white/20" size="small"></p-button>
                   <h1 class="text-3xl font-black m-0 text-white tracking-tight">{{ 'orders.detail.title' | t }} <span class="opacity-70" [pTooltip]="order()?.id" tooltipPosition="top">#{{ order()?.id?.slice(0, 5) }}</span></h1>
                </div>
                <div class="flex items-center gap-4 text-xs text-emerald-50/80 font-bold uppercase tracking-widest mt-2">
                    <span>{{ order()?.createdAt | date:'fullDate' }}</span>
                    <span class="w-1 h-1 rounded-full bg-white/40"></span>
                    <div class="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                      <span class="text-white/60">{{ 'orders.detail.status_label' | t }}</span>
                      <p-select [options]="statusOptions()" [(ngModel)]="currentStatus" 
                                (onChange)="onStatusChange($event)" [disabled]="ordersStore.saving()"
                                optionLabel="label" optionValue="value"
                                [fluid]="false"
                                styleClass="p-select-sm border-0 bg-transparent text-white font-black h-auto py-0"></p-select>
                    </div>
                </div>
              </div>
            </div>
            
            <div class="flex flex-wrap gap-3 w-full md:w-auto">
                <p-button [label]="'orders.detail.send_email' | t" icon="pi pi-envelope" (onClick)="sendEmail()" 
                          [loading]="sendingEmail()"
                          [disabled]="ordersStore.saving() || sendingEmail()"
                          styleClass="rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white/20 px-6 py-3 font-bold"></p-button>
                <p-button [label]="'orders.detail.edit' | t" icon="pi pi-pencil" [routerLink]="['/orders', order()?.id, 'edit']" 
                          styleClass="rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white/20 px-6 py-3 font-bold"></p-button>
                <p-button [label]="'orders.detail.export_pdf' | t" icon="pi pi-file-pdf" (onClick)="printInvoice()" 
                          styleClass="rounded-2xl bg-white text-emerald-600 border-none shadow-xl hover:scale-105 transition-all px-8 py-3 font-black"></p-button>
            </div>
          </div>
        </div>

        <!-- Order Summary Row inside Card -->
        <div class="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-100 dark:divide-surface-800 bg-surface-50/50 dark:bg-surface-800/30">
          <div class="p-6 text-center">
            <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">{{ 'orders.detail.type' | t }}</span>
            <p-tag [value]="('dashboard.types.' + order()?.type) | t" [severity]="getTypeSeverity(order()?.type || '')" styleClass="text-xs px-4 py-1 rounded-full uppercase font-black"></p-tag>
          </div>
          <div class="p-6 text-center">
            <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">{{ 'orders.detail.payment_method' | t }}</span>
            <span class="text-lg font-black text-surface-900 dark:text-surface-0">{{ getPaymentMethodLabel(order()?.paymentMethod || '') }}</span>
          </div>
          <div class="p-6 text-center">
            <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">{{ 'orders.detail.status_label' | t }}</span>
            <p-tag [value]="('orders.status.' + order()?.status) | t" [severity]="getStatusSeverity(order()?.status || '')" styleClass="text-xs px-4 py-1 rounded-full uppercase font-black"></p-tag>
          </div>
        </div>
      </div>

      <!-- Live Dashboard Control View (Screen Only) -->
      <div class="no-print space-y-8">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <!-- Customer Summary Card -->
            <div class="lg:col-span-5">
                <div class="card shadow-xl border-0 rounded-[2.5rem] h-full p-8 bg-surface-0 dark:bg-surface-900 relative overflow-hidden transition-all hover:shadow-2xl">
                    <div class="absolute top-0 end-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem]"></div>
                    <h3 class="text-xl font-black text-surface-900 dark:text-surface-0 mb-8 flex items-center gap-3">
                        <div class="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center"><i class="pi pi-user text-xl"></i></div>
                        {{ 'orders.detail.customer' | t }}
                    </h3>
                    <div class="space-y-8">
                        <div>
                            <p class="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest block mb-2 px-1">{{ 'orders.detail.full_name' | t }}</p>
                            <p class="text-3xl font-black text-surface-900 dark:text-surface-0 tracking-tight">{{ order()?.customer?.name }}</p>
                        </div>
                        <div class="p-6 rounded-3xl bg-surface-50/50 dark:bg-surface-800/40 border border-surface-100 dark:border-surface-700 shadow-inner">
                            <p class="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase px-1 mb-2 tracking-widest">{{ 'orders.detail.contact' | t }}</p>
                            <div class="flex items-center gap-4">
                              <div class="w-12 h-12 bg-white dark:bg-surface-900 rounded-2xl flex items-center justify-center shadow-sm border border-surface-200 dark:border-surface-700">
                                <i class="pi pi-phone text-emerald-600 text-lg"></i>
                              </div>
                              <p class="font-mono text-2xl font-black text-emerald-600 tracking-tighter">{{ order()?.customer?.phone }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Service Summary Card -->
            <div class="lg:col-span-7">
                <div class="card shadow-xl border-0 rounded-[2.5rem] h-full bg-surface-0 dark:bg-surface-900 p-8 relative overflow-hidden transition-all hover:shadow-2xl">
                     <div class="absolute top-0 end-0 w-32 h-32 bg-teal-500/5 rounded-bl-[4rem]"></div>
                    
                    <h3 class="text-xl font-black text-surface-900 dark:text-surface-0 mb-8 flex items-center gap-3">
                        <div class="w-10 h-10 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center"><i class="pi pi-shield text-xl"></i></div>
                        {{ 'orders.detail.subscription_details' | t }}
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div class="space-y-6">
                            <!-- Financial Big Display -->
                            <div class="p-8 rounded-[2rem] bg-slate-900 dark:bg-surface-950 text-white shadow-2xl relative overflow-hidden group">
                                <div class="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 opacity-50"></div>
                                <p class="text-[10px] font-black uppercase opacity-60 mb-3 tracking-widest relative z-10">{{ 'orders.detail.amount' | t }}</p>
                                <p class="text-5xl font-black font-mono leading-none tracking-tighter relative z-10 group-hover:scale-110 transition-transform origin-left">{{ order()?.amount | number:'1.2-2' }} <span class="text-xs opacity-50 font-sans tracking-widest uppercase ml-1">$</span></p>
                            </div>
                            
                            <div class="flex justify-between items-center p-5 rounded-2xl bg-surface-50/50 dark:bg-surface-800 shadow-inner">
                                <span class="text-xs font-bold text-surface-400 uppercase tracking-widest">{{ 'orders.detail.payment_method' | t }}</span>
                                <span class="font-black text-surface-900 dark:text-surface-0 bg-white dark:bg-surface-900 px-4 py-1 rounded-xl shadow-sm">{{ getPaymentMethodLabel(order()?.paymentMethod || '') }}</span>
                            </div>
                        </div>
                        <div class="space-y-6">
                            <div class="flex flex-col gap-2 p-6 rounded-3xl border border-surface-100 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-800/20">
                                <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest">{{ 'orders.detail.server_name' | t }}</span>
                                <span class="text-2xl font-black text-emerald-600 tracking-tight">{{ order()?.serverName }}</span>
                            </div>
                            <div class="flex flex-col gap-2 p-6 rounded-3xl border border-primary/10 bg-primary/5">
                                <span class="text-[10px] font-black text-primary/60 uppercase tracking-widest">{{ 'orders.detail.expiry_date' | t }}</span>
                                <div class="flex items-center gap-3">
                                  <i class="pi pi-calendar-times text-emerald-600"></i>
                                  <span class="text-xl font-black text-surface-900 dark:text-surface-0 font-mono">{{ order()?.appExpiryDate | date:'mediumDate' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Agents Card -->
            <div class="lg:col-span-12">
                <div class="card shadow-xl border-0 rounded-[2.5rem] bg-surface-0 dark:bg-surface-900 p-8 relative overflow-hidden transition-all hover:shadow-2xl">
                     <div class="absolute top-0 end-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem]"></div>
                    
                    <h3 class="text-xl font-black text-surface-900 dark:text-surface-0 mb-8 flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center"><i class="pi pi-id-card text-xl"></i></div>
                        {{ 'orders.detail.agents_title' | t }}
                    </h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div class="space-y-4">
                            <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">{{ 'orders.detail.lead_agent_label' | t }}</span>
                            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                                <div class="font-black text-lg text-surface-900 dark:text-surface-0">{{ order()?.leadAgentName || order()?.leadAgent?.name }}</div>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <span class="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">{{ 'orders.detail.closer_agent_label' | t }}</span>
                            <div class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
                                <div class="font-black text-lg text-surface-900 dark:text-surface-0">{{ order()?.closerAgentName || order()?.closerAgent?.name }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <!-- Device List Card -->
          <div class="card shadow-xl border-0 rounded-[2.5rem] overflow-hidden bg-surface-0 dark:bg-surface-900 mb-12 transition-all hover:shadow-2xl">
            <div class="p-8 pb-4 flex justify-between items-center bg-white dark:bg-surface-900">
                <h2 class="text-2xl font-black text-surface-900 dark:text-surface-0 flex items-center gap-3 tracking-tight">
                    <div class="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-xl flex items-center justify-center text-surface-500">
                      <i class="pi pi-desktop"></i>
                    </div>
                    {{ 'orders.detail.connected_devices' | t }}
                </h2>
                <div class="px-4 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs font-black text-surface-400 uppercase tracking-widest">
                  {{ order()?.devices?.length || 0 }} {{ 'orders.detail.table.devices' | t }}
                </div>
            </div>
            
            <p-table [value]="order()?.devices || []" styleClass="p-datatable-sm cell-selection-table">
                <ng-template pTemplate="header">
                    <tr>
                        <th class="p-6 text-[10px] text-surface-400 font-black uppercase bg-surface-50 dark:bg-surface-800/50 border-none tracking-widest">{{ 'orders.detail.mac_address' | t }}</th>
                        <th class="p-6 text-[10px] text-surface-400 font-black uppercase bg-surface-50 dark:bg-surface-800/50 border-none tracking-widest">{{ 'orders.detail.device_name' | t }}</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-device>
                    <tr class="dark:border-surface-800">
                        <td class="p-6 font-mono text-emerald-600 font-bold dark:bg-surface-900 border-surface-100 dark:border-surface-800">{{ device.macAddress }}</td>
                        <td class="p-6 font-black text-surface-700 dark:text-surface-100 dark:bg-surface-900 border-surface-100 dark:border-surface-800">{{ device.deviceName }}</td>
                    </tr>
                </ng-template>
            </p-table>
          </div>

      <!-- Attachments Card -->
      <div class="col-span-1 xl:col-span-3">
          <div class="card shadow-xl border-0 rounded-[2.5rem] overflow-hidden bg-surface-0 dark:bg-surface-900 mb-12 transition-all hover:shadow-2xl">
            <div class="p-8 pb-4 flex justify-between items-center bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800">
                <h2 class="text-2xl font-black text-surface-900 dark:text-surface-0 flex items-center gap-3 tracking-tight">
                    <div class="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                      <i class="pi pi-paperclip"></i>
                    </div>
                    {{ 'order_form.attachments' | t }}
                </h2>
                <div class="px-4 py-1 bg-surface-100 dark:bg-surface-800 rounded-lg text-xs font-black text-surface-400 uppercase tracking-widest">
                  {{ order()?.attachments?.length || 0 }} {{ 'orders.detail.table.attachments' | t }}
                </div>
            </div>
            
            <div class="p-8 bg-surface-50 dark:bg-surface-800/10">
                @if (order()?.attachments?.length) {
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        @for (url of order()?.attachments; track url; let i = $index) {
                            <a [href]="url" target="_blank" class="block group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-400">
                                <img [src]="url" alt="Attachment" class="w-full h-32 object-cover transition-transform group-hover:scale-110" />
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <i class="pi pi-eye text-white text-3xl"></i>
                                </div>
                            </a>
                        }
                    </div>
                } @else {
                    <div class="text-center py-8 text-surface-400 font-bold opacity-60">
                         <i class="pi pi-images text-4xl mb-3 block"></i>
                         {{ 'ui.not_available' | t }}
                    </div>
                }
            </div>
          </div>
      </div>
    </div>
  </div>
    }
  `,
  styles: [`
    .font-tajawal { font-family: 'Tajawal', sans-serif; }
    :host ::ng-deep .p-select-sm .p-select-label { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
  `]
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private salesService = inject(SalesService);
  private invoicePdfService = inject(InvoicePdfService);
  private i18n = inject(I18nService);
  readonly ordersStore = inject(OrdersStore);
  private messageService = inject(MessageService);
  
  orderId = signal<string | null>(null);
  order = computed(() => {
    const id = this.orderId();
    return id ? this.ordersStore.entityMap()[id] || null : null;
  });
  currentStatus: OrderStatus = OrderStatus.PENDING;
  sendingEmail = signal(false);

  constructor() {
    effect(() => {
      const order = this.order();
      if (order) {
        this.currentStatus = order.status;
      }
    });

    effect(() => {
      const error = this.ordersStore.error();
      const lang = this.i18n.currentLang(); // Trigger effect on lang change
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.t('ui.error'),
          detail: error,
          life: 3000
        });
        setTimeout(() => this.ordersStore.clearError(), 3100);
      }
    });
  }

  statusOptions = computed(() => [
    { label: this.i18n.t('orders.status.pending'), value: OrderStatus.PENDING },
    { label: this.i18n.t('orders.status.completed'), value: OrderStatus.COMPLETED },
    { label: this.i18n.t('orders.status.cancelled'), value: OrderStatus.CANCELLED }
  ]);

  ngOnInit() {
    this.route.params.subscribe(params => {
        if (params['id']) {
            this.orderId.set(params['id']);
            this.ordersStore.loadOrder(params['id']);
        }
    });
  }

  onStatusChange(event: any) {
    if (!this.order()) return;
    this.ordersStore.updateOrderStatus({ id: this.order()!.id, status: this.currentStatus });
  }

  printInvoice() {
    if (this.order()) {
      this.invoicePdfService.generateInvoice(this.order()!);
    }
  }

  sendEmail() {
    if (!this.order()) return;
    const orderId = this.order()!.id;
    const customerEmail = this.order()!.customer.email;
    const invoiceFile = this.order()!.invoiceFile;

    if (!invoiceFile) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18n.t('ui.warning'),
        detail: 'لا يمكنك إرسال الفاتورة عبر البريد. يرجى إرفاق ملف الفاتورة أولاً من صفحة تعديل الطلب.',
        life: 5000
      });
      return;
    }

    if (!customerEmail) {
      this.messageService.add({
        severity: 'warn',
        summary: this.i18n.t('ui.warning'),
        detail: this.i18n.t('orders.detail.no_email'),
        life: 4000
      });
      return;
    }

    this.sendingEmail.set(true);
    this.salesService.sendInvoiceEmail(orderId).subscribe({
      next: (res) => {
        this.sendingEmail.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.i18n.t('ui.success'),
          detail: this.i18n.t('orders.detail.send_email_success').replace('{email}', res.email),
          life: 4000
        });
      },
      error: (err) => {
        this.sendingEmail.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.t('ui.error'),
          detail: this.i18n.t('orders.detail.send_email_error'),
          life: 4000
        });
      }
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
}
