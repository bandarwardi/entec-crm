import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { WhatsappStore } from '../../core/stores/whatsapp.store';
import { LeadsStore } from '../../core/stores/leads.store';
import { WhatsappService, WhatsappChannel } from '../../core/services/whatsapp.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ListboxModule } from 'primeng/listbox';
import { TagModule } from 'primeng/tag';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { db } from '../../core/firebase/firebase.config';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-whatsapp-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ListboxModule,
    TagModule,
    TranslatePipe
  ],
  template: `
    <div class="flex h-[calc(100vh-9rem)] gap-4 overflow-hidden">
      <!-- Channels Column -->
      <div class="w-80 flex flex-col gap-4 bg-surface-50 dark:bg-surface-800 p-4 rounded-3xl border border-surface-200 dark:border-surface-700">
        <h3 class="font-black text-primary px-2 uppercase tracking-widest text-xs">{{ 'whatsapp.inbox.channels' | t }}</h3>
        <p-listbox 
          [options]="store.channels()" 
          [(ngModel)]="selectedChannel" 
          optionLabel="label"
          [style]="{'border': 'none', 'background': 'transparent'}"
          class="w-full custom-listbox">
          <ng-template pTemplate="item" let-channel>
            <div class="flex items-center gap-3 py-1">
              <i class="pi pi-whatsapp text-green-500"></i>
              <div class="flex flex-col">
                <span class="font-bold text-sm">{{ channel.label }}</span>
                <span class="text-[10px] text-surface-500">{{ channel.phoneNumber }}</span>
              </div>
            </div>
          </ng-template>
        </p-listbox>

        <div class="mt-4 border-t pt-4 dark:border-surface-700 flex flex-col gap-2">
          <h3 class="font-black text-primary px-2 uppercase tracking-widest text-xs">{{ 'menu.leads' | t }}</h3>
          <p-iconField iconPosition="left">
            <p-inputIcon class="pi pi-search" />
            <input 
              pInputText 
              type="text" 
              [placeholder]="'ui.search' | t" 
              class="w-full rounded-2xl bg-white dark:bg-surface-900 border-none text-xs"
              (input)="onSearchLeads($event)" />
          </p-iconField>
          
          <div class="flex-1 overflow-y-auto max-h-[300px] flex flex-col gap-1 mt-2">
            @for (lead of filteredLeads(); track lead.id) {
              <div 
                class="p-2 rounded-2xl hover:bg-white dark:hover:bg-surface-700 cursor-pointer transition-all border border-transparent hover:border-surface-200 dark:hover:border-surface-600"
                [class.bg-white]="targetPhone() === lead.phone"
                [class.dark:bg-surface-700]="targetPhone() === lead.phone"
                (click)="selectLead(lead)">
                <div class="font-bold text-xs">{{ lead.name }}</div>
                <div class="text-[10px] text-surface-500">{{ lead.phone }}</div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Conversations/Chat Column -->
      <div class="flex-1 flex flex-col bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm">
        @if (selectedChannel()) {
          <!-- Chat Header -->
          <div class="p-4 border-b dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <i class="pi pi-user text-xl"></i>
              </div>
              <div class="flex flex-col">
                <span class="font-black text-lg">{{ currentLeadName() || targetPhone() }}</span>
                <span class="text-xs text-green-500 font-bold" *ngIf="selectedChannel()?.status === 'connected'">
                  <i class="pi pi-circle-fill text-[8px] mr-1"></i> Online
                </span>
              </div>
            </div>
          </div>

          <!-- Messages Area -->
          <div #scrollContainer class="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-50/30 dark:bg-transparent">
            @for (msg of messages(); track msg.id) {
              <div class="flex flex-col max-w-[80%]" 
                   [class.self-end]="msg.direction === 'outbound'"
                   [class.self-start]="msg.direction === 'inbound'">
                <div class="p-3 rounded-2xl shadow-sm text-sm"
                     [class.bg-primary]="msg.direction === 'outbound'"
                     [class.text-white]="msg.direction === 'outbound'"
                     [class.bg-white]="msg.direction === 'inbound'"
                     [class.dark:bg-surface-800]="msg.direction === 'inbound'"
                     [class.rounded-tr-none]="msg.direction === 'outbound'"
                     [class.rounded-tl-none]="msg.direction === 'inbound'">
                  {{ msg.content }}
                </div>
                <span class="text-[10px] text-surface-400 mt-1 px-1" 
                      [class.text-right]="msg.direction === 'outbound'">
                  {{ msg.timestamp | date:'shortTime' }}
                  <i class="pi pi-check ml-1 text-[8px]" *ngIf="msg.direction === 'outbound'"></i>
                </span>
              </div>
            }
          </div>

          <!-- Input Area -->
          <div class="p-4 border-t dark:border-surface-700 bg-white dark:bg-surface-900">
            <form (ngSubmit)="sendMessage()" class="flex gap-2">
              <input 
                pInputText 
                [(ngModel)]="newMessageText" 
                name="msg"
                [placeholder]="'chat.type_message_placeholder' | t"
                class="flex-1 rounded-2xl bg-surface-50 border-none px-4 py-3"
                autocomplete="off" />
              <p-button 
                type="submit" 
                icon="pi pi-send" 
                [disabled]="!newMessageText.trim() || sending()"
                styleClass="rounded-2xl px-6 h-full shadow-lg shadow-primary/20">
              </p-button>
            </form>
          </div>
        } @else {
          <div class="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div class="w-24 h-24 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mb-6">
              <i class="pi pi-whatsapp text-5xl text-surface-300"></i>
            </div>
            <h2 class="text-2xl font-black text-surface-900 dark:text-white mb-2">{{ 'whatsapp.inbox.welcome_title' | t }}</h2>
            <p class="text-surface-500 max-w-md">{{ 'whatsapp.inbox.welcome_subtitle' | t }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .custom-listbox .p-listbox-list {
        padding: 0;
      }
      .custom-listbox .p-listbox-item {
        border-radius: 1rem;
        margin-bottom: 0.25rem;
        transition: all 0.2s;
        border: 1px solid transparent;
      }
      .custom-listbox .p-listbox-item.p-highlight {
        background: var(--primary-color-transparent);
        color: var(--primary-color);
        border-color: var(--primary-color-transparent);
      }
    }
  `]
})
export class WhatsappInboxComponent implements OnInit, OnDestroy {
  readonly store = inject(WhatsappStore);
  readonly leadsStore = inject(LeadsStore);
  readonly whatsappService = inject(WhatsappService);
  readonly route = inject(ActivatedRoute);
  readonly i18n = inject(I18nService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  selectedChannel = signal<WhatsappChannel | null>(null);
  targetPhone = signal<string | null>(null);
  currentLeadId = signal<string | null>(null);
  currentLeadName = signal<string | null>(null);
  
  leadSearchTerm = signal('');
  filteredLeads = computed(() => {
    const term = this.leadSearchTerm().toLowerCase();
    const leads = this.leadsStore.allLeads();
    if (!term) return leads.slice(0, 10);
    return leads.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.phone.includes(term)
    ).slice(0, 15);
  });

  messages = signal<any[]>([]);
  newMessageText = '';
  sending = signal(false);
  private messagesUnsubscribe?: () => void;

  constructor() {
    // Sync listeners when channel or phone changes
    effect(() => {
      const channel = this.selectedChannel();
      const phone = this.targetPhone();
      if (channel && phone) {
        this.startMessagesListening(channel.id, phone);
      } else {
        this.stopMessagesListening();
      }
    });
  }

  ngOnInit() {
    this.store.startListening();
    this.leadsStore.loadLeads({ page: 1, limit: 100 });
    
    // Handle query params for direct chat from Leads
    this.route.queryParams.subscribe(params => {
      if (params['phone']) {
        this.targetPhone.set(params['phone']);
        this.currentLeadId.set(params['leadId'] || null);
        
        // Find lead name from store if possible
        const lead = this.leadsStore.allLeads().find(l => l.id === params['leadId']);
        if (lead) {
          this.currentLeadName.set(lead.name);
        }

        // Auto-select first channel if none selected
        if (!this.selectedChannel() && this.store.channels().length > 0) {
          this.selectedChannel.set(this.store.channels()[0]);
        }
      }
    });
  }

  onSearchLeads(event: any) {
    this.leadSearchTerm.set(event.target.value);
  }

  selectLead(lead: any) {
    this.targetPhone.set(lead.phone);
    this.currentLeadId.set(lead.id);
    this.currentLeadName.set(lead.name);
    
    if (!this.selectedChannel() && this.store.channels().length > 0) {
      this.selectedChannel.set(this.store.channels()[0]);
    }
  }

  private startMessagesListening(channelId: string, phoneNumber: string) {
    this.stopMessagesListening();

    const messagesRef = collection(db, 'whatsappChannels', channelId, 'messages');
    const q = query(
      messagesRef,
      where('externalNumber', '==', phoneNumber),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    this.messagesUnsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.data()['timestamp'] as Timestamp)?.toDate() || new Date()
      }));
      this.messages.set(msgs);
      this.scrollToBottom();
    });
  }

  private stopMessagesListening() {
    if (this.messagesUnsubscribe) {
      this.messagesUnsubscribe();
      this.messagesUnsubscribe = undefined;
    }
    this.messages.set([]);
  }

  ngOnDestroy() {
    this.stopMessagesListening();
  }

  sendMessage() {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    const text = this.newMessageText.trim();

    if (!channel || !leadId || !text) return;

    this.sending.set(true);
    this.whatsappService.sendMessage(channel.id, leadId, text).subscribe({
      next: () => {
        this.newMessageText = '';
        this.sending.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.sending.set(false);
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
