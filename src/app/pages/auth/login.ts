import { Component, inject, signal, effect, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthStore, UserStatus } from '../../core/stores/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
    selector: 'app-login',
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, TranslatePipe],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden font-tajawal">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-12 px-8 sm:px-20 shadow-2xl" style="border-radius: 53px; min-width: 400px;">
                        <div class="text-center mb-8">
                            <div class="text-primary text-5xl font-bold mb-4">EN-TEC CRM</div>
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">{{ 'auth.welcome' | t }}</div>
                            <span class="text-muted-color font-medium">{{ 'auth.login_subtitle' | t }}</span>
                        </div>

                        <div class="flex flex-col gap-4">
                            <div>
                                <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2" [class.text-right]="i18n.isRTL()">{{ 'auth.email' | t }}</label>
                                <input pInputText id="email" type="email" [placeholder]="'auth.email_placeholder' | t" class="w-full mb-4" [class.text-right]="i18n.isRTL()" [(ngModel)]="email" dir="ltr" />
                            </div>

                            <div>
                                <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2" [class.text-right]="i18n.isRTL()">{{ 'auth.password' | t }}</label>
                                <p-password id="password" [(ngModel)]="password" [placeholder]="'auth.password_placeholder' | t" [toggleMask]="true" styleClass="w-full mb-4" [fluid]="true" [feedback]="false" [inputStyleClass]="i18n.isRTL() ? 'text-right' : 'text-left'" dir="ltr"></p-password>
                            </div>

                            <p-button [label]="'auth.login_button' | t" styleClass="w-full py-3 text-xl font-bold" (onClick)="onLogin()" [loading]="store.loading()"></p-button>
                            
                            @if (store.error()) {
                                <div class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-center font-bold">
                                    {{ store.error() }}
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .font-tajawal {
            font-family: 'Tajawal', sans-serif !important;
        }
        :host ::ng-deep .p-password input {
            width: 100%;
        }
    `]
})
export class Login {
    email = '';
    password = '';

    readonly store = inject(AuthStore);
    private router = inject(Router);
    i18n = inject(I18nService);

    constructor() {
        // Use effect to navigate on login success
        effect(() => {
            if (this.store.isLoggedIn()) {
                const user = this.store.user();
                if (user) {
                    untracked(() => {
                        // Set status to online immediately after login
                        this.store.updateStatus({ status: UserStatus.ONLINE });

                        if (user.role === 'super-admin') {
                            this.router.navigate(['/super-admin/users']);
                        } else if (user.role === 'agent') {
                            this.router.navigate(['/leads']);
                        } else {
                            this.router.navigate(['/']);
                        }
                    });
                }
            }
        });
    }

    onLogin() {
        if (!this.email || !this.password) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    this.store.login({
                        email: this.email,
                        password: this.password,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        device: navigator.userAgent
                    });
                },
                (err) => {
                    this.store.setError(this.i18n.t('auth.location_error'));
                }
            );
        } else {
            this.store.setError(this.i18n.t('auth.browser_error'));
        }
    }
}


