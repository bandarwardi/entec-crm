import { Component, inject, OnInit, signal, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { FieldsetModule } from 'primeng/fieldset';
import { StepperModule } from 'primeng/stepper';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { SalesService, OrderType } from '../../core/services/sales.service';
import { UserService, User } from '../../core/services/user.service';
import { OrdersStore } from '../../core/stores/orders.store';
import { CustomersStore } from '../../core/stores/customers.store';
import { MessageService } from 'primeng/api';
import { effect } from '@angular/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { API_BASE_URL } from '../../core/constants/api.constants';
import { COUNTRIES } from '../../core/constants/countries.constants';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, RouterModule,
    ButtonModule, InputTextModule, SelectModule, DatePickerModule,
    InputNumberModule, TextareaModule, SelectButtonModule,
    AutoCompleteModule, FieldsetModule, StepperModule, TooltipModule,
    ToastModule, TranslatePipe, FileUploadModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="card font-tajawal max-w-5xl mx-auto shadow-2xl overflow-hidden border-0 rounded-[2.5rem] dark:bg-surface-900 transition-all hover:shadow-2xl">
      <!-- Gradient Header -->
      <div class="bg-gradient-to-br from-emerald-600 to-teal-500 p-8 sm:p-10">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shadow-inner border border-white/20">
            <i class="pi pi-file-edit text-3xl font-bold"></i>
          </div>
          <div>
            <h1 class="text-3xl font-black m-0 text-white tracking-tight">{{ isEdit ? ('order_form.edit_title' | t) : ('order_form.create_title' | t) }}</h1>
            <p class="text-emerald-50/80 font-bold text-xs uppercase tracking-widest mt-1">{{ 'order_form.subtitle' | t }}</p>
          </div>
        </div>
      </div>

      <form [formGroup]="orderForm" (ngSubmit)="onSubmit()" class="p-8">
        
        <!-- Section 1: Customer Data -->
        <div class="mb-10">
            <h3 class="text-xl font-black mb-6 pb-3 border-b border-surface-100 dark:border-surface-800 text-surface-900 dark:text-surface-0 flex items-center gap-3">
                <div class="w-8 h-8 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center"><i class="pi pi-user text-sm"></i></div>
                {{ 'order_form.customer_data' | t }}
            </h3>
            
            @if (isEdit) {
                <!-- Order Detail Style for Edit Mode -->
                <div class="bg-surface-50/50 dark:bg-surface-800/40 p-8 rounded-[2rem] border border-surface-100 dark:border-surface-700/50 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <label class="text-[10px] font-black uppercase text-surface-400 dark:text-surface-500 mb-2 block tracking-widest">{{ 'order_form.full_name' | t }}</label>
                        <p class="text-2xl font-black text-surface-900 dark:text-surface-0 tracking-tight">{{ orderForm.get('existingCustomer')?.value?.name }}</p>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-surface-400 dark:text-surface-500 mb-2 block tracking-widest">{{ 'order_form.phone' | t }}</label>
                        <p class="text-xl font-mono font-black text-emerald-600 tracking-tighter" dir="ltr">{{ orderForm.get('existingCustomer')?.value?.phone }}</p>
                    </div>
                    <div>
                        <label class="text-[10px] font-black uppercase text-surface-400 dark:text-surface-500 mb-2 block tracking-widest">{{ 'order_form.email' | t }}</label>
                        <p class="text-surface-600 dark:text-surface-300 font-medium">{{ orderForm.get('existingCustomer')?.value?.email || ('ui.not_available' | t) }}</p>
                    </div>
                </div>
            } @else {
                <!-- New Form Style for Creation Mode -->
                <div class="flex gap-4 mb-6">
                    <p-selectButton [options]="customerTypeOptions()" formControlName="customerType" (onChange)="onCustomerTypeChange()" 
                      styleClass="w-full md:w-auto p-1 bg-surface-100 dark:bg-surface-800 rounded-xl"
                      [allowEmpty]="false"></p-selectButton>
                </div>

                <div class="p-8 bg-surface-50/50 dark:bg-surface-800/20 rounded-[2rem] border border-surface-100 dark:border-surface-800 shadow-inner">
                    @if (orderForm.get('customerType')?.value === 'existing') {
                        <div class="flex flex-col gap-3">
                            <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2">{{ 'order_form.search_customer_placeholder' | t }}</label>
                            <p-autoComplete formControlName="existingCustomer" 
                                          [suggestions]="filteredCustomers()" 
                                          (completeMethod)="searchCustomers($event)"
                                          optionLabel="name" [dropdown]="true" [placeholder]="'order_form.search_customer_input' | t"
                                          class="w-full"
                                          styleClass="w-full" 
                                          inputStyleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 h-12 px-6"></p-autoComplete>
                        </div>
                    }

                    @if (orderForm.get('customerType')?.value === 'new') {
                        <div formGroupName="newCustomer" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="col-span-1 md:col-span-2">
                                <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2 mb-1 block">{{ 'order_form.full_name' | t }} *</label>
                                <input pInputText formControlName="name" class="w-full h-12 rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-6 font-bold" [placeholder]="'order_form.full_name_placeholder' | t" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2 mb-1 block">{{ 'order_form.phone' | t }} *</label>
                                <input pInputText formControlName="phone" dir="ltr" class="w-full h-12 rounded-xl font-mono dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-6 font-black text-emerald-600 text-right" placeholder="100-200-3000" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2 mb-1 block">{{ 'order_form.email' | t }}</label>
                                <input pInputText formControlName="email" class="w-full h-12 rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-6" [placeholder]="'order_form.email_placeholder' | t" />
                            </div>
                            <div class="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div class="md:col-span-2">
                                    <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2 mb-1 block">{{ 'order_form.address' | t }}</label>
                                    <input pInputText formControlName="address" class="w-full h-12 rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-6" [placeholder]="'order_form.address_placeholder' | t" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2 mb-1 block">{{ 'order_form.country' | t }}</label>
                                    <p-select [options]="countries" formControlName="country" 
                                             [filter]="true" filterBy="label" optionLabel="label" optionValue="value"
                                             [placeholder]="'Select Country'" appendTo="body"
                                             styleClass="w-full h-12 rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-4 flex items-center"></p-select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black uppercase text-surface-400 tracking-widest ml-2 mb-1 block">{{ 'order_form.state' | t }}</label>
                                    <input pInputText formControlName="state" class="w-full h-12 rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-6" [placeholder]="'order_form.state_placeholder' | t" />
                                </div>
                                <div class="col-span-full">
                                    <p-button [label]="'order_form.auto_location_button' | t" icon="pi pi-map-marker" 
                                             (onClick)="fetchGeocoding()" [loading]="isGeocoding" 
                                             styleClass="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30 rounded-xl font-bold"></p-button>
                                    @if (orderForm.get('newCustomer.latitude')?.value) {
                                        <div class="text-[10px] font-black mt-2 text-emerald-600/60 uppercase tracking-widest ml-2">
                                            <i class="pi pi-check-circle mr-1"></i> {{ 'order_form.coords_received' | t }}: {{ orderForm.get('newCustomer.latitude')?.value }}, {{ orderForm.get('newCustomer.longitude')?.value }}
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                </div>
            }
        </div>

        <!-- Section 2: Order Details -->
        <div class="mb-10">
            <h3 class="text-xl font-black mb-6 pb-3 border-b border-surface-100 dark:border-surface-800 text-surface-900 dark:text-surface-0 flex items-center gap-3">
              <div class="w-8 h-8 bg-teal-500/10 text-teal-600 rounded-lg flex items-center justify-center"><i class="pi pi-info-circle text-sm"></i></div>
              {{ 'order_form.order_details' | t }}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.lead_agent' | t }}</label>
                    <p-select [options]="users()" formControlName="leadAgentId" optionLabel="name" optionValue="id" 
                               [filter]="true" [placeholder]="'order_form.select_agent_placeholder' | t" styleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800"></p-select>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.closer_agent' | t }}</label>
                    <p-select [options]="users()" formControlName="closerAgentId" optionLabel="name" optionValue="id" 
                               [filter]="true" [placeholder]="'order_form.select_agent_placeholder' | t" styleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800"></p-select>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.order_type' | t }}</label>
                    <p-select [options]="typeOptions()" formControlName="type" optionLabel="label" optionValue="value" styleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800"></p-select>
                </div>
                @if (isEdit) {
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.status.label' | t }}</label>
                        <p-select [options]="statusOptions()" formControlName="status" optionLabel="label" optionValue="value" styleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800"></p-select>
                    </div>
                }
                @if (orderForm.get('type')?.value === 'referral') {
                    <div class="col-span-full flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.referrer_name' | t }}</label>
                        <input pInputText formControlName="referrerName" class="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 border-teal-500/30" [placeholder]="'order_form.referrer_name' | t" />
                    </div>
                }
            </div>
        </div>

        <!-- Section 3: Payment & Tech -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <!-- Financial Card -->
            <div class="p-8 rounded-[2.5rem] bg-gradient-to-br from-surface-50 to-white dark:from-surface-800/20 dark:to-surface-900/20 border border-surface-200 dark:border-surface-800 shadow-xl relative overflow-hidden">
                <div class="absolute top-0 end-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[4rem]"></div>
                <h4 class="text-md font-black mb-6 text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <i class="pi pi-dollar text-emerald-600"></i> {{ 'order_form.financial_data' | t }}
                </h4>
                <div class="space-y-6">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.total_amount' | t }} *</label>
                        <p-inputNumber formControlName="amount" mode="currency" currency="USD" locale="en-US" styleClass="w-full" 
                          inputStyleClass="w-full rounded-xl text-3xl font-black text-emerald-600 dark:bg-surface-950 dark:border-surface-800 px-6 h-16 shadow-inner tracking-tighter"></p-inputNumber>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.payment_method' | t }}</label>
                        <p-select appendTo="body" [options]="paymentOptions()" formControlName="paymentMethod" optionLabel="label" optionValue="value" styleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 py-1 px-4"></p-select>
                    </div>
                </div>
            </div>

            <!-- Tech Details Card -->
            <div class="p-8 rounded-[2.5rem] bg-gradient-to-br from-surface-50 to-white dark:from-surface-800/20 dark:to-surface-900/20 border border-surface-200 dark:border-surface-800 shadow-xl relative overflow-hidden font-medium">
                <div class="absolute top-0 end-0 w-32 h-32 bg-teal-500/5 rounded-bl-[4rem]"></div>
                <h4 class="text-md font-black mb-6 text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                   <i class="pi pi-server text-teal-600"></i> {{ 'order_form.tech_data' | t }}
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.server_name' | t }}</label>
                        <input pInputText formControlName="serverName" class="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-4 py-2" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.server_expiry' | t }}</label>
                        <p-datepicker formControlName="serverExpiryDate" styleClass="w-full" inputStyleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-4 py-2" [fluid]="true" appendTo="body"></p-datepicker>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.app_type' | t }}</label>
                        <input pInputText formControlName="appType" class="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-4 py-2" />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.app_years' | t }}</label>
                        <p-inputNumber formControlName="appYears" styleClass="w-full" inputStyleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-4 py-2" [showButtons]="true"></p-inputNumber>
                    </div>
                    <div class="col-span-1 md:col-span-2 flex flex-col gap-1">
                        <label class="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-2">{{ 'order_form.app_expiry' | t }}</label>
                        <p-datepicker formControlName="appExpiryDate" styleClass="w-full" inputStyleClass="w-full rounded-xl dark:bg-surface-950 dark:border-surface-800 dark:text-surface-0 px-4 py-2" [fluid]="true" appendTo="body"></p-datepicker>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section: Invoice File -->
        <div class="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-surface-50 to-white dark:from-surface-800/20 dark:to-surface-900/20 border border-surface-200 dark:border-surface-800 shadow-xl relative overflow-hidden">
            <div class="absolute top-0 end-0 w-32 h-32 bg-purple-500/5 rounded-bl-[4rem]"></div>
            <h4 class="text-md font-black mb-6 text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <i class="pi pi-file-pdf text-purple-600"></i> الفاتورة المرفقة (ترسل للعميل)
            </h4>
            <div class="grid grid-cols-1 gap-4 z-10 relative">
                <p-fileupload name="file" [url]="uploadUrl" [multiple]="false" accept="application/pdf,image/*" maxFileSize="10000000"
                              (onUpload)="onInvoiceUploadComplete($event)" (onError)="onUploadError($event)"
                              [chooseLabel]="'ui.choose_files' | t" [uploadLabel]="'ui.upload' | t" [cancelLabel]="'ui.cancel' | t"
                              [auto]="true" [withCredentials]="true">
                    <ng-template pTemplate="content">
                        @if (!orderForm.value.invoiceFile) {
                           <div class="p-8 flex items-center justify-center border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl text-surface-400">
                               <i class="pi pi-cloud-upload text-4xl mr-4"></i>
                               <span>اسحب ملف الفاتورة هنا أو اضغط لاختيار ملف (PDF او صورة)</span>
                           </div>
                        }
                        @if (orderForm.value.invoiceFile) {
                           <div class="mt-4 flex items-center p-4 bg-surface-100 dark:bg-surface-800 rounded-xl justify-between border border-purple-200 dark:border-purple-900">
                               <div class="flex items-center gap-3">
                                  <i class="pi pi-file-pdf text-3xl text-red-500"></i>
                                  <span class="font-bold text-surface-700 dark:text-surface-200 truncate max-w-xs">فاتورة مرفقة</span>
                               </div>
                               <div class="flex items-center gap-2">
                                  <a [href]="orderForm.value.invoiceFile" target="_blank" class="p-button p-button-outlined p-button-sm p-button-secondary rounded-full">
                                    <i class="pi pi-external-link"></i>
                                  </a>
                                  <button type="button" class="p-button p-button-danger p-button-sm rounded-full" (click)="removeInvoiceFile()">
                                      <i class="pi pi-times"></i>
                                  </button>
                               </div>
                           </div>
                        }
                    </ng-template>
                </p-fileupload>
            </div>
        </div>

        <!-- Section: Attachments -->
        <div class="mb-8 p-8 rounded-[2.5rem] bg-gradient-to-br from-surface-50 to-white dark:from-surface-800/20 dark:to-surface-900/20 border border-surface-200 dark:border-surface-800 shadow-xl relative overflow-hidden">
            <div class="absolute top-0 end-0 w-32 h-32 bg-blue-500/5 rounded-bl-[4rem]"></div>
            <h4 class="text-md font-black mb-6 text-surface-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <i class="pi pi-paperclip text-blue-600"></i> {{ 'order_form.attachments' | t }}
            </h4>
            <div class="grid grid-cols-1 gap-4 z-10 relative">
                <p-fileupload name="file" [url]="uploadUrl" [multiple]="true" accept="image/*" maxFileSize="10000000"
                              (onUpload)="onUploadComplete($event)" (onError)="onUploadError($event)"
                              [chooseLabel]="'ui.choose_files' | t" [uploadLabel]="'ui.upload' | t" [cancelLabel]="'ui.cancel' | t"
                              [auto]="true" [withCredentials]="true">
                    <ng-template pTemplate="content">
                        @if (!orderForm.value.attachments?.length) {
                           <div class="p-8 flex items-center justify-center border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl text-surface-400">
                               <i class="pi pi-cloud-upload text-4xl mr-4"></i>
                               <span>{{ 'order_form.drag_drop_hint' | t }}</span>
                           </div>
                        }
                        @if (orderForm.value.attachments?.length) {
                           <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                               @for (url of orderForm.value.attachments; track i; let i = $index) {
                                   <div class="relative bg-surface-100 dark:bg-surface-800 rounded-xl overflow-hidden shadow group">
                                       <img [src]="url" alt="Uploaded Attachment" class="w-full h-24 object-cover" />
                                       <button type="button" class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" (click)="removeAttachment(i)">
                                          <i class="pi pi-times text-sm"></i>
                                       </button>
                                   </div>
                               }
                           </div>
                        }
                    </ng-template>
                </p-fileupload>
            </div>
        </div>

        <!-- القسم الرابع: الأجهزة -->
        <div class="mb-8 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-2xl overflow-hidden shadow-sm">
            <div class="p-5 bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <i class="pi pi-desktop text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0">{{ 'order_form.devices_section' | t }}</h3>
                        <p class="text-sm text-surface-500 dark:text-surface-400">{{ 'order_form.devices_desc' | t }}</p>
                    </div>
                </div>
                <p-button [label]="'order_form.add_device_button' | t" icon="pi pi-plus" (onClick)="addDevice()" 
                          styleClass="p-button-outlined p-button-sm rounded-lg font-bold"></p-button>
            </div>
            
            <div formArrayName="devices" class="p-5 space-y-4">
                @for (device of devices.controls; track i; let i = $index) {
                    <div [formGroupName]="i" 
                         class="bg-surface-50/50 dark:bg-surface-800/30 p-6 rounded-2xl border border-surface-100 dark:border-surface-700 hover:border-primary/30 transition-all relative">
                        
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="flex-1">
                                <label class="text-xs font-bold uppercase text-surface-400 dark:text-surface-500 mb-2 block tracking-widest">{{ 'order_form.device_mac' | t }}</label>
                                <div class="p-inputgroup">
                                    <input pInputText formControlName="macAddress" 
                                           class="w-full p-inputtext-sm font-mono border-surface-300 dark:bg-surface-900 dark:border-surface-700 dark:text-surface-0 focus:border-primary" 
                                           placeholder="00:00:00:00" />
                                </div>
                            </div>
                            <div class="flex-1">
                                <label class="text-xs font-bold uppercase text-surface-400 dark:text-surface-500 mb-2 block tracking-widest">{{ 'order_form.device_key' | t }}</label>
                                <div class="p-inputgroup">
                                    <input pInputText formControlName="deviceKey" 
                                           class="w-full p-inputtext-sm font-mono border-surface-300 dark:bg-surface-900 dark:border-surface-700 dark:text-surface-0 focus:border-primary" 
                                           placeholder="KEY-123" />
                                </div>
                            </div>
                            <div class="flex-[2]">
                                <label class="text-xs font-bold uppercase text-surface-400 dark:text-surface-500 mb-2 block tracking-widest">{{ 'order_form.device_name' | t }}</label>
                                <input pInputText formControlName="deviceName" 
                                       class="w-full p-inputtext-sm border-surface-300 dark:bg-surface-900 dark:border-surface-700 dark:text-surface-0 focus:border-primary" 
                                       [placeholder]="'order_form.device_name_placeholder' | t" />
                            </div>
                            <div class="flex items-end pb-1">
                                <p-button icon="pi pi-trash" [text]="true" [rounded]="true" severity="danger" 
                                          (onClick)="removeDevice(i)" [pTooltip]="'ui.delete' | t"></p-button>
                            </div>
                        </div>

                        <!-- Device Number Badge -->
                        <div class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex items-center justify-center text-xs font-bold text-surface-500 dark:text-surface-300 shadow-sm">
                            {{ i + 1 }}
                        </div>
                    </div>
                } @empty {
                    <div class="text-center py-12 bg-surface-50 dark:bg-surface-900 border border-dashed border-surface-300 dark:border-surface-700 rounded-2xl">
                        <div class="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400 dark:text-surface-500">
                            <i class="pi pi-desktop text-3xl"></i>
                        </div>
                        <p class="text-surface-600 dark:text-surface-400 font-medium">{{ 'order_form.no_devices' | t }}</p>
                        <p class="text-sm text-surface-400 dark:text-surface-500 mt-1">{{ 'order_form.no_devices_hint' | t }}</p>
                    </div>
                }
            </div>
        </div>

        <div class="mb-8">
            <label class="block font-medium mb-1 dark:text-surface-300">{{ 'order_form.notes' | t }}</label>
            <textarea pTextarea formControlName="notes" rows="3" class="w-full dark:bg-surface-800 dark:border-surface-700 dark:text-surface-0"></textarea>
        </div>

        <div class="flex justify-between items-center pt-6 border-t border-surface-200 dark:border-surface-700 mt-8">
            <p-button [label]="'ui.cancel' | t" severity="secondary" routerLink="/orders"></p-button>
            <p-button type="submit" [label]="isEdit ? ('order_form.submit_edit' | t) : ('order_form.submit_create' | t)" 
                     icon="pi pi-check" size="large" [loading]="store.saving()"
                     [disabled]="orderForm.invalid" styleClass="rounded-xl px-8 font-bold"></p-button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .font-tajawal { font-family: 'Tajawal', sans-serif; }
    :host ::ng-deep .p-dropdown, :host ::ng-deep .p-inputnumber { width: 100%; }
    :host ::ng-deep .p-selectbutton .p-button { flex: 1; }
  `]
})
export class OrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private salesService = inject(SalesService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);
  private i18n = inject(I18nService);

  readonly store = inject(OrdersStore);
  readonly customersStore = inject(CustomersStore);

  statusOptions = computed(() => [
    { label: this.i18n.t('orders.status.pending'), value: 'pending' },
    { label: this.i18n.t('orders.status.completed'), value: 'completed' },
    { label: this.i18n.t('orders.status.cancelled'), value: 'cancelled' }
  ]);

  orderForm!: FormGroup;
  isEdit = false;
  orderId: string | null = null;
  users = signal<User[]>([]);
  filteredCustomers = signal<any[]>([]);
  isGeocoding = false;
  countries = COUNTRIES;
  uploadUrl = `${API_BASE_URL}/sales/upload-attachment`;

  customerTypeOptions = computed(() => [
    { label: this.i18n.t('order_form.existing_customer'), value: 'existing' },
    { label: this.i18n.t('order_form.new_customer'), value: 'new' }
  ]);

  constructor() {
    effect(() => {
      const error = this.store.error();
      const lang = this.i18n.currentLang(); // Trigger on lang change
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: this.i18n.t('ui.error'),
          detail: error,
          life: 3000
        });
        setTimeout(() => this.store.clearError(), 3100);
      }
    });
  }

  typeOptions = computed(() => [
    { label: this.i18n.t('order_form.type_new'), value: 'new' },
    { label: this.i18n.t('order_form.type_renewal'), value: 'renewal' },
    { label: this.i18n.t('order_form.type_referral'), value: 'referral' }
  ]);

  paymentOptions = computed(() => [
    { label: this.i18n.t('order_form.pm_credit'), value: 'Credit Card' },
    { label: this.i18n.t('order_form.pm_zelle'), value: 'Zelle' },
    { label: this.i18n.t('order_form.pm_cashapp'), value: 'Cash App' },
    { label: this.i18n.t('order_form.pm_venmo'), value: 'Venmo' },
    { label: this.i18n.t('order_form.pm_paypal'), value: 'PayPal' },
    { label: this.i18n.t('order_form.pm_apple'), value: 'Apple Pay' },
    { label: this.i18n.t('order_form.pm_google'), value: 'Google Pay' },
    { label: this.i18n.t('order_form.pm_ach'), value: 'ACH Transfer' },
    { label: this.i18n.t('order_form.pm_cash'), value: 'Cash' },
    { label: this.i18n.t('order_form.pm_check'), value: 'Check' },
    { label: this.i18n.t('order_form.pm_other'), value: 'Other' }
  ]);

  ngOnInit() {
    this.initForm();
    this.loadUsers();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.orderId = params['id'];
        this.loadOrderData(this.orderId!);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['customerId'] && !this.isEdit) {
        this.salesService.getCustomer(params['customerId']).subscribe(c => {
          this.orderForm.patchValue({
            customerType: 'existing',
            existingCustomer: c
          });
        });
      }
    });
  }

  private initForm() {
    this.orderForm = this.fb.group({
      customerType: ['new'],
      existingCustomer: [null],
      newCustomer: this.fb.group({
        name: ['', Validators.required],
        phone: ['', Validators.required],
        email: [''],
        address: [''],
        country: [''],
        state: [''],
        latitude: [null],
        longitude: [null]
      }),
      leadAgentId: [null, Validators.required],
      closerAgentId: [null, Validators.required],
      type: ['new', Validators.required],
      status: ['completed'],
      referrerName: [''],
      amount: [0, [Validators.required, Validators.min(0)]],
      paymentMethod: ['Zelle', Validators.required],
      serverName: [''],
      serverExpiryDate: [null],
      appType: [''],
      appYears: [1],
      appExpiryDate: [null],
      notes: [''],
      devices: this.fb.array([]),
      attachments: [[]],
      invoiceFile: [null]
    });

    this.onCustomerTypeChange();
  }

  get devices() {
    return this.orderForm.get('devices') as FormArray;
  }

  get attachmentsArray() {
    return this.orderForm.get('attachments');
  }

  onUploadComplete(event: any) {
    let response = event.originalEvent?.body;
    if (!response && event.xhr?.response) {
      response = JSON.parse(event.xhr.response);
    }

    if (response && response.url) {
      const current = this.attachmentsArray?.value || [];
      this.attachmentsArray?.setValue([...current, response.url]);
      this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: 'تم رفع الملف بنجاح' });
    }
  }

  onInvoiceUploadComplete(event: any) {
    let response = event.originalEvent?.body;
    if (!response && event.xhr?.response) {
      response = JSON.parse(event.xhr.response);
    }

    if (response && response.url) {
      this.orderForm.patchValue({ invoiceFile: response.url });
      this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: 'تم رفع الفاتورة بنجاح' });
    }
  }

  removeInvoiceFile() {
    this.orderForm.patchValue({ invoiceFile: null });
  }

  onUploadError(event: any) {
    this.messageService.add({ severity: 'error', summary: this.i18n.t('ui.error'), detail: 'فشل رفع الملف' });
  }

  removeAttachment(index: number) {
    const current = this.attachmentsArray?.value || [];
    current.splice(index, 1);
    this.attachmentsArray?.setValue([...current]);
  }

  addDevice(deviceData?: any) {
    const deviceGroup = this.fb.group({
      macAddress: [deviceData?.macAddress || ''],
      deviceKey: [deviceData?.deviceKey || ''],
      deviceName: [deviceData?.deviceName || '']
    });
    this.devices.push(deviceGroup);
  }

  removeDevice(index: number) {
    this.devices.removeAt(index);
  }

  onCustomerTypeChange() {
    const type = this.orderForm.get('customerType')?.value;
    if (type === 'existing') {
      this.orderForm.get('newCustomer')?.disable();
      this.orderForm.get('existingCustomer')?.setValidators(Validators.required);
    } else {
      this.orderForm.get('newCustomer')?.enable();
      this.orderForm.get('existingCustomer')?.clearValidators();
    }
    this.orderForm.get('existingCustomer')?.updateValueAndValidity();
  }

  loadUsers() {
    this.userService.getUsers().subscribe(u => this.users.set(u));
  }

  loadOrderData(id: string) {
    this.salesService.getOrder(id).subscribe(o => {
      this.orderForm.patchValue({
        customerType: 'existing',
        existingCustomer: o.customer,
        leadAgentId: o.leadAgent.id,
        closerAgentId: o.closerAgent.id,
        type: o.type,
        status: o.status,
        referrerName: o.referrerName,
        amount: o.amount,
        paymentMethod: o.paymentMethod,
        serverName: o.serverName,
        serverExpiryDate: o.serverExpiryDate ? new Date(o.serverExpiryDate) : null,
        appType: o.appType,
        appYears: o.appYears,
        appExpiryDate: o.appExpiryDate ? new Date(o.appExpiryDate) : null,
        notes: o.notes,
        attachments: o.attachments || [],
        invoiceFile: o.invoiceFile || null
      });

      this.devices.clear();
      o.devices.forEach(d => this.addDevice(d));
      this.onCustomerTypeChange();
    });
  }

  searchCustomers(event: any) {
    this.salesService.getCustomers({ search: event.query }).subscribe(res => {
      this.filteredCustomers.set(res.data);
      this.cdr.detectChanges();
    });
  }

  fetchGeocoding() {
    const addr = this.orderForm.get('newCustomer.address')?.value;
    const state = this.orderForm.get('newCustomer.state')?.value;
    const country = this.orderForm.get('newCustomer.country')?.value;
    if (!addr) {
      this.messageService.add({ severity: 'warn', summary: this.i18n.t('ui.warning'), detail: this.i18n.t('order_form.geocoding_warning') });
      return;
    }
    this.isGeocoding = true;
    this.salesService.geocode(addr, state, country).subscribe({
      next: (coords) => {
        if (coords) {
          this.orderForm.patchValue({
            newCustomer: { latitude: coords.latitude, longitude: coords.longitude }
          });
          this.messageService.add({ severity: 'success', summary: this.i18n.t('ui.success'), detail: this.i18n.t('order_form.geocoding_success') });
        } else {
          this.messageService.add({ severity: 'error', summary: this.i18n.t('ui.error'), detail: this.i18n.t('order_form.geocoding_error') });
        }
        this.isGeocoding = false;
      },
      error: () => this.isGeocoding = false
    });
  }

  onSubmit() {
    if (this.orderForm.invalid) return;

    const val = this.orderForm.getRawValue();
    const payload: any = {
      ...val,
      leadAgentId: val.leadAgentId,
      closerAgentId: val.closerAgentId,
    };

    if (val.customerType === 'existing') {
      payload.customerId = val.existingCustomer.id;
    } else {
      payload.newCustomer = val.newCustomer;
    }

    if (this.isEdit && this.orderId) {
      this.store.updateOrder({ id: this.orderId, data: payload });
    } else {
      this.store.createOrder(payload);
    }
  }
}
