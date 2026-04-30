import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService } from '../../core/services/sales.service';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-commissions',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, CardModule, SelectModule, FormsModule, TranslatePipe],
  template: `
    <div class="flex flex-col gap-8">
      <!-- Premium Header Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="card p-6 rounded-[2rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div class="relative z-10">
            <p class="text-emerald-100 font-bold text-xs uppercase tracking-widest">{{ 'ui.total_earnings' | t }}</p>
            <h2 class="text-4xl font-black mt-2">{{ stats()?.total | currency:'USD' }}</h2>
            <p class="text-emerald-100/80 text-[10px] mt-4 font-bold tracking-tight">Based on {{ stats()?.count }} completed sales</p>
          </div>
        </div>

        <div class="card p-6 rounded-[2rem] bg-white dark:bg-surface-900 border-0 shadow-sm">
          <p class="text-surface-400 font-bold text-xs uppercase tracking-widest">Lead Earnings</p>
          <h3 class="text-3xl font-black mt-2 text-surface-900 dark:text-white">{{ stats()?.leadTotal | currency:'USD' }}</h3>
          <div class="flex items-center gap-2 mt-4">
             <span class="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">{{ stats()?.rates?.leadRate }}% Rate</span>
          </div>
        </div>

        <div class="card p-6 rounded-[2rem] bg-white dark:bg-surface-900 border-0 shadow-sm">
          <p class="text-surface-400 font-bold text-xs uppercase tracking-widest">Closer Earnings</p>
          <h3 class="text-3xl font-black mt-2 text-surface-900 dark:text-white">{{ stats()?.closerTotal | currency:'USD' }}</h3>
          <div class="flex items-center gap-2 mt-4">
             <span class="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black">{{ stats()?.rates?.closerRate }}% Rate</span>
          </div>
        </div>

        <div class="card p-6 rounded-[2rem] bg-surface-900 text-white border-0 shadow-sm flex flex-col justify-between">
           <div class="flex flex-col gap-4">
              <p class="text-surface-400 font-bold text-xs uppercase tracking-widest">Filter Period</p>
              <div class="flex gap-2">
                 <p-select [options]="months" [(ngModel)]="selectedMonth" (onChange)="loadCommissions()" class="w-full"></p-select>
                 <p-select [options]="years" [(ngModel)]="selectedYear" (onChange)="loadCommissions()" class="w-full"></p-select>
              </div>
           </div>
        </div>
      </div>

      <!-- Detailed Table -->
      <div class="card p-0 rounded-[2.5rem] overflow-hidden border-0 shadow-2xl bg-white dark:bg-surface-900">
        <div class="p-8 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
          <h3 class="text-2xl font-black text-surface-900 dark:text-white m-0 flex items-center gap-4">
             <i class="pi pi-receipt text-indigo-500"></i>
             Commission Details
          </h3>
          <button pButton icon="pi pi-download" label="Export Report" class="p-button-outlined p-button-rounded font-black text-sm"></button>
        </div>

        <p-table [value]="stats()?.orders || []" [rows]="10" [paginator]="true" class="p-datatable-custom">
          <ng-template pTemplate="header">
            <tr>
              <th class="bg-surface-50 dark:bg-surface-950 p-6 text-xs font-black uppercase tracking-widest">Date</th>
              <th class="bg-surface-50 dark:bg-surface-950 p-6 text-xs font-black uppercase tracking-widest">Customer</th>
              <th class="bg-surface-50 dark:bg-surface-950 p-6 text-xs font-black uppercase tracking-widest">Order Amount</th>
              <th class="bg-surface-50 dark:bg-surface-950 p-6 text-xs font-black uppercase tracking-widest">Role</th>
              <th class="bg-surface-50 dark:bg-surface-950 p-6 text-xs font-black uppercase tracking-widest">Commission</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-order>
            <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/30 transition-all">
              <td class="p-6 font-bold text-surface-600 dark:text-surface-400">{{ order.date | date:'mediumDate' }}</td>
              <td class="p-6 font-black text-surface-900 dark:text-white">{{ order.customerName }}</td>
              <td class="p-6 font-black text-surface-900 dark:text-white">{{ order.amount | currency:'USD' }}</td>
              <td class="p-6">
                 <span [class]="order.role === 'Lead' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'" 
                       class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                   {{ order.role }}
                 </span>
              </td>
              <td class="p-6">
                <span class="text-emerald-600 dark:text-emerald-400 font-black text-lg">+ {{ order.commission | currency:'USD' }}</span>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
             <tr>
                <td colspan="5" class="p-20 text-center">
                   <i class="pi pi-info-circle text-4xl text-surface-300"></i>
                   <p class="text-surface-500 font-bold mt-4">No commissions found for this period.</p>
                </td>
             </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    
    :host ::ng-deep .p-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 1rem;
    }
    :host ::ng-deep .p-select .p-select-label {
      color: white;
      font-weight: 800;
    }
  `]
})
export class CommissionsComponent implements OnInit {
  private salesService = inject(SalesService);
  
  stats = signal<any>(null);
  
  months = [
    { label: 'January', value: 1 }, { label: 'February', value: 2 }, { label: 'March', value: 3 },
    { label: 'April', value: 4 }, { label: 'May', value: 5 }, { label: 'June', value: 6 },
    { label: 'July', value: 7 }, { label: 'August', value: 8 }, { label: 'September', value: 9 },
    { label: 'October', value: 10 }, { label: 'November', value: 11 }, { label: 'December', value: 12 }
  ];
  
  years = Array.from({ length: 5 }, (_, i) => ({ label: (2024 + i).toString(), value: 2024 + i }));
  
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  ngOnInit() {
    this.loadCommissions();
  }

  loadCommissions() {
    this.salesService.getCommissions(this.selectedMonth, this.selectedYear).subscribe(res => {
      this.stats.set(res);
    });
  }
}
