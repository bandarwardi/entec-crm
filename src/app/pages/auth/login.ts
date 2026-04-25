import { Component, inject, signal, effect, untracked, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthStore, UserStatus } from '../../core/stores/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import fpPromise from '@fingerprintjs/fingerprintjs';

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
                            @if (!store.isWaitingChallenge()) {
                                <div>
                                    <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2" [class.text-right]="i18n.isRTL()">{{ 'auth.email' | t }}</label>
                                    <input pInputText id="email" type="email" [placeholder]="'auth.email_placeholder' | t" class="w-full mb-4" [class.text-right]="i18n.isRTL()" [(ngModel)]="email" dir="ltr" />
                                </div>

                                <div>
                                    <label for="password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2" [class.text-right]="i18n.isRTL()">{{ 'auth.password' | t }}</label>
                                    <p-password id="password" [(ngModel)]="password" [placeholder]="'auth.password_placeholder' | t" [toggleMask]="true" styleClass="w-full mb-4" [fluid]="true" [feedback]="false" [inputStyleClass]="i18n.isRTL() ? 'text-right' : 'text-left'" dir="ltr"></p-password>
                                </div>

                                <p-button [label]="'auth.login_button' | t" styleClass="w-full py-3 text-xl font-bold" (onClick)="onLogin()" [loading]="store.loading()" [disabled]="!fingerprintId"></p-button>
                            } @else {
                                <div class="text-center py-6 flex flex-col items-center">
                                    <i class="pi pi-mobile text-primary text-6xl mb-4" style="animation: bounce 1.5s infinite"></i>
                                    <div class="text-xl font-bold mb-2">في انتظار تأكيدك</div>
                                    <div class="text-muted-color mb-6">يرجى فتح تطبيق الهاتف وتأكيد تسجيل الدخول عبر البصمة لإكمال العملية.</div>
                                    
                                    <p-button label="إلغاء الطلب" severity="secondary" styleClass="w-full" (onClick)="store.cancelChallenge()" [outlined]="true"></p-button>
                                </div>
                            }
                            
                             @if (store.error()) {
                                <div class="mt-4 p-4 rounded-2xl text-center space-y-2 border" 
                                     [class.bg-red-50]="!store.error()?.includes('طلب اعتماد')"
                                     [class.text-red-700]="!store.error()?.includes('طلب اعتماد')"
                                     [class.border-red-200]="!store.error()?.includes('طلب اعتماد')"
                                     [class.bg-emerald-50]="store.error()?.includes('طلب اعتماد')"
                                     [class.text-emerald-700]="store.error()?.includes('طلب اعتماد')"
                                     [class.border-emerald-200]="store.error()?.includes('طلب اعتماد')">
                                    <div class="font-bold flex items-center justify-center gap-2">
                                        <i class="pi" [class.pi-exclamation-circle]="!store.error()?.includes('طلب اعتماد')" [class.pi-info-circle]="store.error()?.includes('طلب اعتماد')" class="text-xl"></i>
                                        <span>{{ store.error() }}</span>
                                    </div>
                                    @if (store.error()?.includes('غير مصرح') || store.error()?.includes('طلب اعتماد')) {
                                        <div class="text-sm border-t pt-2 mt-2" [class.border-red-100]="!store.error()?.includes('طلب اعتماد')" [class.border-emerald-100]="store.error()?.includes('طلب اعتماد')">
                                            <p class="mb-2 opacity-80">معرف هذا الجهاز الحالي (للإدارة):</p>
                                            <div class="bg-white/50 p-2 rounded-xl font-mono text-xs break-all select-all border" [class.border-red-100]="!store.error()?.includes('طلب اعتماد')" [class.border-emerald-100]="store.error()?.includes('طلب اعتماد')">
                                                {{ fingerprintId }}
                                            </div>
                                        </div>
                                    }
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
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
        }
    `]
})
export class Login implements OnInit {
    email = '';
    password = '';

    readonly store = inject(AuthStore);
    private router = inject(Router);
    i18n = inject(I18nService);

    fingerprintId = '';
    location = signal<{lat: number, lng: number} | null>(null);

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

    private route = inject(ActivatedRoute);

    async ngOnInit() {
        // Try to recover a previously generated stable fingerprint
        const storedFp = localStorage.getItem('stable_device_fp');
        if (storedFp) {
            this.fingerprintId = storedFp;
            console.log('[Login] Using stored stable fingerprint:', this.fingerprintId);
        }

        // Force button activation after 1.5s no matter what
        setTimeout(() => {
            if (!this.fingerprintId) {
                console.warn('[Login] Security init timeout - forcing stable fallback');
                this.fingerprintId = 'stable-gen-' + Math.random().toString(36).substring(7);
                localStorage.setItem('stable_device_fp', this.fingerprintId);
            }
        }, 1500);

        // Check for magic link / auto-login from Desktop App
        const params = this.route.snapshot.queryParams as any;
        if (params['token'] && params['user']) {
            try {
                const user = JSON.parse(decodeURIComponent(params['user']));
                this.store.setToken(params['token'], user);
                // Also store magic link timestamp to prevent immediate presence kick
                localStorage.setItem('last_login_timestamp', Date.now().toString());
                return;
            } catch (e) {
                console.error('Failed to parse auto-login data', e);
            }
        }

        try {
            const fp = await fpPromise.load();
            const result = await fp.get();
            if (result.visitorId) {
                this.fingerprintId = result.visitorId;
                localStorage.setItem('stable_device_fp', this.fingerprintId);
            } else if (!this.fingerprintId) {
                this.fingerprintId = 'stable-fallback-' + Math.random().toString(36).substring(7);
                localStorage.setItem('stable_device_fp', this.fingerprintId);
            }
        } catch (err) {
            console.error('Failed to generate fingerprint', err);
            if (!this.fingerprintId) {
                this.fingerprintId = 'stable-err-' + Math.random().toString(36).substring(7);
                localStorage.setItem('stable_device_fp', this.fingerprintId);
            }
        }
    }

    onLogin() {
        if (!this.email || !this.password || !this.fingerprintId) return;

        const parser = navigator.userAgent; // For simplicitiy, pass userAgent
        
        this.store.login({
            email: this.email,
            password: this.password,
            deviceFingerprint: this.fingerprintId,
            browserInfo: parser,
            latitude: this.location()?.lat,
            longitude: this.location()?.lng
        } as any);
    }
}


