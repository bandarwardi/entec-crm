import { Component, inject, signal, effect, untracked, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthStore, UserStatus } from '../../core/stores/auth.store';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import fpPromise from '@fingerprintjs/fingerprintjs';

@Component({
    selector: 'app-login',
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, TranslatePipe],
    template: `
        <div class="relative min-h-screen flex items-center justify-center font-tajawal overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
            <!-- Abstract Background Elements -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 dark:bg-primary/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob"></div>
                <div class="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-500/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000"></div>
                <div class="absolute -bottom-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-teal-400/10 dark:bg-teal-500/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000"></div>
            </div>

            <!-- Login Container -->
            <div class="relative z-10 flex w-full max-w-5xl mx-auto rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-white/60 dark:bg-surface-900/60 backdrop-blur-2xl border border-white/40 dark:border-white/10 m-4 sm:m-8">
                
                <!-- Left Side: Branding / Info (Hidden on Mobile) -->
                <div class="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-primary/95 to-indigo-900/95 text-white relative overflow-hidden shadow-inner">
                    <!-- Subtle pattern overlay -->
                    <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
                    
                    <div class="relative z-10 flex items-center gap-4 mb-12">
                        <div class="p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            <img src="assets/imgs/logo.jpeg" alt="EN-TEC" class="w-12 h-12 rounded-lg" />
                        </div>
                        <span class="text-2xl font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">EN-TEC CRM</span>
                    </div>
                    
                    <div class="relative z-10 flex-grow flex flex-col justify-center">
                        <h1 class="text-4xl lg:text-5xl font-extrabold leading-tight mb-6 text-right animate-fadeinup" style="line-height: 1.4;">
                            أهلاً بك في <br /> <span class="text-blue-300">بوابة الموظفين</span>
                        </h1>
                        <p class="text-blue-100/90 text-lg leading-relaxed max-w-md text-right animate-fadeinup" style="animation-delay: 150ms">
                            قم بإدارة المبيعات والعملاء بكفاءة وسرعة. نوفر لك أفضل الأدوات لضمان أعلى مستوى من الإنتاجية والأمان.
                        </p>
                    </div>
                    
                    <div class="relative z-10 mt-auto pt-12 animate-fadeinup" style="animation-delay: 300ms">
                        <div class="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 shadow-inner">
                                <i class="pi pi-shield text-xl text-teal-300"></i>
                            </div>
                            <div class="text-right flex-grow">
                                <div class="font-bold text-lg">نظام آمن ومحمي</div>
                                <div class="text-sm text-blue-200/80">الوصول مقيد بصلاحيات ومراقب بالكامل</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side: Login Form -->
                <div class="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 relative flex flex-col justify-center">
                    <div class="max-w-[400px] mx-auto w-full">
                        <!-- Mobile Logo -->
                        <div class="lg:hidden flex items-center justify-center gap-4 mb-10">
                            <div class="p-1 bg-primary/10 rounded-xl">
                                <img src="assets/imgs/logo.jpeg" alt="EN-TEC" class="w-12 h-12 rounded-lg shadow-sm" />
                            </div>
                            <span class="text-3xl font-black tracking-widest text-primary uppercase">EN-TEC</span>
                        </div>

                        <div class="text-right mb-12">
                            <h2 class="text-3xl sm:text-4xl font-bold text-surface-900 dark:text-surface-0 mb-3">{{ 'auth.welcome' | t }}</h2>
                            <p class="text-surface-500 dark:text-surface-400 text-lg">{{ 'auth.login_subtitle' | t }}</p>
                        </div>

                        <div class="flex flex-col gap-6">
                            @if (!store.isWaitingChallenge()) {
                                <div class="flex flex-col gap-2 relative group">
                                    <label for="email" class="text-sm font-bold text-surface-700 dark:text-surface-200 text-right block mb-1">{{ 'auth.email' | t }}</label>
                                    <div class="relative">
                                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary transition-colors z-10">
                                            <i class="pi pi-envelope text-lg"></i>
                                        </span>
                                        <input pInputText id="email" type="email" [placeholder]="'auth.email_placeholder' | t" class="w-full pl-12 pr-4 py-3.5 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all shadow-sm" dir="ltr" [(ngModel)]="email" />
                                    </div>
                                </div>

                                <div class="flex flex-col gap-2 relative group">
                                    <label for="password" class="text-sm font-bold text-surface-700 dark:text-surface-200 text-right block mb-1">{{ 'auth.password' | t }}</label>
                                    <p-password id="password" [(ngModel)]="password" [placeholder]="'auth.password_placeholder' | t" [toggleMask]="true" styleClass="w-full" [fluid]="true" [feedback]="false" inputStyleClass="w-full py-3.5 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all shadow-sm text-left px-4" dir="ltr"></p-password>
                                </div>

                                <p-button [label]="'auth.login_button' | t" styleClass="w-full py-4 mt-6 rounded-xl text-lg font-bold shadow-[0_8px_20px_-6px_rgba(var(--primary-color-rgb),0.6)] hover:shadow-[0_12px_24px_-6px_rgba(var(--primary-color-rgb),0.8)] transition-all duration-300 hover:-translate-y-1 active:translate-y-0" (onClick)="onLogin()" [loading]="store.loading()" [disabled]="!fingerprintId"></p-button>
                            } @else {
                                <div class="text-center py-8 flex flex-col items-center bg-surface-50 dark:bg-surface-800/50 rounded-3xl border border-surface-200 dark:border-surface-700">
                                    <div class="relative w-24 h-24 mb-6 flex items-center justify-center">
                                        <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                                        <div class="relative bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                                            <i class="pi pi-mobile text-3xl animate-bounce"></i>
                                        </div>
                                    </div>
                                    <div class="text-2xl font-bold mb-3 text-surface-900 dark:text-surface-0">في انتظار تأكيدك</div>
                                    <div class="text-surface-500 dark:text-surface-400 mb-8 px-6 leading-relaxed">يرجى فتح تطبيق الهاتف وتأكيد تسجيل الدخول عبر البصمة لإكمال العملية.</div>
                                    
                                    <p-button label="إلغاء الطلب" severity="secondary" styleClass="w-full py-3 rounded-xl font-bold" (onClick)="store.cancelChallenge()" [outlined]="true" icon="pi pi-times"></p-button>
                                </div>
                            }
                            
                            @if (store.error()) {
                                <div class="mt-2 p-4 rounded-xl text-center border shadow-sm transition-all animate-fadein" 
                                     [class.bg-red-50]="!store.error()?.includes('طلب اعتماد')"
                                     [class.text-red-700]="!store.error()?.includes('طلب اعتماد')"
                                     [class.border-red-200]="!store.error()?.includes('طلب اعتماد')"
                                     [class.dark:bg-red-900/20]="!store.error()?.includes('طلب اعتماد')"
                                     [class.dark:border-red-800]="!store.error()?.includes('طلب اعتماد')"
                                     [class.dark:text-red-400]="!store.error()?.includes('طلب اعتماد')"
                                     [class.bg-emerald-50]="store.error()?.includes('طلب اعتماد')"
                                     [class.text-emerald-700]="store.error()?.includes('طلب اعتماد')"
                                     [class.border-emerald-200]="store.error()?.includes('طلب اعتماد')"
                                     [class.dark:bg-emerald-900/20]="store.error()?.includes('طلب اعتماد')"
                                     [class.dark:border-emerald-800]="store.error()?.includes('طلب اعتماد')"
                                     [class.dark:text-emerald-400]="store.error()?.includes('طلب اعتماد')">
                                    <div class="font-bold flex items-center justify-center gap-2">
                                        <i class="pi" [class.pi-exclamation-circle]="!store.error()?.includes('طلب اعتماد')" [class.pi-info-circle]="store.error()?.includes('طلب اعتماد')" class="text-xl"></i>
                                        <span>{{ store.error() }}</span>
                                    </div>
                                    @if (store.error()?.includes('غير مصرح') || store.error()?.includes('طلب اعتماد')) {
                                        <div class="text-xs border-t pt-3 mt-3 opacity-80" [class.border-red-200]="!store.error()?.includes('طلب اعتماد')" [class.border-emerald-200]="store.error()?.includes('طلب اعتماد')">
                                            <p class="mb-2">معرف هذا الجهاز الحالي (للإدارة):</p>
                                            <div class="bg-white/50 dark:bg-black/20 p-2 rounded-lg font-mono text-xs break-all select-all border shadow-inner" [class.border-red-200]="!store.error()?.includes('طلب اعتماد')" [class.border-emerald-200]="store.error()?.includes('طلب اعتماد')">
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
        
        /* Custom Animations */
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
            animation: blob 7s infinite;
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        .animation-delay-4000 {
            animation-delay: 4s;
        }
        
        @keyframes fadeinup {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeinup {
            animation: fadeinup 0.8s ease-out forwards;
            opacity: 0;
        }
        
        @keyframes fadein {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        .animate-fadein {
            animation: fadein 0.4s ease-out forwards;
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


