import { Component, OnInit, inject } from '@angular/core';
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
    TranslatePipe
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="card">
        <p-toolbar styleClass="mb-4">
            <ng-template pTemplate="left">
                <div class="flex flex-column gap-2">
                    <h4 class="m-0">{{ 'desktop_users.title' | t }}</h4>
                    <span class="text-secondary text-sm">{{ 'desktop_users.subtitle' | t }}</span>
                </div>
            </ng-template>

            <ng-template pTemplate="right">
                <button pButton pRipple label="{{ 'desktop_users.add_button' | t }}" icon="pi pi-plus" class="p-button-success mr-2" (click)="openNew()"></button>
            </ng-template>
        </p-toolbar>

        <p-table [value]="users" [rows]="10" [paginator]="true" responsiveLayout="scroll" [loading]="loading" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
                <tr>
                    <th>{{ 'desktop_users.table.name' | t }}</th>
                    <th>{{ 'desktop_users.table.username' | t }}</th>
                    <th>{{ 'desktop_users.table.status' | t }}</th>
                    <th style="width: 8rem">{{ 'ui.actions' | t }}</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
                <tr>
                    <td>{{ user.name }}</td>
                    <td><code class="text-primary">{{ user.username }}</code></td>
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
                    <td colspan="4" class="text-center p-4">{{ 'ui.no_data' | t }}</td>
                </tr>
            </ng-template>
        </p-table>
    </div>

    <p-dialog [(visible)]="userDialog" [style]="{width: '450px'}" [header]="'desktop_users.dialog.title' | t" [modal]="true" class="p-fluid" [draggable]="false" [resizable]="false">
        <ng-template pTemplate="content">
            <div class="field mb-4">
                <label for="name">{{ 'desktop_users.dialog.name' | t }}</label>
                <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus />
            </div>
            <div class="field mb-4">
                <label for="username">{{ 'desktop_users.dialog.username' | t }}</label>
                <input type="text" pInputText id="username" [(ngModel)]="user.username" required />
            </div>
            <div class="field mb-4">
                <label for="password">{{ 'desktop_users.dialog.password' | t }}</label>
                <input type="password" pInputText id="password" [(ngModel)]="user.password" [placeholder]="user._id ? 'أتركه فارغاً لعدم التغيير' : ''" />
            </div>
            <div class="field flex align-items-center gap-3">
                <label for="active">{{ 'ui.active' | t }}</label>
                <p-toggleSwitch [(ngModel)]="user.isActive"></p-toggleSwitch>
            </div>
        </ng-template>

        <ng-template pTemplate="footer">
            <button pButton pRipple label="{{ 'ui.cancel' | t }}" icon="pi pi-times" class="p-button-text" (click)="hideDialog()"></button>
            <button pButton pRipple label="{{ 'ui.save' | t }}" icon="pi pi-check" class="p-button-primary" (click)="saveUser()"></button>
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

  users: any[] = [];
  user: any = {};
  userDialog: boolean = false;
  loading: boolean = true;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.http.get<any[]>(`${API_BASE_URL}/auth/desktop-users`).subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users' });
        this.loading = false;
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
        });
      } else {
        this.http.post(`${API_BASE_URL}/auth/desktop-users`, this.user).subscribe(() => {
          this.loadUsers();
          this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'User Created', life: 3000 });
          this.userDialog = false;
          this.user = {};
        });
      }
    }
  }
}
