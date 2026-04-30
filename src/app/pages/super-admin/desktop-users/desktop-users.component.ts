import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { API_BASE_URL } from '../../../core/constants/api.constants';

@Component({
  selector: 'app-desktop-users',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TableModule, 
    ButtonModule, 
    DialogModule, 
    InputTextModule, 
    ToolbarModule, 
    ConfirmDialogModule, 
    ToggleSwitchModule,
    ToastModule,
    SelectModule,
    TranslatePipe
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="card shadow-md rounded-2xl p-6">
        <p-toolbar styleClass="mb-4 bg-transparent border-none p-0">
            <ng-template pTemplate="left">
                <div class="flex flex-column gap-2">
                    <h4 class="m-0 font-bold text-xl">{{ 'desktop_users.title' | t }}</h4>
                    <span class="text-secondary text-sm">{{ 'desktop_users.subtitle' | t }}</span>
                </div>
            </ng-template>

            <ng-template pTemplate="right">
                <button pButton pRipple label="{{ 'desktop_users.add_button' | t }}" icon="pi pi-plus" class="p-button-success rounded-xl" (click)="openNew()"></button>
            </ng-template>
        </p-toolbar>

        <p-table [value]="users" [rows]="10" [paginator]="true" responsiveLayout="scroll" [loading]="loading" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
                <tr>
                    <th>{{ 'desktop_users.table.name' | t }}</th>
                    <th>{{ 'desktop_users.table.username' | t }}</th>
                    <th>الموظف المرتبط</th>
                    <th>{{ 'desktop_users.table.status' | t }}</th>
                    <th style="width: 8rem">{{ 'ui.actions' | t }}</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
                <tr>
                    <td>{{ user.name }}</td>
                    <td><code class="text-primary font-bold">{{ user.username }}</code></td>
                    <td>
                        @if (user.linkedUser) {
                            <div class="flex items-center gap-2">
                                <span class="pi pi-user text-xs"></span>
                                {{ getCRMUserName(user.linkedUser) }}
                            </div>
                        } @else {
                            <span class="text-surface-400 italic">غير مرتبط</span>
                        }
                    </td>
                    <td>
                        <span [class]="'badge status-' + (user.isActive ? 'active' : 'disabled')">
                            {{ (user.isActive ? 'ui.active' : 'ui.disabled') | t }}
                        </span>
                    </td>
                    <td>
                        <button pButton pRipple icon="pi pi-pencil" class="p-button-rounded p-button-text p-button-sm mr-2" (click)="editUser(user)"></button>
                        <button pButton pRipple icon="pi pi-trash" class="p-button-rounded p-button-text p-button-sm p-button-danger" (click)="deleteUser(user)"></button>
                    </td>
                </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
                <tr>
                    <td colspan="5" class="text-center p-4">{{ 'ui.no_data' | t }}</td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <p-dialog [(visible)]="userDialog" [style]="{width: '450px'}" [header]="'desktop_users.dialog.title' | t" [modal]="true" class="p-fluid" [draggable]="false" [resizable]="false">
        <ng-template pTemplate="content">
            <div class="field mb-4">
                <label for="name" class="block font-bold mb-2">{{ 'desktop_users.dialog.name' | t }}</label>
                <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus class="rounded-xl" />
            </div>
            <div class="field mb-4">
                <label for="username" class="block font-bold mb-2">{{ 'desktop_users.dialog.username' | t }}</label>
                <input type="text" pInputText id="username" [(ngModel)]="user.username" required class="rounded-xl" />
            </div>
            <div class="field mb-4">
                <label for="linkedUser" class="block font-bold mb-2">ربط بموظف CRM</label>
                <p-select [options]="crmUsers" [(ngModel)]="user.linkedUser" optionLabel="name" optionValue="id" [filter]="true" filterBy="name" [showClear]="true" placeholder="اختر موظف للربط" class="rounded-xl"></p-select>
                <small class="text-surface-500 block mt-1">هذا الموظف هو من سيظهر "أونلاين" عند تشغيل هذا الحساب.</small>
            </div>
            <div class="field mb-4">
                <label for="password" class="block font-bold mb-2">{{ 'desktop_users.dialog.password' | t }}</label>
                <input type="password" pInputText id="password" [(ngModel)]="user.password" [placeholder]="user._id ? 'أتركه فارغاً لعدم التغيير' : ''" class="rounded-xl" />
            </div>
            <div class="field flex align-items-center gap-3">
                <label for="active" class="font-bold">{{ 'ui.active' | t }}</label>
                <p-toggleSwitch [(ngModel)]="user.isActive"></p-toggleSwitch>
            </div>
        </ng-template>

        <ng-template pTemplate="footer">
            <button pButton pRipple label="{{ 'ui.cancel' | t }}" icon="pi pi-times" class="p-button-text" (click)="hideDialog()"></button>
            <button pButton pRipple label="{{ 'ui.save' | t }}" icon="pi pi-check" class="p-button-primary rounded-xl" (click)="saveUser()"></button>
        </ng-template>
    </p-dialog>

    <style>
        .badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .status-active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-disabled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    </style>
  `
})
export class DesktopUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  crmUsers: any[] = [];
  user: any = {};
  userDialog: boolean = false;
  loading: boolean = true;

  ngOnInit() {
    this.loadUsers();
    this.loadCRMUsers();
  }

  loadCRMUsers() {
    this.http.get<any[]>(`${API_BASE_URL}/users`).subscribe({
      next: (data) => {
        this.crmUsers = data;
        this.cdr.detectChanges();
      },
      error: () => console.error('Failed to load CRM users')
    });
  }

  getCRMUserName(userId: string): string {
    const u = this.crmUsers.find(x => x.id === userId || x._id === userId);
    return u ? u.name : 'موظف غير معروف';
  }

  loadUsers() {
    this.loading = true;
    this.http.get<any[]>(`${API_BASE_URL}/auth/desktop-users`).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openNew() {
    this.user = { isActive: true };
    this.userDialog = true;
  }

  editUser(user: any) {
    this.user = { ...user };
    this.userDialog = true;
  }

  deleteUser(user: any) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا المستخدم؟',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.http.delete(`${API_BASE_URL}/auth/desktop-users/${user._id}`).subscribe(() => {
          this.users = this.users.filter(val => val._id !== user._id);
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'User Deleted', life: 3000 });
          this.cdr.detectChanges();
        });
      }
    });
  }

  hideDialog() {
    this.userDialog = false;
  }

  saveUser() {
    if (this.user.username && this.user.name) {
      if (this.user._id) {
        this.http.put(`${API_BASE_URL}/auth/desktop-users/${this.user._id}`, this.user).subscribe(() => {
          this.loadUsers();
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'User Updated', life: 3000 });
          this.userDialog = false;
          this.user = {};
          this.cdr.detectChanges();
        });
      } else {
        this.http.post(`${API_BASE_URL}/auth/desktop-users`, this.user).subscribe(() => {
          this.loadUsers();
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'User Created', life: 3000 });
          this.userDialog = false;
          this.user = {};
          this.cdr.detectChanges();
        });
      }
    }
  }
}
