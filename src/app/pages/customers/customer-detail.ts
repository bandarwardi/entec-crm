import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SalesService, Customer } from '../../core/services/sales.service';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { AuthStore } from '../../core/stores/auth.store';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, CardModule, TableModule, TagModule, TooltipModule, TranslatePipe],
  template: `
    @if (customer()) {
        <div class="font-tajawal max-w-6xl mx-auto px-4 py-8">
        
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-8 pb-6 border-b border-surface-200 dark:border-surface-700">
            <div class="flex items-center gap-4">
                <p-button icon="pi pi-arrow-right" routerLink="/customers" [rounded]="true" [text]="true" severity="secondary" [pTooltip]="'customers.detail.back_tooltip' | t"></p-button>
                <h1 class="text-3xl font-black text-surface-900 dark:text-surface-0">
                    {{ 'customers.detail.title' | t }} <span class="text-primary">{{ customer()?.name }}</span>
                </h1>
            </div>
            <div class="flex gap-2">
                @if (!isAgent()) {
                    <p-button [label]="'customers.table.new_order' | t" icon="pi pi-plus" [routerLink]="['/orders/new']" 
                              [queryParams]="{customerId: customer()?.id}" styleClass="rounded-xl font-bold shadow-lg"></p-button>
                }
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <!-- Basic Info -->
            <div class="card shadow-md border border-surface-200 dark:border-surface-700 rounded-3xl p-8 bg-white dark:bg-surface-900 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
                <h3 class="text-lg font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-6">{{ 'customers.detail.basic_info' | t }}</h3>
                <div class="space-y-6">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-surface-400 uppercase mb-1">{{ 'customers.table.name' | t }}</span>
                        <span class="text-xl font-black text-surface-900 dark:text-surface-0">{{ customer()?.name }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-surface-400 uppercase mb-1">{{ 'customers.detail.phone' | t }}</span>
                        <span class="text-lg font-bold font-mono text-primary" dir="ltr">{{ customer()?.phone }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-surface-400 uppercase mb-1">{{ 'customers.detail.email' | t }}</span>
                        <span class="text-surface-700 dark:text-surface-200 font-bold">{{ customer()?.email || ('ui.not_available' | t) }}</span>
                    </div>
                </div>
            </div>

            <!-- Location -->
            <div class="card shadow-md border border-surface-200 dark:border-surface-700 rounded-3xl p-8 bg-white dark:bg-surface-900 relative overflow-hidden">
                <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12"></div>
                <h3 class="text-lg font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-6">{{ 'customers.detail.location' | t }}</h3>
                <div class="space-y-6">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-surface-400 uppercase mb-1">{{ 'customers.table.state' | t }}</span>
                        <span class="text-xl font-black text-surface-900 dark:text-surface-0">{{ customer()?.state }}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-surface-400 uppercase mb-1">{{ 'customers.detail.address' | t }}</span>
                        <span class="text-surface-700 dark:text-surface-200 font-bold leading-relaxed">{{ customer()?.address }}</span>
                    </div>
                    @if (customer()?.latitude) {
                        <div class="pt-2">
                            <a [href]="'https://www.google.com/maps?q=' + customer()?.latitude + ',' + customer()?.longitude" 
                               target="_blank" class="w-full">
                                <p-button [label]="'customers.detail.open_maps' | t" icon="pi pi-map-marker" 
                                          styleClass="w-full p-button-outlined rounded-xl font-bold"></p-button>
                            </a>
                        </div>
                    }
                </div>
            </div>

            <!-- Stats -->
            <div class="card shadow-md border border-surface-200 dark:border-surface-700 rounded-3xl p-8 bg-white dark:bg-surface-900 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                <h3 class="text-lg font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-4 relative z-10">{{ 'customers.detail.sales_summary' | t }}</h3>
                <div class="relative z-10">
                    <span class="text-7xl font-black text-primary block mb-2">{{ customer()?.orders?.length || 0 }}</span>
                    <span class="text-sm font-bold text-surface-500 uppercase">{{ 'customers.detail.total_orders' | t }}</span>
                </div>
            </div>
        </div>

        <!-- Orders List -->
        <div class="card shadow-md border border-surface-200 dark:border-surface-700 rounded-3xl overflow-hidden bg-white dark:bg-surface-900">
            <div class="p-6 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-100 dark:border-surface-700">
                <h2 class="text-2xl font-black text-surface-900 dark:text-surface-0 flex items-center gap-3">
                    <i class="pi pi-history text-primary"></i> {{ 'customers.detail.orders_history' | t }}
                </h2>
            </div>
            <p-table [value]="customer()?.orders || []" responsiveLayout="scroll" styleClass="p-datatable-sm">
                <ng-template pTemplate="header">
                    <tr>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'orders.list.table.order_no' | t }}</th>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'orders.list.table.type' | t }}</th>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'orders.list.table.amount' | t }}</th>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'orders.list.table.payment_method' | t }}</th>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'orders.list.table.status' | t }}</th>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'orders.list.table.date' | t }}</th>
                        <th class="p-6 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'ui.actions' | t }}</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-order>
                    <tr class="dark:border-surface-700">
                        <td class="p-6 font-mono text-surface-900 dark:text-surface-0 font-bold dark:bg-surface-900" [pTooltip]="order.id" tooltipPosition="top">#{{ order.id.slice(0, 5) }}</td>
                        <td class="p-6 dark:bg-surface-900">
                            <p-tag [value]="order.type" [severity]="getTypeSeverity(order.type)" styleClass="text-[10px] font-black uppercase px-3"></p-tag>
                        </td>
                        <td class="p-6 font-black text-green-600 font-mono dark:bg-surface-900">{{ order.amount | currency }}</td>
                        <td class="p-6 text-surface-700 dark:text-surface-200 font-bold dark:bg-surface-900">{{ order.paymentMethod }}</td>
                        <td class="p-6 dark:bg-surface-900">
                            <p-tag [value]="order.status" [severity]="getStatusSeverity(order.status)" styleClass="text-[10px] font-black uppercase px-3"></p-tag>
                        </td>
                        <td class="p-6 text-surface-500 dark:text-surface-400 font-bold dark:bg-surface-900">{{ order.createdAt | date:'mediumDate' }}</td>
                        <td class="p-6 dark:bg-surface-900">
                            <p-button icon="pi pi-eye" [routerLink]="['/orders', order.id]" severity="info" [rounded]="true" [text]="true"></p-button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="7" class="text-center p-12 text-surface-400 dark:text-surface-500 bg-white dark:bg-surface-900">
                            <i class="pi pi-inbox text-4xl mb-4 block"></i>
                            {{ 'customers.detail.orders_empty' | t }}
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
        </div>
    }
  `,
  styles: [`
    .font-tajawal { font-family: 'Tajawal', sans-serif; }
  `]
})
export class CustomerDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private salesService = inject(SalesService);
  private authStore = inject(AuthStore);
  
  customer = signal<Customer | null>(null);
  isAgent = computed(() => this.authStore.user()?.role === 'agent');

  ngOnInit() {
    this.route.params.subscribe(params => {
        if (params['id']) {
            this.salesService.getCustomer(params['id']).subscribe(c => this.customer.set(c));
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
}
