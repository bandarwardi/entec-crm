import { Component, inject, OnInit, OnDestroy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappStore } from '../../../core/stores/whatsapp.store';
import { UsersStore } from '../../../core/stores/users.store';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-whatsapp-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ToggleButtonModule,
    TagModule,
    TooltipModule,
    TranslatePipe
  ],
  template: `
    <div class="card">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">{{ 'whatsapp.admin.title' | t }}</h2>
        <p-button 
          [label]="'whatsapp.admin.add_channel' | t" 
          icon="pi pi-plus" 
          (onClick)="showAddDialog = true">
        </p-button>
      </div>

      <p-table [value]="store.channels()" [loading]="store.loading()">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'whatsapp.admin.label' | t }}</th>
            <th>{{ 'whatsapp.admin.phone' | t }}</th>
            <th>{{ 'whatsapp.admin.status' | t }}</th>
            <th>{{ 'whatsapp.admin.agents' | t }}</th>
            <th>{{ 'whatsapp.admin.actions' | t }}</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-channel>
          <tr>
            <td>{{ channel.label }}</td>
            <td>{{ channel.phoneNumber }}</td>
            <td>
              <p-tag 
                [value]="i18n.t('whatsapp.admin.channel_status.' + channel.status)" 
                [severity]="getStatusSeverity(channel.status)">
              </p-tag>
            </td>
            <td>
              @if (channel.allAgentsAccess) {
                <p-tag [value]="i18n.t('whatsapp.admin.channel_status.all_agents')" severity="info"></p-tag>
              } @else {
                <span class="text-sm">{{ channel.assignedAgents?.length || 0 }} {{ 'whatsapp.admin.agents' | t }}</span>
              }
            </td>
            <td>
              <div class="flex gap-2">
                @if (channel.status === 'qr_pending') {
                  <p-button 
                    icon="pi pi-qrcode" 
                    [pTooltip]="i18n.t('whatsapp.admin.scan_qr')"
                    severity="info" 
                    [rounded]="true" 
                    (onClick)="showQr(channel)">
                  </p-button>
                }
                @if (channel.status === 'disconnected') {
                  <p-button 
                    icon="pi pi-refresh" 
                    [pTooltip]="i18n.t('whatsapp.admin.reconnect')"
                    severity="warn" 
                    [rounded]="true" 
                    (onClick)="reconnect(channel)">
                  </p-button>
                }
                <p-button 
                  icon="pi pi-pencil" 
                  [pTooltip]="i18n.t('whatsapp.admin.edit_channel')"
                  severity="secondary" 
                  [rounded]="true" 
                  (onClick)="editChannel(channel)">
                </p-button>
                <p-button 
                  icon="pi pi-trash" 
                  [pTooltip]="i18n.t('ui.delete')"
                  severity="danger" 
                  [rounded]="true" 
                  (onClick)="confirmDelete(channel)">
                </p-button>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>

      <!-- Add/Edit Channel Dialog -->
      <p-dialog 
        [(visible)]="showEditDialog" 
        [header]="isEditing ? i18n.t('whatsapp.admin.edit_channel') : i18n.t('whatsapp.admin.add_channel')" 
        [modal]="true" 
        [style]="{width: '500px'}">
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-2">
            <label class="font-bold">{{ 'whatsapp.admin.label' | t }}</label>
            <input pInputText [(ngModel)]="editingLabel" [placeholder]="'whatsapp.admin.label' | t" />
          </div>

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <p-toggleButton 
                [(ngModel)]="editingAllAccess" 
                [onLabel]="i18n.t('whatsapp.admin.channel_status.all_agents')" 
                [offLabel]="i18n.t('whatsapp.admin.channel_status.all_agents')" 
                styleClass="w-full">
              </p-toggleButton>
            </div>
          </div>

          @if (!editingAllAccess) {
            <div class="flex flex-col gap-2">
              <label class="font-bold">{{ 'whatsapp.admin.agents' | t }}</label>
              <p-multiSelect 
                [options]="usersStore.entities()" 
                [(ngModel)]="editingAgents" 
                optionLabel="name" 
                optionValue="id"
                [placeholder]="i18n.t('whatsapp.admin.agents')"
                class="w-full"
                appendTo="body">
              </p-multiSelect>
            </div>
          }
        </div>
        <ng-template pTemplate="footer">
          <p-button 
            [label]="'ui.cancel' | t" 
            [text]="true" 
            (onClick)="showEditDialog = false">
          </p-button>
          <p-button 
            [label]="isEditing ? i18n.t('whatsapp.admin.save_changes') : i18n.t('ui.add')" 
            (onClick)="saveChannel()" 
            [loading]="store.loading()">
          </p-button>
        </ng-template>
      </p-dialog>

      <!-- QR Dialog -->
      <p-dialog 
        [(visible)]="showQrDialog" 
        [header]="i18n.t('whatsapp.admin.scan_qr_dialog_title')" 
        [modal]="true" 
        [style]="{width: '400px'}">
        <div class="flex flex-col items-center gap-4 p-4 text-center">
          @if (!showPairing) {
            @if (selectedChannel?.qrCode) {
              <img [src]="selectedChannel?.qrCode" alt="QR Code" class="w-64 h-64 shadow-lg rounded-lg border border-gray-200" />
              <p class="text-sm font-medium text-gray-600">{{ 'whatsapp.admin.scan_instructions' | t }}</p>
              
              <div class="w-full border-t dark:border-surface-700 my-2"></div>
              <p-button 
                [label]="'الربط عبر رقم الهاتف' | t" 
                [text]="true" 
                icon="pi pi-phone" 
                (onClick)="showPairing = true">
              </p-button>
            } @else {
              <div class="flex flex-col items-center gap-4 py-8">
                <i class="pi pi-spin pi-spinner text-5xl text-primary"></i>
                <p class="font-bold text-gray-500">{{ 'whatsapp.admin.generating_qr' | t }}</p>
              </div>
            }
          } @else {
            <div class="flex flex-col gap-4 w-full p-2">
              <p class="text-sm text-surface-600">أدخل رقم الهاتف المرتبط بالواتساب (بالصيغة الدولية، مثلاً 9665xxxxxxxx)</p>
              <div class="flex gap-2">
                <input pInputText [(ngModel)]="pairingPhone" placeholder="9665xxxxxxxx" class="flex-1" />
                <p-button label="طلب الكود" (onClick)="getPairingCode()" [loading]="pairingLoading"></p-button>
              </div>

              @if (pairingCode) {
                <div class="mt-4 p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border-2 border-dashed border-emerald-500">
                  <p class="text-[10px] uppercase font-black text-emerald-600 mb-2">كود الإقران الخاص بك هو:</p>
                  <div class="text-3xl font-mono font-black tracking-[0.5em] text-emerald-700 dark:text-emerald-400">
                    {{ pairingCode }}
                  </div>
                  <p class="text-[10px] text-emerald-600 mt-4 leading-relaxed">افتح واتساب على هاتفك > الأجهزة المرتبطة > ربط جهاز > الربط عبر رقم الهاتف بدلاً من ذلك، ثم أدخل الكود أعلاه.</p>
                </div>
              }

              <p-button 
                label="العودة لمسح الـ QR" 
                [text]="true" 
                icon="pi pi-qrcode" 
                (onClick)="showPairing = false; pairingCode = ''; pairingPhone = ''"
                styleClass="mt-2">
              </p-button>
            </div>
          }
        </div>
      </p-dialog>
    </div>
  `
})
export class WhatsappSettingsComponent implements OnInit, OnDestroy {
  readonly store = inject(WhatsappStore);
  readonly usersStore = inject(UsersStore);
  readonly i18n = inject(I18nService);
  
  showEditDialog = false;
  showQrDialog = false;
  isEditing = false;
  
  editingId: string | null = null;
  editingLabel = '';
  editingAllAccess = false;
  editingAgents: string[] = [];

  selectedChannel: any = null;
  
  showPairing = false;
  pairingPhone = '';
  pairingCode = '';
  pairingLoading = false;
  
  constructor() {
    // Monitor status changes via Firestore through the store
    effect(() => {
      const channels = this.store.channels();
      if (this.selectedChannel) {
        const current = channels.find(c => c.id === this.selectedChannel.id);
        if (current) {
          this.selectedChannel = current;
          if (current.status === 'connected') {
            this.showQrDialog = false;
          }
          if ((current.status as string) === 'wrong_number') {
            this.showQrDialog = false;
            const msg = this.i18n.currentLang() === 'ar' 
              ? 'خطأ: الرقم الممسوح لا يتطابق مع الرقم المسجل لهذه القناة.' 
              : 'Error: The scanned number does not match the registered number for this channel.';
            alert(msg);
          }
        }
      }
    });
  }

  ngOnInit() {
    this.store.startListening();
    this.usersStore.loadUsers();
  }

  set showAddDialog(val: boolean) {
    if (val) {
      this.isEditing = false;
      this.editingId = null;
      this.editingLabel = '';
      this.editingAllAccess = false;
      this.editingAgents = [];
      this.showEditDialog = true;
    }
  }

  ngOnDestroy() {
    this.store.stopListening();
  }

  getStatusSeverity(status: string) {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'danger';
      case 'qr_pending': return 'warn';
      case 'wrong_number': return 'danger';
      default: return 'secondary';
    }
  }

  saveChannel() {
    if (!this.editingLabel) return;

    if (this.isEditing && this.editingId) {
      this.store.updateChannelAgents({
        id: this.editingId,
        agents: this.editingAgents,
        allAgentsAccess: this.editingAllAccess
      });
    } else {
      this.store.createChannel(this.editingLabel);
    }
    this.showEditDialog = false;
  }

  editChannel(channel: any) {
    this.isEditing = true;
    this.editingId = channel.id;
    this.editingLabel = channel.label;
    this.editingAllAccess = channel.allAgentsAccess;
    this.editingAgents = channel.assignedAgents?.map((a: any) => a.id || a) || [];
    this.showEditDialog = true;
  }

  reconnect(channel: any) {
    this.selectedChannel = channel;
    this.store.reconnectChannel(channel.id);
    this.showQrDialog = true;
  }

  showQr(channel: any) {
    this.selectedChannel = channel;
    this.showPairing = false;
    this.pairingCode = '';
    this.pairingPhone = '';
    this.showQrDialog = true;
  }

  getPairingCode() {
    if (!this.pairingPhone || !this.selectedChannel) return;
    this.pairingLoading = true;
    this.store.requestPairingCode(this.selectedChannel.id, this.pairingPhone).subscribe({
      next: (res: any) => {
        this.pairingCode = res.code;
        this.pairingLoading = false;
      },
      error: (err) => {
        this.pairingLoading = false;
        alert('فشل طلب الكود: ' + (err.error?.message || 'خطأ غير معروف'));
      }
    });
  }

  confirmDelete(channel: any) {
    if (confirm(this.i18n.t('whatsapp.admin.delete_confirm_msg'))) {
      this.store.deleteChannel(channel.id);
    }
  }
}
