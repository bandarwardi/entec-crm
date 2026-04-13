import { Component, inject, signal, ViewChild, ElementRef, afterNextRender, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiChatService, AiConversation, AiMessage, SalesScenario } from '../../core/services/ai-chat.service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-ai-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TooltipModule, ProgressSpinnerModule, TranslatePipe],
  template: `
    <div class="fixed bottom-6 z-[2000] flex flex-col items-end gap-3" [class.left-6]="i18n.isRTL()" [class.right-6]="!i18n.isRTL()" [style.direction]="i18n.direction()">
      <!-- Chat Window -->
      @if (isOpen()) {
        <div class="bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-80 sm:w-[400px] flex flex-col overflow-hidden animate-scalein h-[550px]" [class.origin-bottom-left]="i18n.isRTL()" [class.origin-bottom-right]="!i18n.isRTL()">
          <!-- Header -->
          <div class="bg-primary p-4 text-white flex justify-between items-center shrink-0">
            <div class="flex items-center gap-2">
              <i class="pi pi-sparkles text-xl"></i>
              <div class="flex flex-col">
                <span class="font-bold leading-none">{{ 'ai_chat.header_title' | t }}</span>
                @if (activeConversation(); as active) {
                  <span class="text-[10px] opacity-80 mt-1 truncate max-w-[150px]">{{ active.title }}</span>
                }
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button (click)="toggleHistory()" 
                      class="flex items-center gap-1 bg-transparent border-none text-white hover:bg-white/20 p-2 rounded-lg cursor-pointer transition-colors"
                      [pTooltip]="'ai_chat.history_tooltip' | t">
                <i class="pi pi-history text-sm"></i>
              </button>
              
              <button (click)="startNewChat()" 
                      class="flex items-center bg-transparent border-none text-white hover:bg-white/20 p-2 rounded-lg cursor-pointer transition-colors"
                      [pTooltip]="'ai_chat.new_chat_tooltip' | t">
                <i class="pi pi-plus text-sm"></i>
              </button>

              <button (click)="toggleChat()" 
                      class="flex items-center bg-transparent border-none text-white hover:bg-white/20 p-2 rounded-lg cursor-pointer transition-colors"
                      [pTooltip]="'ai_chat.close_tooltip' | t">
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <div class="flex-1 flex overflow-hidden relative">
            <!-- History Drawer (Absolute Overlay) -->
            @if (showHistory()) {
              <div class="absolute inset-0 z-20 bg-white dark:bg-[#1e293b] border-l border-slate-200 dark:border-slate-700 flex flex-col animate-fadein">
                <div class="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                  <span class="font-bold text-sm text-slate-700 dark:text-slate-200">{{ 'ai_chat.history_title' | t }}</span>
                  <p-button icon="pi pi-times" styleClass="p-button-text p-button-rounded p-button-sm" (onClick)="toggleHistory()"></p-button>
                </div>
                <div class="flex-1 overflow-y-auto p-2">
                  @if (loadingConversations()) {
                    <div class="flex justify-center p-4">
                      <p-progressSpinner styleClass="w-6 h-6" strokeWidth="4"></p-progressSpinner>
                    </div>
                  } @else {
                    @for (conv of conversations(); track conv.id) {
                      <div class="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer group mb-1"
                           [class.bg-slate-100]="activeConversation()?.id === conv.id"
                           [class.dark:bg-slate-800]="activeConversation()?.id === conv.id"
                           (click)="selectConversation(conv)">
                        <i class="pi pi-comments text-slate-400"></i>
                        <div class="flex-1 overflow-hidden">
                          <div class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{{ conv.title }}</div>
                          <div class="text-[10px] text-slate-400">{{ conv.updatedAt | date:'short' }}</div>
                        </div>
                        <p-button icon="pi pi-trash" 
                                  styleClass="p-button-text p-button-danger p-button-sm opacity-0 group-hover:opacity-100" 
                                  (onClick)="$event.stopPropagation(); deleteConversation(conv.id)"></p-button>
                      </div>
                    } @empty {
                      <div class="text-center p-8 text-slate-400 text-sm">{{ 'ai_chat.no_history' | t }}</div>
                    }
                  }
                </div>
              </div>
            }

            <!-- Main Chat Content -->
            <div class="flex-1 flex flex-col bg-slate-50 dark:bg-[#0f172a] overflow-hidden">
              <!-- Scenarios Bar -->
              <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div class="p-2 flex items-center justify-between cursor-pointer" (click)="toggleScenarios()">
                  <div class="flex items-center gap-2">
                    <i class="pi pi-book text-primary"></i>
                    <span class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ 'ai_chat.scenarios_library' | t }}</span>
                  </div>
                  <i class="pi" [class.pi-chevron-down]="!showScenarios()" [class.pi-chevron-up]="showScenarios()"></i>
                </div>
                
                @if (showScenarios()) {
                  <div class="px-2 pb-3 flex gap-2 overflow-x-auto custom-scrollbar animate-fadein">
                    @for (scenario of scenarios(); track scenario.id) {
                      <div class="shrink-0 w-28 p-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col items-center text-center gap-1"
                           (click)="useScenario(scenario)">
                        <i [class]="scenario.icon || 'pi pi-tag'" class="text-lg text-primary"></i>
                        <span class="text-[10px] font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-tight">{{ scenario.title }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Messages Area -->
              <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3" #scrollContainer>
                @if (!activeConversation()) {
                  <div class="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <i class="pi pi-sparkles text-5xl mb-4 text-primary/20"></i>
                    <h3 class="text-slate-700 dark:text-slate-200 font-bold mb-2">{{ 'ai_chat.welcome_title' | t }}</h3>
                    <p class="text-sm">{{ 'ai_chat.welcome_subtitle' | t }}</p>
                  </div>
                } @else {
                  @for (msg of messages(); track msg.id) {
                    <div class="flex flex-col" [class.items-start]="msg.role === 'model'" [class.items-end]="msg.role === 'user'">
                      <div class="max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap"
                           [class.bg-white]="msg.role === 'model'"
                           [class.dark:bg-slate-800]="msg.role === 'model'"
                           [class.text-slate-800]="msg.role === 'model'"
                           [class.dark:text-slate-200]="msg.role === 'model'"
                           [class.bg-primary]="msg.role === 'user'"
                           [class.text-white]="msg.role === 'user'"
                           [class.rounded-bl-none]="msg.role === 'model' && i18n.isRTL()"
                           [class.rounded-br-none]="msg.role === 'model' && !i18n.isRTL()"
                           [class.rounded-br-none]="msg.role === 'user' && i18n.isRTL()"
                           [class.rounded-bl-none]="msg.role === 'user' && !i18n.isRTL()">
                        {{ msg.content }}
                      </div>
                    </div>
                  }
                  @if (isLoading()) {
                    <div class="flex items-start">
                      <div class="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                        <div class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                        <div class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div class="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Input Area -->
              <div class="p-3 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2 shrink-0">
                <input 
                  type="text" 
                  pInputText 
                  [(ngModel)]="userInput" 
                  (keyup.enter)="sendMessage()"
                  [placeholder]="'ai_chat.input_placeholder' | t" 
                  class="flex-1 p-2 text-sm border-none bg-slate-50 dark:bg-slate-900 dark:text-white rounded-xl focus:shadow-none"
                  [disabled]="isLoading() || !activeConversation()"
                />
                <p-button icon="pi pi-send" styleClass="p-button-rounded" (onClick)="sendMessage()" [disabled]="isLoading() || !userInput.trim() || !activeConversation()"></p-button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Toggle Button -->
      <button 
        class="w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer border-none"
        (click)="toggleChat()"
      >
        <i [class.pi-sparkles]="!isOpen()" [class.pi-times]="isOpen()" class="pi text-2xl"></i>
      </button>
    </div>
  `,
  styles: [`
    :host {
      direction: rtl;
    }
    .animate-scalein {
      animation: scalein 0.2s ease-out;
    }
    .animate-fadein {
      animation: fadein 0.2s ease-out;
    }
    @keyframes scalein {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes fadein {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    .custom-scrollbar::-webkit-scrollbar {
      height: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    :host-context(.app-dark) .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
    }
  `]
})
export class AiChatBubbleComponent implements OnInit {
  private aiChatService = inject(AiChatService);
  i18n = inject(I18nService);
  
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  isOpen = signal(false);
  isLoading = signal(false);
  showHistory = signal(false);
  showScenarios = signal(true);
  loadingConversations = signal(false);
  
  userInput = '';
  conversations = signal<AiConversation[]>([]);
  activeConversation = signal<AiConversation | null>(null);
  messages = signal<AiMessage[]>([]);
  scenarios = signal<SalesScenario[]>([]);

  constructor() {
    afterNextRender(() => {
      this.scrollToBottom();
    });
  }

  ngOnInit() {
    this.loadScenarios();
    this.loadConversations();
  }

  loadScenarios() {
    this.aiChatService.getScenarios().subscribe(data => {
      this.scenarios.set(data);
    });
  }

  loadConversations() {
    this.loadingConversations.set(true);
    console.log('Loading AI conversations...');
    this.aiChatService.getConversations().subscribe({
      next: (data) => {
        console.log('AI Conversations loaded:', data);
        this.conversations.set(data);
        this.loadingConversations.set(false);
      },
      error: (err) => {
        console.error('Failed to load AI conversations:', err);
        this.loadingConversations.set(false);
      }
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      setTimeout(() => this.scrollToBottom(), 100);
      if (this.conversations().length > 0 && !this.activeConversation()) {
        this.selectConversation(this.conversations()[0]);
      }
    }
  }

  toggleHistory() {
    this.showHistory.update(v => !v);
    if (this.showHistory()) {
      this.loadConversations();
    }
  }

  toggleScenarios() {
    this.showScenarios.update(v => !v);
  }

  startNewChat(title?: string) {
    this.aiChatService.createConversation(title).subscribe(conv => {
      this.conversations.update(prev => [conv, ...prev]);
      this.selectConversation(conv);
      this.showHistory.set(false);
    });
  }

  selectConversation(conv: AiConversation) {
    this.activeConversation.set(conv);
    this.messages.set([]);
    this.isLoading.set(true);
    this.aiChatService.getMessages(conv.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.isLoading.set(false);
        this.showHistory.set(false);
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: () => this.isLoading.set(false)
    });
  }

  deleteConversation(id: string) {
    this.aiChatService.deleteConversation(id).subscribe(() => {
      this.conversations.update(prev => prev.filter(c => c.id !== id));
      if (this.activeConversation()?.id === id) {
        this.activeConversation.set(null);
        this.messages.set([]);
      }
    });
  }

  useScenario(scenario: SalesScenario) {
    this.aiChatService.createConversation(scenario.title).subscribe(conv => {
      this.conversations.update(prev => [conv, ...prev]);
      this.activeConversation.set(conv);
      this.messages.set([]);
      this.showHistory.set(false);
      this.userInput = scenario.prompt;
      this.sendMessage();
    });
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  sendMessage() {
    const convId = this.activeConversation()?.id;
    if (!convId || !this.userInput.trim() || this.isLoading()) return;

    const userMessage = this.userInput.trim();
    this.userInput = '';
    
    // Add user message to UI immediately
    const tempUserMsg: AiMessage = {
      id: Date.now().toString(),
      conversationId: convId,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString()
    };
    this.messages.update(prev => [...prev, tempUserMsg]);
    this.scrollToBottom();

    this.isLoading.set(true);
    
    this.aiChatService.sendMessage(convId, userMessage).subscribe({
      next: (aiMsg) => {
        this.messages.update(prev => [...prev, aiMsg]);
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 0);
        // Refresh conversations to update titles/times
        this.loadConversations();
      },
      error: (err) => {
        console.error('AI Chat Error:', err);
        const errorMsg: AiMessage = {
          id: (Date.now() + 1).toString(),
          conversationId: convId,
          role: 'model',
          content: this.i18n.t('ai_chat.error_msg'),
          createdAt: new Date().toISOString()
        };
        this.messages.update(prev => [...prev, errorMsg]);
        this.isLoading.set(false);
        setTimeout(() => this.scrollToBottom(), 0);
      }
    });
  }
}
