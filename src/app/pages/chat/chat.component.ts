import { Component, inject, OnInit, ViewChild, ElementRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatStore, Conversation, Message } from '../../core/stores/chat.store';
import { AuthStore } from '../../core/stores/auth.store';
import { UsersStore } from '../../core/stores/users.store';
import { ChatService } from '../../core/services/chat.service';
import { LayoutService } from '../../layout/service/layout.service';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SOCKET_URL } from '../../core/constants/api.constants';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AvatarModule,
    ButtonModule,
    TextareaModule,
    TooltipModule,
    BadgeModule,
    DividerModule,
    ProgressSpinnerModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    DialogModule,
    ToastModule,
    TranslatePipe
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div [class.app-dark]="isDarkMode()" class="h-[calc(100vh-9rem)] relative overflow-hidden rounded-xl border border-slate-200 dark:border-[#222c32] shadow-sm font-tajawal">
      <div class="flex h-full bg-white dark:bg-[#0b141a]">
        <!-- Sidebar: Conversations List -->
        <div 
          [class.hidden]="!isSidebarVisible() && isMobile()"
          [class.absolute]="isMobile()"
          [class.inset-0]="isMobile()"
          [class.z-20]="isMobile()"
          class="w-full md:w-80 border-r border-slate-200 dark:border-[#222c32] flex flex-col bg-[#f0f2f5] dark:bg-[#111b21]"
        >
          <div class="p-4 border-b border-slate-200 dark:border-[#222c32] bg-white dark:bg-[#202c33] flex justify-between items-center h-16 shrink-0">
            <h2 class="text-xl font-bold text-slate-800 dark:text-[#e9edef] m-0">{{ 'chat.title' | t }}</h2>
            <p-button 
              icon="pi pi-user-plus" 
              styleClass="p-button-rounded p-button-text p-button-sm text-teal-600 dark:text-[#00a884]"
              (onClick)="showUserSearch = true"
              [pTooltip]="'chat.new_chat_tooltip' | t"
            ></p-button>
          </div>
          
          <div class="flex-1 overflow-y-auto whatsapp-list dark:bg-[#111b21]">
            @if (chatStore.loading()) {
              <div class="flex justify-center p-4">
                <p-progressSpinner styleClass="w-8 h-8" strokeWidth="4"></p-progressSpinner>
              </div>
            } @else {
              @for (conv of chatStore.conversations(); track conv.id) {
                <div 
                  (click)="onSelectConversation(conv)"
                  [class.active-conv]="chatStore.activeConversation()?.id === conv.id"
                  class="flex items-center p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#202c33] transition-all border-b border-slate-100 dark:border-[#222c32] relative conversation-item"
                >
                  <p-avatar 
                    [label]="conv.otherUser.name[0]" 
                    shape="circle" 
                    size="large"
                    [style]="{'background-color': '#14b8a6', 'color': '#ffffff'}"
                  ></p-avatar>
                  
                  <div class="mr-3 flex-1 overflow-hidden" [class.ml-3]="!i18n.isRTL()" [class.mr-3]="i18n.isRTL()">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-semibold text-slate-900 dark:text-[#e9edef] truncate">{{ conv.otherUser.name }}</span>
                      @if (conv.lastMessageAt) {
                        <span class="text-xs text-slate-500 dark:text-[#8696a0] mr-2 shrink-0">{{ conv.lastMessageAt | date:'HH:mm' }}</span>
                      }
                    </div>
                    
                    <div class="flex justify-between items-center">
                      <p class="text-sm text-slate-500 dark:text-[#8696a0] truncate m-0 flex-1">
                        @if (conv.isTyping) {
                          <span class="text-teal-600 dark:text-[#00a884] font-medium italic">{{ 'chat.writing_now' | t }}</span>
                        } @else if (conv.lastMessage) {
                          {{ conv.lastMessage.content || (conv.lastMessage.mediaType === 'image' ? ('chat.image' | t) : ('chat.file' | t)) }}
                        } @else {
                          <span class="italic dark:text-[#8696a0]/50">{{ 'chat.start_conversation' | t }}</span>
                        }
                      </p>
                      
                      @if (conv.unreadCount > 0) {
                        <p-badge [value]="conv.unreadCount.toString()" severity="danger" styleClass="shrink-0"></p-badge>
                      }
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center text-slate-400 dark:text-[#8696a0]">
                  <i class="pi pi-comments text-4xl mb-2"></i>
                  <p>{{ 'chat.empty_chats' | t }}</p>
                  <p-button 
                    [label]="'chat.start_conversation' | t" 
                    styleClass="p-button-link text-teal-600 dark:text-[#00a884] p-0"
                    (onClick)="showUserSearch = true"
                  ></p-button>
                </div>
              }
            }
          </div>
        </div>

        <!-- Main Chat Area -->
        <div 
          [class.hidden]="isSidebarVisible() && isMobile()"
          class="flex-1 flex flex-col bg-white dark:bg-[#0b141a]"
        >
          @if (chatStore.activeConversation(); as active) {
            <!-- Chat Header -->
            <div class="p-4 border-b border-slate-200 dark:border-[#222c32] flex items-center justify-between shadow-sm z-10 h-16 shrink-0 bg-white dark:bg-[#202c33]">
              <div class="flex items-center overflow-hidden">
                @if (isMobile()) {
                  <p-button 
                    [icon]="i18n.isRTL() ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" 
                    styleClass="p-button-rounded p-button-text p-button-secondary ml-2 dark:text-[#aebac1]"
                    (onClick)="isSidebarVisible.set(true)"
                  ></p-button>
                }
                <p-avatar 
                  [label]="active.otherUser.name[0]" 
                  shape="circle" 
                  [style]="{'background-color': '#14b8a6', 'color': '#ffffff'}"
                  styleClass="shrink-0"
                ></p-avatar>
                <div class="mr-3 overflow-hidden" [class.ml-3]="!i18n.isRTL()" [class.mr-3]="i18n.isRTL()">
                  <h3 class="font-bold text-slate-900 dark:text-[#e9edef] m-0 truncate text-base !m-0">{{ active.otherUser.name }}</h3>
                  <span class="text-xs text-slate-500 dark:text-[#8696a0] truncate block">{{ active.otherUser.role }}</span>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div #scrollContainer class="flex-1 overflow-y-auto p-3 md:p-4 whatsapp-bg flex flex-col gap-3">
              @if (chatStore.hasMore()) {
                <div class="flex justify-center mb-4">
                  <p-button 
                    [label]="'chat.load_more' | t" 
                    icon="pi pi-history" 
                    [loading]="chatStore.messagesLoading()"
                    styleClass="p-button-text p-button-sm text-slate-500 dark:text-[#8696a0]"
                    (onClick)="chatStore.loadMore()"
                  ></p-button>
                </div>
              }

              @for (msg of chatStore.messages(); track msg.id; let last = $last) {
                <div 
                  class="flex flex-col gap-1 w-full"
                  [class.items-start]="msg.senderId === authStore.user()?.id"
                  [class.items-end]="msg.senderId !== authStore.user()?.id"
                >
                  <div 
                    [class.sender-bubble]="msg.senderId === authStore.user()?.id"
                    [class.receiver-bubble]="msg.senderId !== authStore.user()?.id"
                    class="p-2 md:p-3 shadow-sm relative message-bubble max-w-[85%] md:max-w-[70%]"
                  >
                    <!-- Media Content -->
                    @if (msg.mediaUrl) {
                      <div class="mb-2">
                        @if (msg.mediaType === 'image') {
                        <div class="image-container rounded-lg overflow-hidden min-h-[100px] flex items-center justify-center">
                          <img 
                            [src]="socketUrl + msg.mediaUrl" 
                            class="max-w-full max-h-[450px] object-contain rounded-lg cursor-pointer hover:opacity-95 transition-opacity block mx-auto chat-image"
                            alt="Image message"
                            (click)="openMedia(socketUrl + msg.mediaUrl)"
                          >
                        </div>
                      } @else {
                          <a 
                            [href]="socketUrl + msg.mediaUrl" 
                            target="_blank"
                            class="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/5 rounded border border-black/10 dark:border-white/10 no-underline text-inherit"
                          >
                            <i class="pi pi-file text-xl"></i>
                            <div class="flex flex-col overflow-hidden">
                              <span class="text-sm font-medium truncate max-w-[150px]">{{ msg.originalFileName }}</span>
                              <span class="text-[10px] opacity-70">{{ 'chat.click_to_download' | t }}</span>
                            </div>
                          </a>
                        }
                      </div>
                    }

                    <!-- Text Content -->
                    @if (msg.content) {
                      <p class="m-0 leading-relaxed break-words whitespace-pre-wrap text-sm md:text-base">{{ msg.content }}</p>
                    }

                    <!-- Message Metadata -->
                    <div 
                      class="flex items-center justify-end gap-1 mt-1 opacity-70 text-[10px]"
                    >
                      <span>{{ msg.createdAt | date:'HH:mm' }}</span>
                      @if (msg.senderId === authStore.user()?.id) {
                        <i class="pi" 
                           [class.pi-check]="!msg.isRead" 
                           [class.pi-check-circle]="msg.isRead"
                           [class.text-blue-500]="msg.isRead"></i>
                      }
                    </div>
                  </div>
                </div>
              }

              <!-- Sending Placeholder -->
              @if (chatStore.sending()) {
                <div class="flex flex-col gap-1 w-full items-start">
                  <div class="p-2 md:p-3 shadow-sm relative sender-bubble message-bubble max-w-[85%] md:max-w-[70%] opacity-70">
                    <div class="flex items-center gap-3 py-2 px-4">
                      <p-progressSpinner styleClass="w-5 h-5" strokeWidth="4"></p-progressSpinner>
                      <span class="text-sm font-medium italic">جاري رفع الملف...</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Typing Indicator (Bottom) -->
            @if (active.isTyping) {
              <div class="px-4 py-1 text-[10px] md:text-xs text-teal-600 dark:text-[#00a884] italic animate-pulse bg-white dark:bg-[#0b141a]">
                {{ active.otherUser.name }} {{ 'chat.writing_now' | t }}
              </div>
            }

            <!-- Input Area -->
            <div class="p-2 md:p-3 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center gap-2 border-t border-slate-200 dark:border-[#222c32] shrink-0">
              <button 
                type="button"
                pButton 
                icon="pi pi-paperclip" 
                class="p-button-rounded p-button-text p-button-secondary p-0 w-10 h-10 shrink-0 dark:text-[#aebac1]"
                (click)="fileInput.click()"
                [pTooltip]="'chat.attach_file_tooltip' | t"
              ></button>
              <input 
                #fileInput 
                type="file" 
                class="hidden" 
                (change)="onFileSelected($event)"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              >
              
              <div class="flex-1 flex items-end bg-white dark:bg-[#2a3942] rounded-lg px-3 py-1 shadow-sm border border-transparent focus-within:border-teal-500/30 dark:focus-within:border-[#00a884]/30 transition-all">
                <textarea 
                  #messageInput
                  pTextarea 
                  [autoResize]="true" 
                  rows="1" 
                  [(ngModel)]="messageText" 
                  (keydown.enter)="$event.preventDefault(); sendMsg()"
                  (input)="onTyping()"
                  [placeholder]="'chat.type_message_placeholder' | t"
                  class="flex-1 border-none bg-transparent shadow-none focus:shadow-none py-2 px-1 text-slate-800 dark:text-[#d1d7db] resize-none min-h-[30px] max-h-32 text-sm md:text-base leading-5"
                ></textarea>
              </div>

              <button 
                pButton 
                icon="pi pi-send" 
                class="p-button-rounded bg-teal-600 dark:bg-[#00a884] border-none hover:bg-teal-700 dark:hover:bg-[#008f6f] p-0 w-11 h-11 shrink-0 shadow-sm"
                (click)="sendMsg()"
                [disabled]="!messageText.trim() && !chatStore.sending()"
              ></button>
            </div>
          } @else {
            <!-- Empty State -->
            <div class="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/20 dark:bg-[#0b141a] p-6">
              <div class="bg-white dark:bg-[#202c33] p-8 md:p-12 rounded-full shadow-sm mb-6 border dark:border-[#222c32]">
                <i class="pi pi-comments text-6xl md:text-8xl text-teal-500/20 dark:text-[#00a884]/20"></i>
              </div>
              <h2 class="text-xl md:text-2xl font-bold text-slate-700 dark:text-[#e9edef] mb-2 text-center">{{ 'chat.welcome_title' | t }}</h2>
              <p class="text-center text-sm md:text-base dark:text-[#8696a0]">{{ 'chat.welcome_subtitle' | t }}</p>
            </div>
          }
        </div>
      </div>
    </div>

    <p-dialog 
      [header]="'chat.new_chat_dialog_title' | t" 
      [(visible)]="showUserSearch" 
      [modal]="true" 
      [style]="{width: '400px'}"
      [draggable]="false"
      [resizable]="false"
      styleClass="new-chat-dialog font-tajawal"
    >
      <div class="flex flex-col gap-4">
        <p-iconField iconPosition="left" class="w-full">
          <p-inputIcon class="pi pi-search" />
          <input 
            type="text" 
            pInputText 
            [placeholder]="'chat.search_users_placeholder' | t" 
            [(ngModel)]="userSearchQuery"
            (input)="onUserSearch($event)"
            class="w-full dark:bg-[#2a3942] dark:text-[#d1d7db] dark:border-transparent"
          >
        </p-iconField>

        <div class="max-h-60 overflow-y-auto custom-scrollbar">
          @if (usersStore.loading()) {
            <div class="flex justify-center p-4">
              <p-progressSpinner styleClass="w-6 h-6" strokeWidth="4"></p-progressSpinner>
            </div>
          } @else {
            @for (user of usersStore.entities(); track user.id) {
              <div 
                (click)="startNewChat(user.id)"
                class="flex items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2a3942] rounded-lg transition-colors border-b border-slate-50 dark:border-[#222c32] last:border-0"
              >
                <p-avatar 
                  [label]="user.name[0]" 
                  shape="circle"
                  [style]="{'background-color': '#14b8a6', 'color': '#ffffff'}"
                ></p-avatar>
                <div class="mr-3" [class.ml-3]="!i18n.isRTL()" [class.mr-3]="i18n.isRTL()">
                  <p class="font-semibold m-0 text-slate-900 dark:text-[#e9edef]">{{ user.name }}</p>
                  <p class="text-xs text-slate-500 dark:text-[#8696a0] m-0">{{ user.email }}</p>
                </div>
              </div>
            } @empty {
              <div class="p-4 text-center text-slate-400 dark:text-[#8696a0]">
                {{ 'chat.no_users_found' | t }}
              </div>
            }
          }
        </div>
      </div>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep {
      .p-textarea {
        background: transparent !important;
      }
    }

    .whatsapp-bg {
      background-color: #e5ddd5;
      background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
      background-repeat: repeat;
      background-attachment: local;
      background-blend-mode: overlay;
    }

    :host-context(.app-dark) .whatsapp-bg {
      background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png') !important;
      background-blend-mode: multiply !important;
      background-color: #0b141a !important; 
      opacity: 1 !important;
    }

    :host-context(.app-dark) .whatsapp-list {
      background-color: #111b21 !important;
    }

    :host-context(.app-dark) .p-dialog .p-dialog-header,
    :host-context(.app-dark) .p-dialog .p-dialog-content {
      background-color: #222c32 !important;
      color: #e9edef !important;
    }

    :host-context(.app-dark) .p-inputtext {
      background-color: #2a3942 !important;
      border-color: #2a3942 !important;
      color: #d1d7db !important;
    }

    .message-bubble {
      position: relative;
      border-radius: 12px;
      margin-bottom: 2px;
    }

    .sender-bubble {
      background-color: #dcf8c6 !important; /* WhatsApp light sender green */
      color: #111b21 !important;
      border-top-right-radius: 2px !important;
    }

    .sender-bubble::after {
      content: "";
      position: absolute;
      top: 0;
      right: -10px;
      width: 20px;
      height: 12px;
      background-color: #dcf8c6;
      clip-path: polygon(0 0, 0% 100%, 100% 0);
    }

    :host-context(.app-dark) .sender-bubble {
      background-color: #005c4b !important; /* WhatsApp dark sender green */
      color: #e9edef !important;
    }

    :host-context(.app-dark) .sender-bubble::after {
      background-color: #005c4b !important;
    }

    .receiver-bubble {
      background-color: #ffffff !important;
      color: #111b21 !important;
      border-top-left-radius: 2px !important;
    }

    .receiver-bubble::after {
      content: "";
      position: absolute;
      top: 0;
      left: -10px;
      width: 20px;
      height: 12px;
      background-color: #ffffff;
      clip-path: polygon(100% 0, 100% 100%, 0 0);
    }

    :host-context(.app-dark) .receiver-bubble {
      background-color: #202c33 !important;
      color: #e9edef !important;
      border: none !important;
    }

    :host-context(.app-dark) .receiver-bubble::after {
      background-color: #202c33 !important;
    }

    .active-conv {
      background-color: #f0f2f5 !important;
      border-right: 4px solid #00a884 !important;
    }

    :host-context(.app-dark) .active-conv {
      background-color: #2a3942 !important;
      border-right: 4px solid #00a884 !important;
    }

    .whatsapp-list {
      background-color: #f0f2f5;
    }

    :host-context(.app-dark) .whatsapp-list {
      background-color: #111b21;
    }

    .chat-image {
      image-rendering: -webkit-optimize-contrast;
      image-rendering: auto;
      backface-visibility: hidden;
      transform: translateZ(0);
    }

    .image-container img {
      transition: transform 0.2s ease;
    }

    .image-container img:hover {
      transform: scale(1.01);
    }
  `]
})
export class ChatComponent implements OnInit {
  chatStore = inject(ChatStore);
  authStore = inject(AuthStore);
  usersStore = inject(UsersStore);
  chatService = inject(ChatService);
  layoutService = inject(LayoutService);
  messageService = inject(MessageService);
  breakpointObserver = inject(BreakpointObserver);
  i18n = inject(I18nService);
  socketUrl = SOCKET_URL;

  isDarkMode = computed(() => this.layoutService.isDarkTheme());
  
  private userSearchSubject = new Subject<string>();
  
  messageText: string = '';
  showUserSearch: boolean = false;
  userSearchQuery: string = '';
  isSidebarVisible = signal(true);
  
  isMobile = toSignal(
    this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(result => result.matches)
    ),
    { initialValue: false }
  );

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private typingTimeout: any;

  constructor() {
    // Backend search logic
    this.userSearchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(query => {
      this.usersStore.loadUsers(query);
    });

    // Scroll to bottom when new messages arrive
    effect(() => {
      const messages = this.chatStore.messages();
      if (messages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });

    // Show error toast when error occurs in chatStore
    effect(() => {
      const error = this.chatStore.error();
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ في المحادثة',
          detail: error,
          life: 3000
        });
        // Clear error so it can be triggered again
        setTimeout(() => this.chatStore.clearError(), 3100);
      }
    });

    // Show error toast when error occurs in usersStore
    effect(() => {
      const error = this.usersStore.error();
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ في المستخدمين',
          detail: error,
          life: 3000
        });
        // Clear error so it can be triggered again
        setTimeout(() => this.usersStore.clearError(), 3100);
      }
    });
  }

  onUserSearch(event: any) {
    const query = event.target.value;
    this.userSearchSubject.next(query);
  }

  ngOnInit() {
    this.usersStore.loadUsers();
  }

  onSelectConversation(conv: Conversation) {
    this.chatStore.selectConversation(conv);
    if (this.isMobile()) {
      this.isSidebarVisible.set(false);
    }
  }

  startNewChat(userId: string) {
    this.chatStore.startConversation({ userId });
    this.showUserSearch = false;
    this.userSearchQuery = '';
  }

  sendMsg() {
    if (this.messageText.trim()) {
      this.chatStore.sendMessage(this.messageText);
      this.messageText = '';
      this.scrollToBottom();
      this.stopTyping();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.chatStore.sendMedia(file);
      event.target.value = ''; // Reset input
    }
  }

  onTyping() {
    const active = this.chatStore.activeConversation();
    if (!active) return;

    if (!this.typingTimeout) {
      this.chatService.emitTyping(active.id, active.otherUser.id, true);
    }

    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }

  stopTyping() {
    const active = this.chatStore.activeConversation();
    if (!active || !this.typingTimeout) return;

    this.chatService.emitTyping(active.id, active.otherUser.id, false);
    this.typingTimeout = null;
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  openMedia(url: string) {
    window.open(url, '_blank');
  }
}
