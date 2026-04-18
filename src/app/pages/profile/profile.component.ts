import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FileUploadModule } from 'primeng/fileupload';
import { AuthStore } from '../../core/stores/auth.store';
import { HttpClient } from '@angular/common/http';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { API_BASE_URL, UPLOADS_URL } from '../../core/constants/api.constants';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, ButtonModule, PasswordModule, FileUploadModule, TranslatePipe],
  template: `
    <div class="flex flex-col gap-4 font-tajawal">
      <div class="text-2xl font-bold dark:text-slate-100">{{ 'profile.title' | t }}</div>
      
      <p-card>
        <div class="flex flex-col md:flex-row gap-8">
          <!-- Avatar Section -->
          <div class="flex flex-col items-center gap-4">
            <div class="w-32 h-32 rounded-full border-4 border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              @if (user()?.avatar) {
                <img [src]="user()?.avatar.startsWith('http') ? user()?.avatar : (uploadsUrl + '/' + user()?.avatar)" alt="Avatar" class="w-full h-full object-cover">
              } @else {
                <i class="pi pi-user text-6xl text-slate-400"></i>
              }
            </div>
            
            <p-fileupload 
              mode="basic" 
              name="file" 
              [url]="apiBaseUrl + '/users/avatar'" 
              accept="image/*" 
              [auto]="true" 
              [chooseLabel]="'profile.change_avatar' | t" 
              chooseIcon="pi pi-upload"
              class="w-full"
              (onUpload)="onUploadSuccess($event)"
              (onBeforeSend)="onBeforeSend($event)"
              [withCredentials]="true">
              <ng-template pTemplate="header" let-chooseCallback="chooseCallback">
                <button pButton type="button" [label]="'profile.change_avatar' | t" icon="pi pi-upload" class="p-button-outlined" (click)="chooseCallback()"></button>
              </ng-template>
            </p-fileupload>
          </div>

          <!-- Vertical Divider -->
          <div class="hidden md:block w-px bg-slate-200 dark:bg-slate-700"></div>

          <!-- Details Section -->
          <div class="flex-1 flex flex-col gap-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label class="font-bold dark:text-slate-300">{{ 'profile.name' | t }}</label>
                <input pInputText [value]="user()?.name" readonly class="bg-slate-50 dark:bg-slate-800 cursor-not-allowed dark:text-slate-100 dark:border-slate-700" [class.text-right]="i18n.isRTL()" [class.text-left]="!i18n.isRTL()" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="font-bold dark:text-slate-300">{{ 'profile.email' | t }}</label>
                <input pInputText [value]="user()?.email" readonly class="bg-slate-50 dark:bg-slate-800 cursor-not-allowed dark:text-slate-100 dark:border-slate-700" [class.text-right]="i18n.isRTL()" [class.text-left]="!i18n.isRTL()" />
              </div>
            </div>

            <div class="border-t border-slate-200 dark:border-slate-700 pt-6 mt-4">
              <h3 class="text-xl font-bold mb-4 dark:text-slate-100">{{ 'profile.change_password' | t }}</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <label class="font-bold dark:text-slate-300">{{ 'profile.new_password' | t }}</label>
                  <p-password [(ngModel)]="newPassword" [toggleMask]="true" [placeholder]="'profile.new_password_placeholder' | t" [feedback]="false" styleClass="w-full" [inputStyleClass]="'w-full dark:text-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 ' + (i18n.isRTL() ? 'text-right' : 'text-left')"></p-password>
                </div>
                <div class="flex items-end">
                  <button pButton [label]="'profile.save_password' | t" icon="pi pi-check" [loading]="saving()" (click)="savePassword()" class="w-full md:w-auto" [disabled]="!newPassword"></button>
                </div>
              </div>
              @if (message()) {
                <div class="mt-4 p-3 rounded" [class.bg-green-100]="messageType() === 'success'" [class.text-green-800]="messageType() === 'success'" [class.bg-red-100]="messageType() === 'error'" [class.text-red-800]="messageType() === 'error'">
                  {{ message() }}
                </div>
              }
            </div>
          </div>
        </div>
      </p-card>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  authStore = inject(AuthStore);
  http = inject(HttpClient);
  i18n = inject(I18nService);
  
  user = signal<any>(null);
  newPassword = '';
  saving = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  apiBaseUrl = API_BASE_URL;
  uploadsUrl = UPLOADS_URL;

  ngOnInit() {
    this.user.set(this.authStore.user());
  }

  onBeforeSend(event: any) {
    event.xhr.setRequestHeader('Authorization', 'Bearer ' + this.authStore.token());
  }

  onUploadSuccess(event: any) {
    if (event.originalEvent && event.originalEvent.body) {
      const response = event.originalEvent.body;
      const updatedUser = { ...this.user(), avatar: response.avatar };
      this.user.set(updatedUser);
      // We should potentially update the auth store user object too to reflect avatar globally
      localStorage.setItem('user', JSON.stringify(updatedUser));
      this.message.set(this.i18n.t('profile.avatar_success'));
      this.messageType.set('success');
    }
  }

  savePassword() {
    if (!this.newPassword) return;
    this.saving.set(true);
    
    this.http.put(`${API_BASE_URL}/users/change-password`, { password: this.newPassword }).subscribe({
      next: () => {
        this.saving.set(false);
        this.message.set(this.i18n.t('profile.password_success'));
        this.messageType.set('success');
        this.newPassword = '';
      },
      error: () => {
        this.saving.set(false);
        this.message.set(this.i18n.t('profile.password_error'));
        this.messageType.set('error');
      }
    });
  }
}
