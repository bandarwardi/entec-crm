import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { AuthStore } from './app/core/stores/auth.store';

@Component({
    selector: 'app-root',
    imports: [RouterModule, ToastModule],
    template: `
        <p-toast></p-toast>
        <router-outlet></router-outlet>
    `
})
export class AppComponent implements OnInit {
    private authStore = inject(AuthStore);

    ngOnInit() {
        this.authStore.init();
    }
}
