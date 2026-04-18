import { Component, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppMenuitem } from './app.menuitem';
import { AuthStore } from '../../core/stores/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
    selector: 'app-menu',
    template: `
        <ul class="layout-menu">
            @for (item of model(); track item.label; let i = $index) {
                @if (!item.separator) {
                    <li app-menuitem [item]="item" [index]="i" [root]="true"></li>
                } @else {
                    <li class="menu-separator"></li>
                }
            }
        </ul>
    `,
    imports: [RouterModule, CommonModule, AppMenuitem]
})
export class AppMenu {
    readonly authStore = inject(AuthStore);
    private i18n = inject(I18nService);

    model = computed<any[]>(() => {
        const role = this.authStore.user()?.role;
        const isAgent = role === 'agent';

        const mainItems = [
            { 
                label: this.i18n.t('menu.dashboard'), 
                icon: 'pi pi-fw pi-home', 
                routerLink: ['/'],
                visible: !isAgent,
                class: 'menu-dashboard'
            },
            {
                label: this.i18n.t('menu.users'),
                icon: 'pi pi-fw pi-users',
                routerLink: ['/super-admin/users'],
                visible: !isAgent,
                class: 'menu-users'
            },
            {
                label: this.i18n.t('menu.leads'),
                icon: 'pi pi-fw pi-phone',
                routerLink: ['/leads'],
                class: 'menu-leads'
            },
            { 
                label: this.i18n.t('menu.chat'), 
                icon: 'pi pi-fw pi-comments', 
                routerLink: ['/chat'],
                class: 'menu-chat'
            },
            {
                label: this.i18n.t('menu.sales'),
                icon: 'pi pi-fw pi-shopping-cart',
                routerLink: ['/orders'],
                visible: !isAgent,
                class: 'menu-sales'
            },
            {
                label: this.i18n.t('menu.customers'),
                icon: 'pi pi-fw pi-id-card',
                routerLink: ['/customers'],
                visible: !isAgent,
                class: 'menu-customers'
            },
            {
                label: this.i18n.t('menu.buying_areas'),
                icon: 'pi pi-fw pi-map',
                routerLink: ['/buying-areas'],
                class: 'menu-areas'
            },
            { 
                label: this.i18n.t('menu.settings'), 
                icon: 'pi pi-fw pi-cog', 
                routerLink: ['/super-admin/settings'],
                visible: !isAgent,
                class: 'menu-settings'
            },
            { label: this.i18n.t('menu.logout'), icon: 'pi pi-fw pi-sign-out', command: () => this.authStore.logout(), class: 'menu-logout' }
        ];

        return [
            {
                label: isAgent ? this.i18n.t('menu.agent_portal') || 'Agent Portal' : this.i18n.t('menu.main'),
                separator: false,
                items: mainItems.filter(item => item.visible !== false)
            }
        ];
    });
}
