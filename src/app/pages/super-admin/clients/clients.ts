import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';

export interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    phone: string;
    status: 'Active' | 'Pending' | 'Inactive';
    lastContact: string;
}

@Component({
    selector: 'app-super-admin-clients',
    template: `
    <div class="card shadow-lg rounded-xl border-none font-tajawal">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
            <h5 class="m-0 text-2xl font-bold text-gray-800 dark:text-white">إدارة العملاء</h5>
            <span class="block relative w-full sm:w-auto">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input pInputText type="text" (input)="onGlobalFilter($event)" placeholder="البحث..."  class="w-full pl-10 text-right" />
            </span>
        </div>

        <p-table #dt [value]="clients" [rows]="10" [paginator]="true" 
                 [globalFilterFields]="['name','company','email']" [rowHover]="true" dataKey="id"
                 currentPageReportTemplate="عرض {first} إلى {last} من {totalRecords} عملاء">
            <ng-template pTemplate="header">
                <tr>
                    <th pSortableColumn="name" class="text-right">الاسم <p-sortIcon field="name"></p-sortIcon></th>
                    <th pSortableColumn="company" class="text-right">الشركة <p-sortIcon field="company"></p-sortIcon></th>
                    <th pSortableColumn="email" class="text-right">البريد الإلكتروني <p-sortIcon field="email"></p-sortIcon></th>
                    <th pSortableColumn="phone" class="text-right">الهاتف <p-sortIcon field="phone"></p-sortIcon></th>
                    <th pSortableColumn="status" class="text-right">الحالة <p-sortIcon field="status"></p-sortIcon></th>
                    <th class="text-right">الإجراءات</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-client>
                <tr>
                    <td>{{client.name}}</td>
                    <td>{{client.company}}</td>
                    <td>{{client.email}}</td>
                    <td>{{client.phone}}</td>
                    <td>
                        <p-tag [value]="client.status" [severity]="getStatusSeverity(client.status)"></p-tag>
                    </td>
                    <td>
                        <div class="flex gap-2">
                            <p-button icon="pi pi-pencil" [rounded]="true" severity="success" [outlined]="true"></p-button>
                            <p-button icon="pi pi-trash" [rounded]="true" severity="danger" [outlined]="true"></p-button>
                        </div>
                    </td>
                </tr>
            </ng-template>
        </p-table>
    </div>
    `,
    styles: [`
        .font-tajawal {
            font-family: 'Tajawal', sans-serif !important;
        }
    `],
    imports: [TableModule, ButtonModule, InputTextModule, CardModule, TagModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperAdminClients {
    clients: Client[] = [
        { id: 1, name: 'أحمد سعيد', company: 'Tech Horizons', email: 'ahmed@tech.com', phone: '+20 123 456 789', status: 'Active', lastContact: '2026-04-01' },
        { id: 2, name: 'سارة المنصور', company: 'Global Logistics', email: 'sara@logistics.sa', phone: '+966 500 123 456', status: 'Pending', lastContact: '2026-03-28' },
        { id: 3, name: 'محمود جابر', company: 'Smart Solutions', email: 'm.jaber@smart.eg', phone: '+20 111 222 333', status: 'Inactive', lastContact: '2026-02-15' },
    ];

    getStatusSeverity(status: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" | null | undefined {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Pending':
                return 'warn';
            case 'Inactive':
                return 'danger';
            default:
                return 'info';
        }
    }

    onGlobalFilter(event: Event) {
        // table filter implementation...
    }
}
