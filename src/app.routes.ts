import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/core/guards/auth.guard';
import { roleGuard } from './app/core/guards/role.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'profile', loadComponent: () => import('./app/pages/profile/profile.component').then(m => m.ProfileComponent) },
            { 
                path: 'super-admin/users', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/users/users.component').then(m => m.UsersComponent) 
            },
            { 
                path: 'super-admin/employee-performance/:id', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/employee-performance/employee-performance.component').then(m => m.EmployeePerformanceComponent) 
            },
            { 
                path: 'super-admin/employee-performance/:id/day/:date', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/employee-performance/day-performance-detail/day-performance-detail.component').then(m => m.DayPerformanceDetailComponent) 
            },
            { 
                path: 'super-admin/work-settings', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/work-settings/work-settings.component').then(m => m.WorkSettingsComponent) 
            },
            { 
                path: 'super-admin/scenarios', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/scenarios/scenarios.component').then(m => m.ScenariosComponent) 
            },
            { 
                path: 'super-admin/settings', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/settings/settings.component').then(m => m.SuperAdminSettingsComponent) 
            },
            { 
                path: 'super-admin/login-requests', 
                canActivate: [roleGuard],
                data: { roles: ['super-admin', 'admin'] },
                loadComponent: () => import('@/app/pages/super-admin/login-requests/login-requests.component').then(m => m.LoginRequestsComponent) 
            },

            // Sales & Customers
            { path: 'customers', loadComponent: () => import('./app/pages/customers/customers-list').then(m => m.CustomersListComponent) },
            { path: 'customers/:id', loadComponent: () => import('./app/pages/customers/customer-detail').then(m => m.CustomerDetailComponent) },
            { path: 'orders', loadComponent: () => import('./app/pages/orders/orders-list').then(m => m.OrdersListComponent) },
            { path: 'orders/new', loadComponent: () => import('./app/pages/orders/order-form').then(m => m.OrderFormComponent) },
            { path: 'orders/:id', loadComponent: () => import('./app/pages/orders/order-detail').then(m => m.OrderDetailComponent) },
            { path: 'orders/:id/edit', loadComponent: () => import('./app/pages/orders/order-form').then(m => m.OrderFormComponent) },

            { path: 'leads', loadComponent: () => import('./app/pages/leads/leads.component').then(m => m.LeadsComponent) },
            { path: 'buying-areas', loadComponent: () => import('./app/pages/buying-areas/buying-areas.component').then(m => m.BuyingAreasComponent) },
            { path: 'chat', loadComponent: () => import('./app/pages/chat/chat.component').then(m => m.ChatComponent) },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];

