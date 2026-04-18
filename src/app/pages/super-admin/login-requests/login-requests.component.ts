import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { LoginRequestsStore } from '../../../core/stores/login-requests.store';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { PopoverModule } from 'primeng/popover';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-login-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, ButtonModule, TagModule, SelectButtonModule, TooltipModule, PopoverModule, DialogModule, TranslatePipe],
  template: `
    <div class="card font-tajawal shadow-md border-t-4 border-t-primary rounded-[2rem] dark:bg-surface-900 overflow-hidden transition-all hover:shadow-lg">
      <!-- Header with Tabs -->
      <div class="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 relative overflow-hidden mb-8">
        <!-- Decorative background elements -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div>
            <h1 class="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <i class="pi pi-shield text-3xl"></i>
              {{ 'login_requests.title' | t }}
            </h1>
            <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest">{{ 'login_requests.subtitle' | t }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div class="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              <p-selectButton [options]="tabOptions()" [ngModel]="activeTab()" (ngModelChange)="activeTab.set($event); onTabChange()" styleClass="p-button-sm dashboard-tab-switch"></p-selectButton>
            </div>
            <p-button [label]="'ui.refresh' | t" icon="pi pi-refresh" (onClick)="refreshData()" [loading]="store.loading()" styleClass="rounded-2xl px-6 py-3 font-black bg-white text-emerald-600 border-none shadow-xl transform hover:scale-105 transition-all"></p-button>
          </div>
        </div>
      </div>

      <div class="p-8 pt-0">

      @if (activeTab() === 'pending') {
        <!-- Pending Requests Table -->
        <p-table [value]="store.requests()" [loading]="store.loading()" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.user' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.location' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.device' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.ip' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.date' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.actions' | t }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-request>
            <tr class="dark:border-surface-700">
              <td class="p-4 dark:bg-surface-900">
                <div class="font-bold text-surface-900 dark:text-surface-0">{{ request.user?.name }}</div>
                <div class="text-xs text-surface-500">{{ request.user?.email }}</div>
              </td>
              <td class="p-4 dark:bg-surface-900">
                <a [href]="'https://www.google.com/maps?q=' + request.latitude + ',' + request.longitude" 
                   target="_blank" class="text-primary hover:text-primary/80 hover:underline font-mono text-sm">
                  {{ request.latitude?.toFixed(4) }}, {{ request.longitude?.toFixed(4) }}
                </a>
              </td>
              <td class="p-4 dark:bg-surface-900 max-w-[150px]">
                <span class="text-xs text-surface-700 dark:text-surface-200 truncate block cursor-pointer hover:text-primary transition-colors" 
                      (click)="op.toggle($event)" [pTooltip]="'login_requests.device_tooltip' | t">
                  {{ request.deviceInfo }}
                </span>
                <p-popover #op>
                   <div class="p-3 text-xs leading-relaxed max-w-[300px] break-words text-surface-700 dark:text-surface-200">
                      <div class="font-bold mb-2 border-b border-surface-200 dark:border-surface-700 pb-1">{{ 'login_requests.device_details' | t }}</div>
                      {{ request.deviceInfo }}
                   </div>
                </p-popover>
              </td>
              <td class="p-4 font-mono text-sm text-surface-700 dark:text-surface-200 dark:bg-surface-900">{{ request.ipAddress }}</td>
              <td class="p-4 text-sm text-surface-500 dark:text-surface-400 dark:bg-surface-900">{{ request.createdAt | date: 'short' }}</td>
              <td class="p-4 dark:bg-surface-900">
                <div class="flex gap-2">
                  <p-button icon="pi pi-check" severity="success" (onClick)="approve(request.id)" [pTooltip]="'ui.approve' | t" [rounded]="true" [text]="true"></p-button>
                  <p-button icon="pi pi-times" severity="danger" (onClick)="reject(request.id)" [pTooltip]="'ui.reject' | t" [rounded]="true" [text]="true"></p-button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-12 text-surface-400 dark:text-surface-500 bg-white dark:bg-surface-900">
                <i class="pi pi-inbox text-4xl mb-4 block"></i>
                {{ 'login_requests.table.empty_pending' | t }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      } @else {
        <!-- History Requests Table -->
        <p-table [value]="store.history()" [loading]="store.loading()" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.user' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.location' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.device' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.ip' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.date' | t }}</th>
              <th class="p-4 text-xs text-surface-400 dark:text-surface-500 font-black uppercase bg-surface-50 dark:bg-surface-800">{{ 'login_requests.table.result' | t }}</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-request>
            <tr class="dark:border-surface-700">
              <td class="p-4 dark:bg-surface-900">
                <div class="font-bold text-surface-900 dark:text-surface-0">{{ request.user?.name }}</div>
                <div class="text-xs text-surface-500">{{ request.user?.email }}</div>
              </td>
              <td class="p-4 dark:bg-surface-900">
                <a [href]="'https://www.google.com/maps?q=' + request.latitude + ',' + request.longitude" 
                   target="_blank" class="text-primary hover:text-primary/80 hover:underline font-mono text-sm">
                  {{ request.latitude?.toFixed(4) }}, {{ request.longitude?.toFixed(4) }}
                </a>
              </td>
              <td class="p-4 dark:bg-surface-900 max-w-[150px]">
                <span class="text-xs text-surface-700 dark:text-surface-200 truncate block cursor-pointer hover:text-primary transition-colors" 
                      (click)="op.toggle($event)" [pTooltip]="'login_requests.device_tooltip' | t">
                  {{ request.deviceInfo }}
                </span>
                <p-popover #op>
                   <div class="p-3 text-xs leading-relaxed max-w-[300px] break-words text-surface-700 dark:text-surface-200">
                      <div class="font-bold mb-2 border-b border-surface-200 dark:border-surface-700 pb-1">{{ 'login_requests.device_details' | t }}</div>
                      {{ request.deviceInfo }}
                   </div>
                </p-popover>
              </td>
              <td class="p-4 font-mono text-sm text-surface-700 dark:text-surface-200 dark:bg-surface-900">{{ request.ipAddress }}</td>
              <td class="p-4 text-sm text-surface-500 dark:text-surface-400 dark:bg-surface-900">{{ request.createdAt | date: 'short' }}</td>
              <td class="p-4 dark:bg-surface-900">
                <p-tag [value]="getStatusLabel(request.status)" [severity]="getStatusSeverity(request.status)" styleClass="text-xs font-black uppercase px-3"></p-tag>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-12 text-surface-400 dark:text-surface-500 bg-white dark:bg-surface-900">
                <i class="pi pi-history text-4xl mb-4 block"></i>
                {{ 'login_requests.table.empty_history' | t }}
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
      </div>

      <!-- Trust Device Dialog -->
      <p-dialog [(visible)]="trustDialogVisible" [modal]="true" [header]="'login_requests.trust_dialog.header' | t" [style]="{width: '450px'}" styleClass="font-tajawal rounded-3xl" [draggable]="false" [resizable]="false">
        <div class="flex flex-col gap-6 p-4">
          <div class="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <i class="pi pi-shield text-3xl text-emerald-500"></i>
            <p class="text-sm font-bold text-emerald-900 dark:text-emerald-100 m-0 leading-relaxed">
              {{ 'login_requests.trust_dialog.question' | t }}
            </p>
          </div>
          <p class="text-xs text-surface-500 font-medium leading-relaxed px-2">
            {{ 'login_requests.trust_dialog.description' | t }}
          </p>
          <div class="flex flex-col gap-3 mt-2">
            <p-button [label]="'login_requests.trust_dialog.button_trust' | t" icon="pi pi-check-circle" severity="success" (onClick)="confirmApprove(true)" styleClass="w-full rounded-xl font-bold py-3 p-button-success border-none shadow-md"></p-button>
            <p-button [label]="'login_requests.trust_dialog.button_once' | t" icon="pi pi-check" severity="secondary" (onClick)="confirmApprove(false)" styleClass="w-full rounded-xl font-bold py-3 bg-surface-100 hover:bg-surface-200 text-surface-700 dark:bg-surface-800 dark:hover:bg-surface-700 dark:text-surface-200 border-none"></p-button>
          </div>
        </div>
      </p-dialog>

    </div>
  `,
  styles: [`
    .font-tajawal { font-family: 'Tajawal', sans-serif; }
  `]
})
export class LoginRequestsComponent implements OnInit {
  readonly store = inject(LoginRequestsStore);
  private i18n = inject(I18nService);

  activeTab = signal('pending');
  trustDialogVisible = false;
  selectedRequestId: number | null = null;

  tabOptions = computed(() => [
    { label: this.i18n.t('login_requests.tabs.pending'), value: 'pending' },
    { label: this.i18n.t('login_requests.tabs.history'), value: 'history' }
  ]);

  ngOnInit() {
    this.store.loadRequests();
  }

  onTabChange() {
    if (this.activeTab() === 'history') {
      this.store.loadHistory();
    } else {
      this.store.loadRequests();
    }
  }

  refreshData() {
    if (this.activeTab() === 'history') {
      this.store.loadHistory();
    } else {
      this.store.loadRequests();
    }
  }

  getStatusLabel(status: string) {
    switch (status) {
      case 'approved': return this.i18n.t('login_requests.status.approved');
      case 'rejected': return this.i18n.t('login_requests.status.rejected');
      default: return this.i18n.t('login_requests.status.pending');
    }
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'warn';
    }
  }

  approve(id: number) {
    this.selectedRequestId = id;
    this.trustDialogVisible = true;
  }

  confirmApprove(trust: boolean) {
    if (this.selectedRequestId) {
      this.store.updateStatus({ id: this.selectedRequestId, status: 'approved', trustDevice: trust });
      this.trustDialogVisible = false;
      this.selectedRequestId = null;
    }
  }

  reject(id: number) {
    this.store.updateStatus({ id, status: 'rejected' });
  }
}
