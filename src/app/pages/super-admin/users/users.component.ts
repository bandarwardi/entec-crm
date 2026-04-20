import { Component, OnInit, signal, ViewChild, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { User } from '@/app/core/services/user.service';
import { PasswordModule } from 'primeng/password';
import { UsersStore } from '@/app/core/stores/users.store';
import { AuthStore } from '@/app/core/stores/auth.store';
import { DatePipe, CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { I18nService } from '@/app/core/i18n/i18n.service';
import { TranslatePipe } from '@/app/core/i18n/translate.pipe';

@Component({
    selector: 'app-users',
    standalone: true,
    template: `
    <div class="flex flex-col gap-8 font-tajawal">
        <div class="card shadow-md border-t-4 border-t-primary rounded-[2rem] dark:bg-surface-900 overflow-hidden transition-all hover:shadow-lg">
            <div class="p-8 bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-900 dark:to-teal-800 relative overflow-hidden mb-8">
                <!-- Decorative background elements -->
                <div class="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl"></div>

                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 relative z-10">
                    <div class="flex items-center w-full lg:w-auto">
                        <div class="flex-1">
                            <h1 class="text-xl sm:text-2xl lg:text-3xl font-black text-white m-0 tracking-tight leading-tight break-words">
                                {{ 'users.title' | t }}
                            </h1>
                            <p class="text-emerald-50/80 font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-1 block leading-snug break-words">
                                {{ 'users.subtitle' | t }}
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        @if (authStore.currentRole() === 'admin' || authStore.currentRole() === 'super-admin') {
                            <p-button [label]="'إحصائيات اليوم'" icon="pi pi-chart-line" 
                                      [routerLink]="['/super-admin/daily-stats']" 
                                      styleClass="w-full sm:w-auto rounded-2xl px-5 py-3 md:h-12 font-bold bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white/30 transition-all text-xs md:text-sm uppercase tracking-widest shadow-sm" />
                        }
                        
                        <p-button [label]="'users.login_requests' | t" icon="pi pi-shield" 
                                  [routerLink]="['/super-admin/login-requests']" 
                                  styleClass="w-full sm:w-auto rounded-2xl px-5 py-3 md:h-12 font-bold bg-white/20 backdrop-blur-md text-white border border-white/40 hover:bg-white/30 transition-all text-xs md:text-sm uppercase tracking-widest shadow-sm" />
                        
                        <p-button [label]="'users.add_button' | t" icon="pi pi-plus" (onClick)="openNew()" 
                                  styleClass="w-full sm:w-auto rounded-2xl px-6 py-3 md:h-12 font-black bg-white text-emerald-600 border-transparent shadow-xl transform hover:-translate-y-0.5 transition-all text-xs md:text-sm uppercase tracking-widest" />
                    </div>
                </div>
            </div>

            <div class="p-8 pt-0">
              <div class="flex justify-end mb-4">
                  <p-iconfield class="w-full md:w-80">
                      <p-inputicon styleClass="pi pi-search" />
                      <input pInputText type="text" (input)="onGlobalFilter(dt, $event)" [placeholder]="'ui.search' | t" class="w-full rounded-2xl border-surface-200 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800 focus:ring-primary/20" />
                  </p-iconfield>
              </div>

              <p-table
                #dt
                [value]="store.entities()"
                [rows]="10"
                [paginator]="true"
                [globalFilterFields]="['name', 'email', 'role']"
                [tableStyle]="{ 'min-width': '75rem' }"
                [rowHover]="true"
                dataKey="id"
                [currentPageReportTemplate]="'users.table.report_template' | t"
                [showCurrentPageReport]="true"
                [rowsPerPageOptions]="[10, 20, 30]"
                [loading]="store.loading()"
                styleClass="p-datatable-sm"
              >
                <ng-template #header>
                    <tr>
                        <th pSortableColumn="name" style="min-width:16rem">{{ 'users.table.name' | t }} <p-sortIcon field="name" /></th>
                        <th pSortableColumn="email" style="min-width:16rem">{{ 'users.table.email' | t }} <p-sortIcon field="email" /></th>
                        <th pSortableColumn="role" style="min-width:10rem">{{ 'users.table.role' | t }} <p-sortIcon field="role" /></th>
                        <th pSortableColumn="createdAt" style="min-width:12rem">{{ 'users.table.reg_date' | t }} <p-sortIcon field="createdAt" /></th>
                        <th style="min-width:10rem">{{ 'users.table.performance' | t }}</th>
                        <th style="min-width: 12rem">{{ 'ui.actions' | t }}</th>
                    </tr>
                </ng-template>
                <ng-template #body let-user>
                    <tr>
                        <td style="min-width: 16rem">{{ user.name }}</td>
                        <td style="min-width: 16rem">{{ user.email }}</td>
                        <td><p-tag [value]="user.role" [severity]="getRoleSeverity(user.role)" /></td>
                        <td>{{ user.createdAt | date:'yyyy-MM-dd' }}</td>
                        <td>
                            <p-button 
                                [label]="'users.table.view_performance' | t" 
                                icon="pi pi-chart-bar" 
                                [outlined]="true" 
                                severity="info"
                                size="small"
                                (onClick)="viewPerformance(user)" />
                        </td>
                        <td>
                            <p-button icon="pi pi-pencil" class="ml-2" [rounded]="true" [outlined]="true" (onClick)="editUser(user)" />
                            <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [outlined]="true" (onClick)="deleteUser(user)" />
                        </td>
                    </tr>
                </ng-template>
              </p-table>
            </div>
        </div>

        <p-dialog [visible]="store.dialogVisible()" (visibleChange)="store.closeDialog()" [style]="{ width: '450px' }" [header]="'users.dialog.title' | t" [modal]="true">
            <ng-template pTemplate="content">
                @if (store.selectedUser(); as user) {
                    <div class="flex flex-col gap-6">
                        <div>
                            <label for="name" class="block font-bold mb-3">{{ 'users.table.name' | t }}</label>
                            <input type="text" pInputText id="name" [(ngModel)]="user.name" required autofocus fluid />
                            @if (submitted && !user.name) { <small class="text-red-500">{{ 'leads.validation.name_required' | t }}</small> }
                        </div>
                        <div>
                            <label for="email" class="block font-bold mb-3">{{ 'users.table.email' | t }}</label>
                            <input type="email" pInputText id="email" [(ngModel)]="user.email" required fluid />
                            @if (submitted && !user.email) { <small class="text-red-500">{{ 'leads.validation.email_required' | t }}</small> }
                        </div>
                        <div>
                            <label for="password" class="block font-bold mb-3">{{ 'users.dialog.password' | t }}</label>
                            <p-password id="password" [(ngModel)]="user.password" [toggleMask]="true" fluid [feedback]="false" [placeholder]="'users.dialog.password_placeholder' | t"></p-password>
                        </div>
                        <div>
                            <label for="role" class="block font-bold mb-3">{{ 'users.table.role' | t }}</label>
                            <p-select appendTo="body" [(ngModel)]="user.role" inputId="role" [options]="roles()" optionLabel="label" optionValue="value" [placeholder]="'users.dialog.role_placeholder' | t" fluid />
                            @if (submitted && !user.role) { <small class="text-red-500">{{ 'leads.validation.role_required' | t }}</small> }
                        </div>
                        @if (store.error()) { <div class="text-red-500 font-bold mb-2 p-2 bg-red-50 rounded">{{ store.error() }}</div> }
                    </div>
                }
            </ng-template>

            <ng-template pTemplate="footer">
                <p-button [label]="'ui.cancel' | t" icon="pi pi-times" text (onClick)="store.closeDialog()" />
                <p-button [label]="'ui.save' | t" icon="pi pi-check" [loading]="store.loading()" (onClick)="saveUser()" />
            </ng-template>
        </p-dialog>

        <p-confirmdialog [style]="{ width: '450px' }" [acceptLabel]="'ui.yes' | t" [rejectLabel]="'ui.no' | t" />
        <p-toast position="bottom-right"></p-toast>
    </div>
    `,
    providers: [MessageService, ConfirmationService],
    imports: [
        FormsModule,
        CommonModule,
        TableModule,
        ButtonModule,
        RippleModule,
        ToastModule,
        ToolbarModule,
        InputTextModule,
        SelectModule,
        DialogModule,
        TagModule,
        InputIconModule,
        IconFieldModule,
        ConfirmDialogModule,
        PasswordModule,
        RouterModule,
        TranslatePipe,
        DatePipe
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    private router = inject(Router);
    private i18n = inject(I18nService);
    readonly store = inject(UsersStore);
    readonly authStore = inject(AuthStore);

    submitted: boolean = false;

    roles = computed(() => [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Agent', value: 'agent' }
    ]);

    @ViewChild('dt') dt!: Table;

    ngOnInit() {
        this.store.loadUsers();
    }

    onGlobalFilter(table: Table, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    viewPerformance(user: User) {
        this.router.navigate(['/super-admin/employee-performance', user.id]);
    }

    openNew() {
        this.submitted = false;
        this.store.openDialog();
    }

    editUser(user: User) {
        this.submitted = false;
        this.store.openDialog(user);
    }

    deleteUser(user: User) {
        this.confirmationService.confirm({
            message: this.i18n.t('users.delete.confirm_msg').replace('{name}', user.name),
            header: this.i18n.t('ui.confirm'),
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: this.i18n.t('ui.yes'),
            rejectLabel: this.i18n.t('ui.no'),
            accept: () => {
                this.store.deleteUser(user.id);
                this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('leads.delete.user_success'), life: 3000 });
            }
        });
    }

    getRoleSeverity(role: string) {
        switch (role) {
            case 'super-admin': return 'contrast';
            case 'admin': return 'info';
            case 'agent': return 'success';
            default: return 'info';
        }
    }

    saveUser() {
        this.submitted = true;
        const user = this.store.selectedUser();

        if (user && user.name?.trim() && user.email?.trim() && user.role) {
            if (user.id) {
                this.store.updateUser({ id: user.id, changes: user });
            } else {
                this.store.createUser(user);
            }
        }
    }
}



