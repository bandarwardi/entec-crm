import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, effect, CUSTOM_ELEMENTS_SCHEMA, HostListener } from '@angular/core';
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
import { TooltipModule } from 'primeng/tooltip';
import { Popover, PopoverModule } from 'primeng/popover';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { LeadStatus } from '../../core/services/user-lead.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { I18nService } from '../../core/i18n/i18n.service';
import { db } from '../../core/firebase/firebase.config';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, or, addDoc } from 'firebase/firestore';
import 'emoji-picker-element';

@Component({
  selector: 'app-whatsapp-inbox',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    ListboxModule,
    TagModule,
    TooltipModule,
    PopoverModule,
    ToastModule,
    SelectModule,
    TextareaModule,
    TranslatePipe
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="flex h-[calc(100vh-6rem)] lg:h-[calc(100vh-9rem)] lg:gap-4 overflow-hidden relative w-full">
      
      <!-- Sidebar (Channels & Leads) -->
      @if (!isMobile() || !targetPhone()) {
        <div class="flex-1 lg:flex-none lg:w-85 flex flex-col bg-surface-50 dark:bg-surface-900 lg:rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm animate-fade-in">
          
          <!-- Top Section: Selected Channel / Profile -->
          <div class="p-4 bg-white dark:bg-surface-800 border-b dark:border-surface-700">
            <div class="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <div class="w-12 h-12 bg-white dark:bg-surface-700 rounded-full flex items-center justify-center shadow-sm border border-emerald-100 dark:border-emerald-800/50">
                <i class="pi pi-whatsapp text-2xl text-emerald-500"></i>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-black text-emerald-700 dark:text-emerald-400 truncate text-sm">
                  {{ selectedChannel()?.label || 'اختر قناة' }}
                </div>
                <div class="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-bold truncate">
                  {{ selectedChannel()?.phoneNumber || '---' }}
                </div>
              </div>
              @if (store.channels().length > 1) {
                <p-button 
                  icon="pi pi-sort-alt" 
                  [text]="true" 
                  (click)="channelOp.toggle($event)"
                  styleClass="p-0 w-8 h-8 text-emerald-600">
                </p-button>
              }
            </div>
          </div>

          <p-popover #channelOp styleClass="w-64 p-2">
            <div class="flex flex-col gap-1">
              @for (ch of store.channels(); track ch.id) {
                <div 
                  class="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                  [class.bg-emerald-50]="selectedChannel()?.id === ch.id"
                  (click)="selectedChannel.set(ch); channelOp.hide()">
                  <i class="pi pi-whatsapp text-emerald-500"></i>
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold text-xs truncate">{{ ch.label }}</span>
                    <span class="text-[10px] text-surface-500 truncate">{{ ch.phoneNumber }}</span>
                  </div>
                </div>
              }
            </div>
          </p-popover>

          <!-- Search Section -->
          <div class="px-4 py-3">
            <p-iconField iconPosition="left">
              <p-inputIcon class="pi pi-search text-surface-400" />
              <input 
                pInputText 
                type="text" 
                [placeholder]="'ui.search' | t" 
                class="w-full rounded-xl bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-xs py-2 px-10 focus:ring-1 focus:ring-emerald-500/20"
                (input)="onSearchLeads($event)"
                (keydown.enter)="onSearchEnter($event)" />
            </p-iconField>
          </div>

          <!-- Filter Section -->
          <div class="px-4 pb-3 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar-ui">
            <button 
              type="button"
              (click)="currentFilter.set('all')"
              class="px-3 py-1.5 rounded-full text-[10px] font-black transition-all shrink-0 border border-transparent"
              [class.bg-emerald-500]="currentFilter() === 'all'"
              [class.text-white]="currentFilter() === 'all'"
              [class.bg-surface-100]="currentFilter() !== 'all'"
              [class.dark:bg-surface-800]="currentFilter() !== 'all'"
              [class.text-surface-600]="currentFilter() !== 'all'">
              الكل
            </button>
            <button 
              type="button"
              (click)="currentFilter.set('unread')"
              class="px-3 py-1.5 rounded-full text-[10px] font-black transition-all shrink-0 border border-transparent flex items-center gap-1.5"
              [class.bg-emerald-500]="currentFilter() === 'unread'"
              [class.text-white]="currentFilter() === 'unread'"
              [class.bg-surface-100]="currentFilter() !== 'unread'"
              [class.dark:bg-surface-800]="currentFilter() !== 'unread'"
              [class.text-surface-600]="currentFilter() !== 'unread'">
              غير مقروء
              @if (totalUnread() > 0) {
                <span class="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px]">{{ totalUnread() }}</span>
              }
            </button>
            <button 
              type="button"
              (click)="currentFilter.set('groups')"
              class="px-3 py-1.5 rounded-full text-[10px] font-black transition-all shrink-0 border border-transparent"
              [class.bg-emerald-500]="currentFilter() === 'groups'"
              [class.text-white]="currentFilter() === 'groups'"
              [class.bg-surface-100]="currentFilter() !== 'groups'"
              [class.dark:bg-surface-800]="currentFilter() !== 'groups'"
              [class.text-surface-600]="currentFilter() !== 'groups'">
              المجموعات
            </button>
            <button 
              type="button"
              (click)="currentFilter.set('archived')"
              class="px-3 py-1.5 rounded-full text-[10px] font-black transition-all shrink-0 border border-transparent"
              [class.bg-emerald-500]="currentFilter() === 'archived'"
              [class.text-white]="currentFilter() === 'archived'"
              [class.bg-surface-100]="currentFilter() !== 'archived'"
              [class.dark:bg-surface-800]="currentFilter() !== 'archived'"
              [class.text-surface-600]="currentFilter() !== 'archived'">
              المؤرشفة
            </button>
          </div>
          
          <!-- Leads List -->
          <div class="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            <div class="flex flex-col gap-1">
              @for (lead of filteredLeads(); track lead.id) {
                <div 
                  class="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 group border"
                  [class.bg-white]="targetPhone() === lead.phone"
                  [class.dark:bg-surface-800]="targetPhone() === lead.phone"
                  [class.shadow-sm]="targetPhone() === lead.phone"
                  [class.border-emerald-200]="targetPhone() === lead.phone"
                  [class.bg-emerald-50/30]="(lead.unreadCount || 0) > 0 && targetPhone() !== lead.phone"
                  [class.dark:bg-emerald-900/10]="(lead.unreadCount || 0) > 0 && targetPhone() !== lead.phone"
                  [class.border-emerald-100/50]="(lead.unreadCount || 0) > 0 && targetPhone() !== lead.phone"
                  [class.border-transparent]="(!lead.unreadCount || lead.unreadCount === 0) && targetPhone() !== lead.phone"
                  [class.hover:bg-surface-100]="targetPhone() !== lead.phone"
                  [class.dark:hover:bg-surface-800/50]="targetPhone() !== lead.phone"
                  (click)="selectLead(lead)">
                  
                  <!-- Avatar -->
                  <div class="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm relative transition-transform group-hover:scale-105 shadow-sm border border-surface-100 dark:border-surface-700 overflow-hidden"
                       [style.backgroundColor]="!lead.profilePicUrl ? getAvatarBg(lead.name) : 'transparent'"
                       [style.color]="'white'">
                    @if (lead.profilePicUrl) {
                      <img [src]="lead.profilePicUrl" class="w-full h-full object-cover" alt="Profile" />
                    } @else {
                      {{ lead.name.substring(0, 1).toUpperCase() }}
                    }
                    @if (lead.isGroup) {
                      <div class="absolute -top-0.5 -left-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white dark:border-surface-800 z-10">
                        <i class="pi pi-users text-[8px] text-white"></i>
                      </div>
                    }
                    @if (lead.isOnline) {
                      <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <div class="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                      </div>
                    }
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                      <span class="text-sm truncate text-surface-900 dark:text-surface-100" 
                        [class.font-black]="lead.unreadCount && lead.unreadCount > 0 || targetPhone() === lead.phone" 
                        [class.font-bold]="(!lead.unreadCount || lead.unreadCount === 0) && targetPhone() !== lead.phone"
                        [class.text-emerald-600]="targetPhone() === lead.phone">
                        {{ lead.name }}
                      </span>
                      @if (lead.lastMessageAt) {
                        <span class="text-[9px] text-surface-400 font-bold whitespace-nowrap">
                          {{ lead.lastMessageAt | date:'shortTime' }}
                        </span>
                      }
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-[11px] text-surface-500 font-bold truncate dir-ltr text-right max-w-full flex-1">
                        {{ lead.phone }}
                      </span>
                      @if (lead.unreadCount && lead.unreadCount > 0) {
                        <div class="h-5 min-w-[20px] px-1.5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm animate-bounce">
                          {{ lead.unreadCount }}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
              @if (filteredLeads().length === 0) {
                <div class="p-8 text-center">
                  <i class="pi pi-users text-4xl text-surface-200 mb-2 block"></i>
                  <span class="text-xs text-surface-400 font-bold">{{ 'ui.no_results' | t }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Conversations/Chat Column -->
      @if (!isMobile() || targetPhone()) {
        <div class="flex-1 flex flex-col bg-white dark:bg-surface-900 lg:rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm animate-fade-in">
          @if (selectedChannel()) {
            <!-- Chat Header -->
            <div class="p-4 border-b dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 flex justify-between items-center shadow-sm relative z-10 transition-all">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                @if (isMobile() && targetPhone()) {
                  <p-button 
                    icon="pi pi-arrow-right" 
                    [text]="true" 
                    (click)="backToList()"
                    styleClass="p-0 w-8 h-8 text-surface-600 lg:hidden">
                  </p-button>
                }
                
                @if (!messageSearchActive()) {
                  <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary overflow-hidden border border-emerald-100 dark:border-emerald-800/50 shadow-sm shrink-0">
                    @if (selectedLead()?.profilePicUrl) {
                      <img [src]="selectedLead()?.profilePicUrl" class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full flex items-center justify-center bg-emerald-500 text-white font-black text-sm">
                        {{ (selectedLead()?.name || '?').substring(0, 1).toUpperCase() }}
                      </div>
                    }
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="font-black text-sm sm:text-base truncate">{{ currentLeadName() || targetPhone() }}</span>
                    @if (selectedLead()?.isOnline) {
                      <span class="text-[10px] text-emerald-500 font-black animate-pulse flex items-center gap-1">
                        <i class="pi pi-circle-fill text-[6px]"></i>
                        متصل الآن
                      </span>
                    }
                  </div>
                } @else {
                  <div class="flex-1 max-w-md animate-fade-in">
                    <p-iconField iconPosition="left">
                      <p-inputIcon class="pi pi-search text-surface-400" />
                      <input 
                        pInputText 
                        type="text" 
                        [(ngModel)]="messageSearchTerm"
                        [placeholder]="'ابحث في الرسائل...'" 
                        class="w-full rounded-full bg-white dark:bg-surface-800 border-none text-xs py-2 px-10 focus:ring-1 focus:ring-emerald-500"
                        autoFocus />
                    </p-iconField>
                  </div>
                }
              </div>

              <div class="flex items-center gap-1 sm:gap-2">
                <p-button 
                  [icon]="selectedLead()?.isArchived ? 'pi pi-upload' : 'pi pi-archive'" 
                  [text]="true" 
                  [rounded]="true" 
                  (click)="toggleArchive(selectedLead()!)"
                  [pTooltip]="selectedLead()?.isArchived ? 'إلغاء الأرشفة' : 'أرشفة المحادثة'"
                  styleClass="w-9 h-9 sm:w-10 sm:h-10 text-surface-600 hover:bg-surface-100 transition-all">
                </p-button>

                <p-button 
                  icon="pi pi-ellipsis-v" 
                  [text]="true" 
                  [rounded]="true" 
                  (click)="chatMenu.toggle($event)"
                  pTooltip="خيارات إضافية"
                  styleClass="w-9 h-9 sm:w-10 sm:h-10 text-surface-600 hover:bg-surface-100 transition-all">
                </p-button>

                <p-popover #chatMenu styleClass="w-48 p-1">
                  <div class="flex flex-col gap-1">
                    <button class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-xs text-surface-700 dark:text-surface-200 border-none bg-transparent cursor-pointer w-full text-right" (click)="modifyChat('mute'); chatMenu.hide()">
                      <i class="pi pi-volume-off text-amber-500"></i>
                      <span>كتم المحادثة</span>
                    </button>
                    <button class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-xs text-surface-700 dark:text-surface-200 border-none bg-transparent cursor-pointer w-full text-right" (click)="modifyChat('pin'); chatMenu.hide()">
                      <i class="pi pi-bookmark text-blue-500"></i>
                      <span>تثبيت المحادثة</span>
                    </button>
                    <button class="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-xs text-red-500 border-none bg-transparent cursor-pointer w-full text-right" (click)="blockUser(); chatMenu.hide()">
                      <i class="pi pi-ban"></i>
                      <span>حظر المستخدم</span>
                    </button>
                  </div>
                </p-popover>
                
                <p-button 
                  [icon]="messageSearchActive() ? 'pi pi-times' : 'pi pi-search'" 
                  [text]="true" 
                  [rounded]="true" 
                  (click)="toggleMessageSearch()"
                  [pTooltip]="messageSearchActive() ? 'إغلاق البحث' : 'بحث في الرسائل'"
                  styleClass="w-9 h-9 sm:w-10 sm:h-10 text-surface-600 hover:bg-surface-100 transition-all">
                </p-button>

                <!-- Toggle Sidebar Button -->
                <p-button 
                  icon="pi pi-info-circle" 
                  [text]="true" 
                  [rounded]="true" 
                  (click)="showingDetails.set(!showingDetails())"
                  [severity]="showingDetails() ? 'primary' : 'secondary'"
                  pTooltip="تفاصيل العميل"
                  styleClass="w-9 h-9 sm:w-10 sm:h-10 transition-all">
                </p-button>
              </div>
            </div>

            <!-- Connection Status Banner -->
            @if (selectedChannel()?.status !== 'connected') {
              <div class="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 flex items-center justify-between border-b border-amber-100 dark:border-amber-900/30 animate-pulse relative z-10">
                <div class="flex items-center gap-2">
                  <i class="pi pi-exclamation-triangle text-amber-500"></i>
                  <span class="text-[10px] font-black text-amber-700 dark:text-amber-400">القناة غير متصلة الآن، قد لا تصل الرسائل بشكل فوري.</span>
                </div>
                <button type="button" (click)="reconnect()" class="text-[9px] font-black bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 transition-all border-none cursor-pointer">إعادة ربط</button>
              </div>
            }

            <!-- Messages Area -->
            <div #scrollContainer class="flex-1 overflow-y-auto p-6 flex flex-col gap-2 whatsapp-bg relative">
              
              <div class="flex justify-center mb-4">
                <p-button 
                  label="تحميل الرسائل القديمة من واتساب" 
                  [text]="true" 
                  icon="pi pi-history" 
                  [loading]="fetchingHistory()"
                  (onClick)="loadMoreHistory()"
                  styleClass="text-[10px] font-black bg-white/50 dark:bg-surface-800/50 backdrop-blur rounded-full px-4 py-1.5 border border-surface-200 dark:border-surface-700 hover:bg-white dark:hover:bg-surface-800 transition-all">
                </p-button>
              </div>

              @if (messageSearchTerm()) {
                <div class="sticky top-0 z-20 mx-auto bg-white/90 dark:bg-surface-800/90 backdrop-blur shadow-sm px-4 py-2 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100 dark:border-emerald-800/20 mb-4 animate-bounce">
                  تم العثور على {{ filteredMessages().length }} رسالة
                </div>
              }

              @for (msg of filteredMessages(); track msg.id) {
                <div class="flex flex-col max-w-[85%] mb-1" 
                     [class.self-start]="msg.direction === 'outbound'"
                     [class.self-end]="msg.direction === 'inbound'">
                  <div class="px-3 py-2 rounded-lg shadow-sm text-[13px] relative bubble group/bubble"
                       [class.bg-[#dcf8c6]]="msg.direction === 'outbound' && msg.messageType === 'text'"
                       [class.dark:bg-[#056162]]="msg.direction === 'outbound' && msg.messageType === 'text'"
                       [class.text-surface-900]="msg.direction === 'outbound' || msg.direction === 'inbound'"
                       [class.dark:text-white]="msg.direction === 'outbound' || msg.direction === 'inbound'"
                       [class.bg-white]="msg.direction === 'inbound'"
                       [class.dark:bg-[#202c33]]="msg.direction === 'inbound'"
                       [class.bubble-out]="msg.direction === 'outbound'"
                       [class.bubble-in]="msg.direction === 'inbound'">
                    
                    <!-- Quoted Message Display -->
                    @if (msg.quotedContent) {
                      <div class="mb-2 p-2 rounded bg-black/5 dark:bg-white/5 border-r-4 border-emerald-500 dark:border-emerald-400 text-[11px] opacity-80 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                           (click)="scrollToMessage(msg.quotedMessageId)">
                        <div class="font-black text-emerald-600 dark:text-emerald-400 mb-0.5 flex items-center gap-1">
                          <i class="pi pi-reply text-[10px]"></i>
                          الرد على الرسالة
                        </div>
                        <div class="truncate italic">{{ msg.quotedContent }}</div>
                      </div>
                    }

                    <!-- Group Sender Name -->
                    @if (selectedLead()?.isGroup && msg.direction === 'inbound') {
                      <div class="text-[11px] font-black text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5 leading-none">
                        <span class="hover:underline cursor-pointer">{{ msg.senderName || 'مشارك' }}</span>
                        <span class="text-[8px] opacity-40 font-normal">•</span>
                        <span class="text-[9px] opacity-50 font-mono tracking-tighter">{{ msg.senderJid?.split('@')[0] }}</span>
                      </div>
                    }
                    <!-- Media Content -->
                    @if (msg.messageType === 'sticker') {
                      <div class="p-1 flex justify-center">
                        <img [src]="msg.mediaUrl" 
                             class="block object-contain" 
                             style="width: 160px; height: 160px; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" 
                             alt="Sticker" />
                      </div>
                    } @else if (msg.messageType === 'image') {
                      <div class="mb-1 -mx-1 -mt-1 overflow-hidden rounded-t-lg bg-black/5 dark:bg-white/5 flex justify-center items-center min-h-[100px]">
                        <img [src]="msg.mediaUrl" 
                             class="max-w-full block cursor-pointer hover:opacity-95 transition-opacity" 
                             style="height: auto; width: auto; max-height: 500px; object-fit: contain; image-rendering: auto;"
                             alt="Image" />
                      </div>
                      @if (msg.content) {
                        <div class="whitespace-pre-wrap break-words leading-relaxed text-[#303030] dark:text-white pb-1 px-1">
                          {{ msg.content }}
                        </div>
                      }
                    } @else if (msg.messageType === 'audio') {
                      <div class="py-2 px-1 min-w-[220px]">
                        @if (msg.mediaUrl) {
                          <div class="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5 shadow-inner">
                            <audio #audioPlayer [src]="msg.mediaUrl" preload="metadata" class="hidden" 
                                   (timeupdate)="$any($event.target).currentTime" 
                                   (loadedmetadata)="$any($event.target).duration"
                                   (ended)="audioPlayer.pause(); audioPlayer.currentTime = 0">
                            </audio>
                            <p-button 
                              [icon]="(audioPlayer.paused || audioPlayer.ended) ? 'pi pi-play' : 'pi pi-pause'"
                              [rounded]="true"
                              [text]="true"
                              (click)="toggleAudio(audioPlayer)"
                              styleClass="w-10 h-10 !bg-emerald-500 !text-white flex items-center justify-center p-0 rtl-flip shadow-lg">
                            </p-button>
                            <div class="flex-1 flex flex-col gap-1.5">
                              <input 
                                type="range" 
                                min="0" 
                                [max]="audioPlayer.duration || 100" 
                                [value]="audioPlayer.currentTime" 
                                (input)="audioPlayer.currentTime = $any($event.target).value"
                                (change)="audioPlayer.currentTime = $any($event.target).value"
                                class="w-full h-1 bg-black/10 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                              <div class="flex justify-between text-[9px] font-bold text-surface-500 dark:text-surface-400">
                                <span>{{ (audioPlayer.currentTime * 1000) | date:'mm:ss' }}</span>
                                <span>{{ (audioPlayer.duration * 1000) | date:'mm:ss' }}</span>
                              </div>
                            </div>
                            <div class="relative shrink-0">
                              <i class="pi pi-microphone text-emerald-500 text-lg"></i>
                              <div class="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-surface-800"></div>
                            </div>
                          </div>
                        } @else {
                          <div class="p-3 bg-surface-100 dark:bg-surface-800 rounded-xl text-[10px] text-surface-400 italic">
                            <i class="pi pi-exclamation-triangle mr-1"></i>
                            تعذر تحميل الملف الصوتي
                          </div>
                        }
                      </div>
                    } @else if (msg.messageType === 'document') {
                      <div class="py-2 px-1 min-w-[200px]">
                        <div class="flex items-center gap-3 bg-black/5 dark:bg-white/5 rounded-xl p-3 border border-black/5 dark:border-white/5 shadow-inner">
                          <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600">
                            <i class="pi pi-file text-lg"></i>
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs font-black truncate text-surface-900 dark:text-white">{{ msg.content || 'Document' }}</div>
                            <div class="text-[9px] text-surface-500 uppercase mt-0.5">{{ msg.mediaUrl ? 'File' : 'No URL' }}</div>
                          </div>
                          @if (msg.mediaUrl) {
                            <a [href]="msg.mediaUrl" target="_blank" class="w-8 h-8 rounded-full bg-white dark:bg-surface-800 flex items-center justify-center shadow-sm text-surface-600 hover:text-emerald-500 transition-colors">
                              <i class="pi pi-download text-xs"></i>
                            </a>
                          }
                        </div>
                      </div>
                    } @else if (msg.messageType === 'video') {
                      <div class="mb-1 -mx-1 -mt-1 overflow-hidden rounded-t-lg bg-black flex justify-center items-center">
                        <video [src]="msg.mediaUrl" 
                               controls 
                               class="max-w-full block max-h-[400px]">
                        </video>
                      </div>
                      @if (msg.content) {
                        <div class="whitespace-pre-wrap break-words leading-relaxed text-[#303030] dark:text-white pb-1 px-1">
                          {{ msg.content }}
                        </div>
                      }
                    } @else {
                      <!-- Text Content -->
                      <div class="whitespace-pre-wrap break-words leading-relaxed text-inherit">
                        {{ msg.content }}
                      </div>
                    }

                    <div class="flex items-center justify-end gap-1 mt-1 opacity-70">
                      @if (msg.direction === 'outbound') {
                        <span class="text-[8px] font-black border-l border-black/10 pl-1.5 leading-none">
                          {{ msg.sentByAgentName || 'من الهاتف' }}
                        </span>
                      }

                      <span class="text-[9px] uppercase whitespace-nowrap leading-none">
                        {{ msg.timestamp | date:'h:mm a' }}
                      </span>

                      @if (msg.direction === 'outbound') {
                        <div class="flex items-center ml-0.5" style="width: 14px; position: relative;">
                          @if (msg.status === 'pending') {
                            <i class="pi pi-clock text-[8px] text-surface-400"></i>
                          } @else if (msg.status === 'read') {
                            <i class="pi pi-check text-[10px] text-blue-500 font-bold" style="position: absolute; right: 4px;"></i>
                            <i class="pi pi-check text-[10px] text-blue-500 font-bold" style="position: absolute; right: 0;"></i>
                          } @else if (msg.status === 'delivered') {
                            <i class="pi pi-check text-[10px] text-surface-500" style="position: absolute; right: 4px;"></i>
                            <i class="pi pi-check text-[10px] text-surface-500" style="position: absolute; right: 0;"></i>
                          } @else {
                            <i class="pi pi-check text-[10px] text-surface-500"></i>
                          }
                        </div>
                      }
                    </div>

                    <!-- Reply Button (Action) - Absolute Positioned -->
                    <button 
                      class="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white dark:bg-surface-800 shadow-xl border border-surface-200 dark:border-surface-700 items-center justify-center text-surface-500 hover:text-emerald-500 hover:scale-110 transition-all opacity-0 group-hover/bubble:opacity-100 hidden md:flex"
                      (click)="setReplyTo(msg)"
                      title="رد على المحادثة">
                      <i class="pi pi-reply text-xs"></i>
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- AI Suggestion Bubble -->
            @if (aiSuggestion() || aiSuggestionLoading()) {
              <div class="px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border-t dark:border-surface-700 animate-fade-in relative z-20">
                <div class="max-w-5xl mx-auto flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm shrink-0 mt-1">
                    @if (aiSuggestionLoading()) {
                      <i class="pi pi-spin pi-spinner text-xs"></i>
                    } @else {
                      <i class="pi pi-sparkles text-xs"></i>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">اقتراح الذكاء الاصطناعي</span>
                      @if (!aiSuggestionLoading()) {
                        <button (click)="aiSuggestion.set(null)" class="text-surface-400 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer p-0">
                          <i class="pi pi-times text-[10px]"></i>
                        </button>
                      }
                    </div>
                    @if (aiSuggestionLoading()) {
                      <div class="flex flex-col gap-1">
                        <div class="h-3 w-3/4 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
                        <div class="h-3 w-1/2 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
                      </div>
                    } @else {
                      <div (click)="useAiSuggestion()" class="text-xs text-surface-700 dark:text-surface-200 leading-relaxed cursor-pointer hover:bg-white/50 dark:hover:bg-surface-800/50 p-2 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 transition-all group">
                        {{ aiSuggestion() }}
                        <div class="text-[9px] text-indigo-500 mt-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity">إضغط لاستخدام هذا الرد ✨</div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Reply Preview (Above Input) -->
            @if (replyToMessage()) {
              <div class="px-4 py-3 bg-surface-100 dark:bg-surface-800 border-t dark:border-surface-700 animate-fade-in relative z-20 flex items-center gap-3">
                 <div class="w-1 bg-emerald-500 rounded h-10 shrink-0"></div>
                 <div class="flex-1 min-w-0">
                    <div class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-1">الرد على هذه الرسالة...</div>
                    <div class="text-xs text-surface-500 truncate italic">{{ replyToMessage()?.content }}</div>
                 </div>
                 <p-button 
                   icon="pi pi-times" 
                   [text]="true" 
                   (click)="replyToMessage.set(null)"
                   styleClass="p-0 w-8 h-8 text-surface-400">
                 </p-button>
              </div>
            }

            <div class="p-3 bg-[#f0f2f5] dark:bg-surface-900 border-t dark:border-surface-700">
              <form (ngSubmit)="sendMessage()" class="flex items-center gap-2 max-w-5xl mx-auto">
                <!-- Send Button (Moved to Left) -->
                @if (isRecording()) {
                  <p-button 
                    type="button"
                    icon="pi pi-send" 
                    (click)="stopAndSendRecording()"
                    severity="success"
                    styleClass="rounded-full w-10 h-10 p-0 flex items-center justify-center -scale-x-100">
                  </p-button>
                } @else {
                  <p-button 
                    type="submit"
                    icon="pi pi-send" 
                    [disabled]="!newMessageText.trim() || sending()"
                    styleClass="rounded-full w-10 h-10 p-0 flex items-center justify-center -scale-x-100">
                  </p-button>
                }

                <!-- Input Field (Flex-1) -->
                @if (isRecording()) {
                  <div class="flex-1 bg-white dark:bg-surface-800 rounded-full px-4 py-2 flex items-center justify-between border border-emerald-100 dark:border-emerald-900/30 animate-pulse min-w-0">
                    <div class="flex items-center gap-2 truncate">
                      <span class="relative flex h-2 w-2 shrink-0">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span class="text-[11px] font-black text-red-500 truncate">جاري التسجيل...</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                       <span class="text-xs font-black font-mono text-surface-600 dark:text-surface-300">{{ recordingDuration() }}</span>
                       <p-button 
                        type="button"
                        icon="pi pi-trash" 
                        [text]="true"
                        (click)="cancelRecording()"
                        severity="danger"
                        styleClass="p-0 w-7 h-7 text-xs">
                      </p-button>
                    </div>
                  </div>
                } @else {
                  <div class="flex-1 relative min-w-0">
                    <input 
                      pInputText 
                      [(ngModel)]="newMessageText" 
                      name="msg"
                      [disabled]="isRecording()"
                      [placeholder]="isRecording() ? 'جاري التسجيل...' : ('chat.type_message_placeholder' | t)"
                      class="w-full rounded-full bg-white dark:bg-surface-800 border-none px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary/20 shadow-sm"
                      autocomplete="off" />
                  </div>
                }

                <!-- Essential Buttons -->
                <div class="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <p-button 
                    type="button" 
                    [icon]="isRecording() ? 'pi pi-stop-circle' : 'pi pi-microphone'" 
                    [text]="true" 
                    (click)="isRecording() ? cancelRecording() : startRecording()"
                    [severity]="isRecording() ? 'danger' : 'secondary'"
                    styleClass="p-0 w-9 h-9 sm:w-10 sm:h-10 text-lg text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-all">
                  </p-button>

                  @if (!isRecording()) {
                    <p-button 
                      type="button" 
                      icon="pi pi-sparkles" 
                      [text]="true" 
                      (click)="triggerAiSuggestion()"
                      [loading]="aiSuggestionLoading()"
                      severity="help"
                      styleClass="p-0 w-9 h-9 sm:w-10 sm:h-10 text-lg text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all">
                    </p-button>

                    <p-button 
                      type="button" 
                      icon="pi pi-list" 
                      [text]="true" 
                      (click)="templateOp.toggle($event)"
                      severity="success"
                      styleClass="p-0 w-9 h-9 sm:w-10 sm:h-10 text-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-all"
                      pTooltip="ردود سريعة">
                    </p-button>

                    <p-button 
                      type="button" 
                      icon="pi pi-plus" 
                      [text]="true" 
                      (click)="attachOp.toggle($event)"
                      severity="secondary"
                      styleClass="p-0 w-9 h-9 sm:w-10 sm:h-10 text-lg text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-all">
                    </p-button>
                  }

                  <p-popover #attachOp styleClass="w-56 p-2 rounded-2xl border-none shadow-2xl overflow-hidden">
                    <div class="flex flex-col gap-1">
                      <button type="button" (click)="triggerFileUpload('image'); attachOp.hide()" class="flex items-right gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group text-right">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
                          <i class="pi pi-image text-lg"></i>
                        </div>
                        <span class="font-black text-xs text-surface-700 dark:text-surface-200">صورة</span>
                      </button>

                      <button type="button" (click)="triggerFileUpload('document'); attachOp.hide()" class="flex items-right gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group text-right">
                        <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
                          <i class="pi pi-file text-lg"></i>
                        </div>
                        <span class="font-black text-xs text-surface-700 dark:text-surface-200">ملف</span>
                      </button>

                      <button type="button" (click)="emojiOp.toggle($event); attachOp.hide()" class="flex lg:hidden items-right gap-3 p-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group text-right">
                        <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform shrink-0">
                          <i class="pi pi-face-smile text-lg"></i>
                        </div>
                        <span class="font-black text-xs text-surface-700 dark:text-surface-200">إيموجي</span>
                      </button>

                      <button type="button" (click)="triggerFileUpload('video'); attachOp.hide()" class="flex items-right gap-3 p-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group text-right">
                        <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform shrink-0">
                          <i class="pi pi-video text-lg"></i>
                        </div>
                        <span class="font-black text-xs text-surface-700 dark:text-surface-200">فيديو</span>
                      </button>
                    </div>
                  </p-popover>

                  <p-popover #emojiOp styleClass="p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <emoji-picker (emoji-click)="addEmoji($event)"></emoji-picker>
                  </p-popover>

                  <!-- Templates Popover -->
                  <p-popover #templateOp styleClass="w-72 p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <div class="bg-surface-50 dark:bg-surface-800 p-3 border-b dark:border-surface-700 flex justify-between items-center">
                      <span class="text-xs font-black text-emerald-600">القوالب والردود السريعة</span>
                    </div>
                    <div class="max-h-80 overflow-y-auto custom-scrollbar">
                      @for (t of templates(); track t._id) {
                        <div class="p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer border-b last:border-none dark:border-surface-700 transition-colors"
                             (click)="useTemplate(t.content); templateOp.hide()">
                          <div class="text-[11px] font-black text-surface-900 dark:text-white mb-1">{{ t.title }}</div>
                          <div class="text-[10px] text-surface-500 truncate">{{ t.content }}</div>
                        </div>
                      } @empty {
                        <div class="p-8 text-center text-surface-400 text-[10px]">لا توجد قوالب متاحة</div>
                      }
                    </div>
                  </p-popover>
                </div>

                <!-- Hidden Stickers Popover -->
                <p-popover #stickerOp styleClass="w-72 p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                  <div class="bg-surface-50 dark:bg-surface-800 p-3 border-b dark:border-surface-700 flex justify-between items-center">
                    <span class="text-xs font-black text-emerald-600">ملصقات سريعة</span>
                    <p-button icon="pi pi-upload" [text]="true" styleClass="p-0 w-6 h-6 text-xs" (click)="triggerFileUpload('sticker'); stickerOp.hide()" pTooltip="رفع ملصق خاص"></p-button>
                  </div>
                  <div class="p-2 grid grid-cols-4 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                    @for (s of quickStickers; track s.url) {
                      <div class="aspect-square rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-1 cursor-pointer transition-all hover:scale-110 flex items-center justify-center"
                           (click)="sendQuickSticker(s.url); stickerOp.hide()">
                        <img [src]="s.url" class="w-full h-full object-contain" />
                      </div>
                    }
                  </div>
                </p-popover>
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
      }

      <!-- Lead Details Sidebar (Right Column) -->
      @if (showingDetails() && selectedLead()) {
        <div class="hidden lg:flex w-80 flex-col bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm animate-slide-in-right">
          <!-- Sidebar Header -->
          <div class="p-5 border-b dark:border-surface-700 flex flex-col items-center">
             <div class="w-24 h-24 rounded-full bg-surface-100 dark:bg-surface-800 border-4 border-white dark:border-surface-900 shadow-lg overflow-hidden mb-4">
                @if (selectedLead()?.profilePicUrl) {
                  <img [src]="selectedLead()?.profilePicUrl" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-emerald-500 text-white text-3xl font-black">
                    {{ (selectedLead()?.name || '?').substring(0, 1).toUpperCase() }}
                  </div>
                }
             </div>
             <h2 class="text-lg font-black text-surface-900 dark:text-white mb-1">{{ selectedLead()?.name }}</h2>
             <span class="text-xs text-surface-500 font-bold dir-ltr">{{ selectedLead()?.phone }}</span>

             <div class="mt-4 flex gap-2 w-full">
                <button class="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2">
                  <i class="pi pi-phone text-[10px]"></i> اتصال
                </button>
                <button (click)="toggleArchive(selectedLead())" class="flex-1 py-2 px-3 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-surface-600 dark:text-surface-300 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2">
                  <i class="pi pi-archive text-[10px]"></i> {{ selectedLead()?.isArchived ? 'فك الأرشفة' : 'أرشفة' }}
                </button>
             </div>
          </div>

          <!-- Sidebar Content -->
          <div class="flex-1 overflow-y-auto p-5 custom-scrollbar">
             <!-- Status Section -->
             <div class="mb-6">
                <label class="block text-[10px] font-black text-surface-400 mb-2 uppercase tracking-wider">حالة العميل</label>
                <p-select 
                  [options]="leadStatuses" 
                  [(ngModel)]="selectedLead()!.status" 
                  (onChange)="updateLeadStatus($event.value)"
                  class="w-[100%] custom-select" 
                  styleClass="w-full rounded-xl border-surface-200 dark:border-surface-700 text-xs">
                  <ng-template #item let-item>
                    <div class="flex items-center gap-2 text-xs">
                      <div class="w-2 h-2 rounded-full" [class]="item.color"></div>
                      <span class="font-bold">{{ item.label }}</span>
                    </div>
                  </ng-template>
                </p-select>
             </div>

             <!-- Notes Section -->
             <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-[10px] font-black text-surface-400 uppercase tracking-wider">ملاحظات الموظف</label>
                  @if (isSavingNote()) {
                    <i class="pi pi-spin pi-spinner text-[10px] text-emerald-500"></i>
                  }
                </div>
                <textarea 
                  pInputTextarea 
                  [(ngModel)]="selectedLead()!.notes"
                  (blur)="updateLeadNote(selectedLead()!.notes || '')"
                  [placeholder]="'أضف ملاحظات عن هذا العميل...'"
                  class="w-full min-h-[100px] rounded-xl bg-surface-50 dark:bg-surface-800 border-none p-3 text-[11px] focus:ring-1 focus:ring-emerald-500/30 text-right leading-relaxed resize-none"></textarea>
             </div>

             <!-- Shared Media Section (Quick Preview) -->
             <div>
                <div class="flex justify-between items-center mb-3">
                  <label class="block text-[10px] font-black text-surface-400 uppercase tracking-wider">الوسائط المشتركة</label>
                  <button class="text-[9px] font-bold text-emerald-600 hover:underline">عرض الكل</button>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <!-- Recent Media Gallery -->
                  @for (msg of sharedMedia().slice(0, 12); track msg.id) {
                    <div class="aspect-square rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-surface-200 dark:border-surface-700">
                      @if (msg.messageType === 'image') {
                        <img [src]="msg.mediaUrl" class="w-full h-full object-cover" />
                      } @else if (msg.messageType === 'video') {
                        <div class="w-full h-full flex items-center justify-center bg-black relative">
                          <img [src]="msg.thumbnailUrl || msg.mediaUrl" class="w-full h-full object-cover opacity-60" />
                          <i class="pi pi-play-circle text-white text-xl absolute"></i>
                        </div>
                      }
                    </div>
                  } @empty {
                    <div class="col-span-3 py-4 text-center text-[10px] text-surface-400 italic">لا توجد وسائط مؤخراً</div>
                  }
                </div>
             </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .whatsapp-bg {
        background-color: #efeae2;
        background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
        background-repeat: repeat;
        background-blend-mode: overlay;
        transition: background-color 0.3s ease;
      }
      :host-context(.dark) .whatsapp-bg,
      .dark .whatsapp-bg {
        background-color: #0b141a !important;
        background-image: none !important;
      }
      :host-context(.dark) .bubble-out {
        border-color: #056162;
      }
      :host-context(.dark) .bubble-in {
        border-color: #202c33;
      }
      .bubble {
        min-width: 60px;
      }
      .bubble-out {
        border-top-right-radius: 2px !important;
        border-top-left-radius: 12px !important;
      }
      .bubble-in {
        border-top-left-radius: 2px !important;
        border-top-right-radius: 12px !important;
      }
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
      
      emoji-picker {
        --num-columns: 8;
        --category-emoji-size: 1rem;
        --emoji-size: 1.25rem;
        width: 320px;
        height: 400px;
      }

      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 10px;
      }
      .dir-ltr {
        direction: ltr;
      }
      .rtl-flip {
        transform: scaleX(-1);
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
  private readonly messageService = inject(MessageService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('op') emojiPopover!: Popover;
  @ViewChild('stickerOp') stickerPopover!: Popover;
  @ViewChild('attachOp') attachPopover!: Popover;

  selectedChannel = signal<WhatsappChannel | null>(null);
  targetPhone = signal<string | null>(null);
  currentLeadId = signal<string | null>(null);
  currentLeadName = signal<string | null>(null);
  selectedLead = computed(() => {
    const id = this.currentLeadId();
    return this.leadsStore.allLeads().find(l => l.id === id) || null;
  });
  
  isMobile = signal(false);

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  private checkMobile() {
    const isSmall = window.innerWidth < 1100;
    this.isMobile.set(isSmall);
  }

  backToList() {
    this.targetPhone.set(null);
    this.currentLeadId.set(null);
    this.currentLeadName.set(null);
    this.messages.set([]);
  }
  
  leadSearchTerm = signal('');
  messageSearchTerm = signal('');
  currentFilter = signal<'all' | 'unread' | 'groups' | 'archived'>('all');

  totalUnread = computed(() => {
    return this.leadsStore.allLeads().reduce((acc, l) => acc + (l.unreadCount || 0), 0);
  });

  sharedMedia = computed(() => {
    return this.messages().filter(m => m.messageType === 'image' || m.messageType === 'video').reverse();
  });

  filteredMessages = computed(() => {
    const term = this.messageSearchTerm().toLowerCase();
    if (!term) return this.messages();
    return this.messages().filter(m => 
      m.content?.toLowerCase().includes(term) || 
      m.senderName?.toLowerCase().includes(term)
    );
  });

  filteredLeads = computed(() => {
    const term = this.leadSearchTerm().toLowerCase();
    const filter = this.currentFilter();
    
    // Filter to show only leads with conversations (lastMessageAt is not null)
    let leads = this.leadsStore.allLeads().filter(l => !!l.lastMessageAt);
    
    // Default: Exclude archived unless current filter is 'archived'
    if (filter !== 'archived') {
      leads = leads.filter(l => !l.isArchived);
    } else {
      leads = leads.filter(l => !!l.isArchived);
    }

    // Apply Specific Filter
    if (filter === 'unread') {
      leads = leads.filter(l => (l.unreadCount || 0) > 0);
    } else if (filter === 'groups') {
      leads = leads.filter(l => !!l.isGroup);
    }
    
    // Create copy for sorting
    leads = [...leads];
    
    // Sort by lastMessageAt (descending)
    leads.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    if (!term) return leads.slice(0, 30);
    return leads.filter(l => 
      l.name.toLowerCase().includes(term) || 
      l.phone.includes(term)
    ).slice(0, 40);
  });

  messages = signal<any[]>([]);
  newMessageText = '';
  sending = signal(false);
  aiSuggestion = signal<string | null>(null);
  aiSuggestionLoading = signal(false);
  replyToMessage = signal<any>(null);
  templates = signal<any[]>([]);
  showingDetails = signal(false);
  messageSearchActive = signal(false);
  isSavingNote = signal(false);
  
  leadStatuses = [
    { label: 'جديد', value: LeadStatus.NEW, icon: 'pi pi-plus', color: 'bg-blue-500' },
    { label: 'متابع', value: LeadStatus.FOLLOW_UP, icon: 'pi pi-sync', color: 'bg-orange-500' },
    { label: 'تم البيع', value: LeadStatus.CLOSED_WON, icon: 'pi pi-check-circle', color: 'bg-emerald-500' },
    { label: 'لم يكتمل', value: LeadStatus.CLOSED_LOST, icon: 'pi pi-times-circle', color: 'bg-red-500' },
  ];

  private messagesUnsubscribe?: () => void;
  private globalMessagesUnsubscribe?: () => void;

  // Audio Recording
  isRecording = signal(false);
  recordingDuration = signal('00:00');
  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private recordingTimer?: any;
  private recordingStartTime?: number;

  startRecording() {
    // Check supported types, prefer webm/opus which is standard for browsers
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/ogg;codecs=opus';

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream, { mimeType });
        this.audioChunks = [];
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) this.audioChunks.push(event.data);
        };
        this.mediaRecorder.start();
        
        this.isRecording.set(true);
        this.recordingStartTime = Date.now();
        this.startRecordingTimer();
      })
      .catch(err => {
        console.error('Could not start recording', err);
        let errorMsg = 'تعذر بدء التسجيل. يرجى التأكد من توصيل الميكروفون وإعطاء صلاحية الوصول.';
        if (err.name === 'NotFoundError') {
          errorMsg = 'لم يتم العثور على ميكروفون متصل بجهازك.';
        } else if (err.name === 'NotAllowedError') {
          errorMsg = 'تم رفض صلاحية الوصول للميكروفون. يرجى تفعيلها من إعدادات المتصفح.';
        }
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطأ في التسجيل', 
          detail: errorMsg 
        });
      });
  }

  private startRecordingTimer() {
    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      const elapsed = Math.floor((Date.now() - (this.recordingStartTime || 0)) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      this.recordingDuration.set(`${minutes}:${seconds}`);
    }, 1000);
  }

  cancelRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    this.stopRecordingTimer();
    this.isRecording.set(false);
    this.audioChunks = [];
  }

  private stopRecordingTimer() {
    if (this.recordingTimer) clearInterval(this.recordingTimer);
    this.recordingDuration.set('00:00');
  }

  stopAndSendRecording() {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.onstop = () => {
      // Force audio/ogg; codecs=opus for WhatsApp compatibility
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/ogg; codecs=opus' });
      const file = new File([audioBlob], `recording_${Date.now()}.ogg`, { type: 'audio/ogg' });
      
      // Upload using same logic as onFileSelected
      this.currentFileType = 'audio';
      this.uploadAndSend(file);

      this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
    };

    this.mediaRecorder.stop();
    this.stopRecordingTimer();
    this.isRecording.set(false);
  }

  private uploadAndSend(file: File) {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    const phone = this.targetPhone();
    if (!channel || (!leadId && !phone)) return;

    this.sending.set(true);
    const formData = new FormData();
    formData.append('file', file);

    fetch('https://entec.store/api/upload.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then((result: any) => {
      const mediaUrl = result.url || result.file_url;
      if (mediaUrl) {
        // For documents, use original filename if possible, otherwise from newMessageText
        const contentVal = this.currentFileType === 'document' ? (file.name || this.newMessageText) : this.newMessageText;
        
        const quote = this.replyToMessage();
        this.replyToMessage.set(null); // clear

        this.whatsappService.sendMessage(
          channel.id, 
          leadId, 
          contentVal, 
          this.currentFileType, 
          mediaUrl,
          this.targetPhone() || undefined,
          quote?.waMessageId,
          quote?.content
        ).subscribe({
          next: () => {
            this.sending.set(false);
          },
          error: () => this.sending.set(false)
        });
      }
    })
    .catch(() => this.sending.set(false));
  }

  toggleArchive(lead: any) {
    if (!lead) return;
    const channelId = this.selectedChannel()?.id;
    this.whatsappService.toggleArchive(lead.id, channelId).subscribe({
      next: (res) => {
        this.leadsStore.updateLeadLocal(lead.id, { isArchived: res.isArchived });
        // Clear selection if unarchiving from archive list OR archiving from all list
        this.backToList();
        this.messageService.add({ 
            severity: 'success', 
            summary: 'نجاح', 
            detail: res.isArchived ? 'تمت أرشفة المحادثة بنجاح' : 'تم إلغاء أرشفة المحادثة' 
        });
      }
    });
  }

  private typingTimeout: any;
  
  onTextChange() {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    if (!channel || !leadId) return;

    this.whatsappService.updatePresence(channel.id, leadId, 'composing').subscribe();

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.whatsappService.updatePresence(channel.id, leadId, 'available').subscribe();
    }, 3000);
  }

  modifyChat(action: any) {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    if (!channel || !leadId) return;

    this.whatsappService.modifyChat(channel.id, leadId, action).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تنفيذ العملية بنجاح' });
      }
    });
  }

  blockUser() {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    if (!channel || !leadId) return;

    if (!confirm('هل أنت متأكد من حظر هذا المستخدم؟')) return;

    this.whatsappService.blockUser(channel.id, leadId, 'block').subscribe({
      next: () => {
        this.messageService.add({ severity: 'warn', summary: 'تم الحظر', detail: 'تم حظر المستخدم بنجاح' });
      }
    });
  }

  sendLocationPrompt() {
    const prompt = window.prompt('أدخل الإحداثيات (lat,lng) واسم الموقع مفصولين بـ | مثال: 24.7136|46.6753|الرياض|العليا');
    if (prompt) this.sendDirectly(prompt, 'location');
  }

  sendPollPrompt() {
    const prompt = window.prompt('أدخل السؤال والخيارات مفصولة بـ | مثال: هل الموعد مناسب؟|نعم|لا|ربما');
    if (prompt) this.sendDirectly(prompt, 'poll');
  }

  sendContactPrompt() {
    const prompt = window.prompt('أدخل اسم جهة الاتصال والـ VCard مفصولين بـ |');
    if (prompt) this.sendDirectly(prompt, 'contact');
  }

  private sendDirectly(content: string, type: string) {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    if (!channel || !leadId) return;
    this.whatsappService.sendMessage(channel.id, leadId, content, type).subscribe();
  }

  triggerDocUpload() {
    this.triggerFileUpload('document');
  }

  toggleMessageSearch() {
    this.messageSearchActive.set(!this.messageSearchActive());
    if (!this.messageSearchActive()) {
      this.messageSearchTerm.set('');
    }
  }

  reconnect() {
    const channel = this.selectedChannel();
    if (channel) {
      this.store.reconnectChannel(channel.id);
      this.messageService.add({ severity: 'info', summary: 'جاري الاتصال', detail: 'يتم الآن محاولة إعادة ربط القناة...' });
    }
  }

  updateLeadStatus(status: LeadStatus) {
    const lead = this.selectedLead();
    if (!lead) return;
    this.leadsStore.updateLead({ id: lead.id, changes: { status } });
    this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث حالة العميل' });
  }

  updateLeadNote(notes: string) {
    const lead = this.selectedLead();
    if (!lead) return;
    this.isSavingNote.set(true);
    this.leadsStore.updateLead({ id: lead.id, changes: { notes } });
    setTimeout(() => this.isSavingNote.set(false), 500);
  }

  toggleAudio(player: HTMLAudioElement) {
    if (player.paused || player.ended) {
      player.play().catch(err => {
        console.error('Audio playback failed:', err);
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'تنبيه', 
          detail: 'تعذر تشغيل الملف الصوتي. قد يكون المتصفح يمنع التشغيل التلقائي.' 
        });
      });
    } else {
      player.pause();
    }
  }

  getAvatarBg(name: string): string {
    const colors = [
      '#FF5722', '#2196F3', '#4CAF50', '#FFC107', '#9C27B0', 
      '#00BCD4', '#E91E63', '#673AB7', '#3F51B5', '#8BC34A'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  setReplyTo(msg: any) {
    this.replyToMessage.set(msg);
    // Focus input
    setTimeout(() => {
      const input = document.querySelector('input[name="msg"]') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  }

  scrollToMessage(messageId: string) {
    const el = document.querySelector(`[data-msg-id="${messageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-emerald-500/20');
      setTimeout(() => el.classList.remove('bg-emerald-500/20'), 2000);
    }
  }

  addEmoji(event: any) {
    this.newMessageText += event.detail.unicode;
  }

  useTemplate(content: string) {
    this.newMessageText += (this.newMessageText ? ' ' : '') + content;
  }

  currentFileType: 'image' | 'audio' | 'sticker' | 'document' | 'video' | 'text' = 'text';

  quickStickers = [
    { name: 'Smile', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/01_Cuppy_smile.webp' },
    { name: 'LOL', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/02_Cuppy_lol.webp' },
    { name: 'Love', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/06_Cuppy_love.webp' },
    { name: 'Sad', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/04_Cuppy_sad.webp' },
    { name: 'Angry', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/07_Cuppy_hate.webp' },
    { name: 'Search', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/22_Cuppy_search.webp' },
    { name: 'Shrug', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/26_Cuppy_shrug.webp' },
    { name: 'No', url: 'https://raw.githubusercontent.com/WhatsApp/stickers/main/Android/app/src/main/assets/1/27_Cuppy_no.webp' }
  ];

  sendQuickSticker(url: string) {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    if (!channel || !leadId) return;

    this.whatsappService.sendMessage(channel.id, leadId, '', 'sticker', url).subscribe();
  }

  triggerFileUpload(type: 'image' | 'audio' | 'sticker' | 'document' | 'video') {
    this.currentFileType = type;
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.uploadAndSend(file);
    event.target.value = ''; // clear input
  }

  constructor() {
    // Auto-select first channel when channels are loaded
    effect(() => {
      const channels = this.store.channels();
      if (channels.length > 0 && !this.selectedChannel()) {
        this.selectedChannel.set(channels[0]);
      }
    });

    // Sync listeners when channel or phone changes
    effect(() => {
      const channel = this.selectedChannel();
      const phone = this.targetPhone();
      if (channel) {
        this.startGlobalMessagesListening(channel.id);
        if (phone) {
          this.startMessagesListening(channel.id, phone);
        } else {
          this.stopMessagesListening();
        }
      } else {
        this.stopGlobalMessagesListening();
        this.stopMessagesListening();
      }
    });
  }

  startGlobalMessagesListening(channelId: string) {
    if (this.globalMessagesUnsubscribe) {
      this.globalMessagesUnsubscribe();
    }

    const messagesRef = collection(db, 'whatsappChannels', channelId, 'messages');
    // Only listen to new messages from now on
    const q = query(
      messagesRef,
      where('timestamp', '>=', Timestamp.now()),
      orderBy('timestamp', 'asc')
    );

    let isInitialLoad = true;
    this.globalMessagesUnsubscribe = onSnapshot(q, (snapshot) => {
      if (isInitialLoad) {
        isInitialLoad = false;
        return; // Skip initial empty/matching snapshot to avoid reloading on mount
      }

      let needsReload = false;
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const leadId = data['leadId'];
          
          if (leadId) {
             const leadExists = this.leadsStore.allLeads().some(l => l.id === leadId);
             if (leadExists) {
                // Update local timestamp to push it to the top
                this.leadsStore.updateLeadLocal(leadId, { 
                  lastMessageAt: data['timestamp']?.toDate()?.toISOString() || new Date().toISOString() 
                });
             } else {
                needsReload = true; // New lead or not in current page, reload list
             }
          } else {
             needsReload = true; // Unresolved lead, reload to see if backend auto-created it
          }
        }
      });

      if (needsReload) {
        this.leadsStore.loadLeads({ page: 1, limit: 100 });
      }
    });
  }

  stopGlobalMessagesListening() {
    if (this.globalMessagesUnsubscribe) {
      this.globalMessagesUnsubscribe();
      this.globalMessagesUnsubscribe = undefined;
    }
  }

  ngOnInit() {
    this.checkMobile();
    this.store.startListening();
    this.leadsStore.loadLeads({ page: 1, limit: 100 });
    
    // Load Templates
    this.whatsappService.getTemplates().subscribe(res => this.templates.set(res));
    
    // Handle query params for direct chat from Leads
    this.route.queryParams.subscribe(params => {
      if (params['phone']) {
        this.targetPhone.set(params['phone']);
        this.currentLeadId.set(params['leadId'] || null);
        
        // Find lead name from store if possible
        const lead = this.leadsStore.allLeads().find(l => l.id === params['leadId'] || l.phone === params['phone']);
        if (lead) {
          this.currentLeadName.set(lead.name);
          this.targetPhone.set(lead.phone);
          if (!this.currentLeadId()) this.currentLeadId.set(lead.id);

          // Mark as read in backend
          if ((lead.unreadCount || 0) > 0) {
            this.whatsappService.markAsRead(lead.id).subscribe();
            // Optimistic update
            this.leadsStore.updateLeadLocal(lead.id, { unreadCount: 0 });
          }
        }

        if (this.isMobile() && params['phone']) {
          // Additional mobile logic if needed
        }

        // Handle specific channel if provided
        if (params['channelId']) {
          const channel = this.store.channels().find(c => c.id === params['channelId']);
          if (channel) {
            this.selectedChannel.set(channel);
          }
        }
      }

      // Auto-select first channel if none selected
      if (!this.selectedChannel() && this.store.channels().length > 0) {
        this.selectedChannel.set(this.store.channels()[0]);
      }
    });
  }

  onSearchLeads(event: any) {
    this.leadSearchTerm.set(event.target.value);
  }

  onSearchEnter(event: any) {
    const value = event.target.value.trim();
    if (!value) return;

    // Filter non-digits and apply smart formatting
    const cleanValue = this.whatsappService.formatPhoneForWhatsapp(value);
    
    // 1. Check if found in filtered results
    const existing = this.filteredLeads().find(l => 
      l.phone.replace(/\D/g, '').includes(cleanValue) || 
      cleanValue.includes(l.phone.replace(/\D/g, ''))
    );
    if (existing) {
      this.selectLead(existing);
      return;
    }

    // 2. Check in all leads (even those without messages)
    const existingInAll = this.leadsStore.allLeads().find(l => 
      this.whatsappService.formatPhoneForWhatsapp(l.phone).includes(cleanValue) || 
      cleanValue.includes(this.whatsappService.formatPhoneForWhatsapp(l.phone))
    );
    if (existingInAll) {
      this.selectLead(existingInAll);
      return;
    }

    // 3. If looks like a phone number, check on WhatsApp
    const isPhone = /^\+?\d{8,}$/.test(value);
    if (isPhone) {
      const channel = this.selectedChannel();
      if (!channel) {
        this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى اختيار قناة واتساب أولاً' });
        return;
      }

      this.messageService.add({ severity: 'info', summary: 'جاري التحقق', detail: 'يتم التحقق من الرقم في واتساب...' });
      
      const cleanPhoneToCheck = this.whatsappService.formatPhoneForWhatsapp(value);
      this.whatsappService.checkNumber(channel.id, cleanPhoneToCheck).subscribe({
        next: (result: any) => {
          if (result && result.exists) {
            const cleanPhone = result.jid.split('@')[0];
            this.targetPhone.set(cleanPhone);
            this.currentLeadName.set(cleanPhone);
            this.currentLeadId.set(null); 
            this.messageService.add({ severity: 'success', summary: 'موجود', detail: 'الرقم مسجل في واتساب، يمكنك مراسلته الآن' });
          } else {
            this.messageService.add({ severity: 'error', summary: 'غير موجود', detail: 'هذا الرقم غير مسجل في واتساب' });
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل التحقق من الرقم' });
        }
      });
    }
  }

  selectLead(lead: any) {
    console.log('[Inbox] Selecting lead:', lead.name, lead.phone);
    this.targetPhone.set(lead.phone);
    this.currentLeadId.set(lead.id);
    this.currentLeadName.set(lead.name);
    
    if (!this.selectedChannel() && this.store.channels().length > 0) {
      this.selectedChannel.set(this.store.channels()[0]);
    }

    // Mark as read in backend
    if (lead.unreadCount > 0) {
       this.whatsappService.markAsRead(lead.id).subscribe();
       // Optimistic update
       this.leadsStore.updateLeadLocal(lead.id, { unreadCount: 0 });
    }

    // On mobile, scroll to top of chat when selected
    if (this.isMobile()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private startMessagesListening(channelId: string, phoneNumber: string) {
    this.stopMessagesListening();

    const leadId = this.currentLeadId();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    console.log(`[Inbox] Starting listener for Channel: ${channelId}, Phone: ${cleanPhone}, LeadId: ${leadId}`);

    const messagesRef = collection(db, 'whatsappChannels', channelId, 'messages');
    
    // To get the LATEST messages, we order by desc and take a limit.
    // Then we will reverse them in the UI to show oldest at top.
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    this.messagesUnsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`[Inbox] Received ${snapshot.size} messages from Firestore`);
      
      const allMsgs = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            timestamp: (data['timestamp'] as Timestamp)?.toDate() || new Date()
          } as any;
        })
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()); // Sort for UI (oldest first)

      const filteredMsgs = allMsgs.filter(m => {
        const msgPhone = String(m.externalNumber || '').replace(/\D/g, '');
        const searchPhone = String(cleanPhone || '').replace(/\D/g, '');
        const mLeadId = String(m.leadId || '').trim();
        const sLeadId = String(leadId || '').trim();

        // 1. Primary Match: Lead ID
        // If the backend correctly identified the lead, this is the most secure way
        if (sLeadId && mLeadId === sLeadId) return true;

        // 2. Secondary Match: Phone Number (Last 8 digits)
        // This handles cases where leadId might be missing but numbers match
        const isPhoneMatch = (msgPhone.length >= 8 && searchPhone.length >= 8) && 
                            (msgPhone.slice(-8) === searchPhone.slice(-8));

        if (isPhoneMatch) return true;

        // If it's an outbound message to this phone number, show it
        if (m.direction === 'outbound' && msgPhone.slice(-8) === searchPhone.slice(-8)) return true;

        return false;
      });

      console.log(`[Inbox] Displaying ${filteredMsgs.length} messages for this lead`);
      
      const prevCount = this.messages().length;
      this.messages.set(filteredMsgs);
      this.scrollToBottom();

      // Clear AI suggestion if we already replied (outbound)
      const lastMsg = filteredMsgs[filteredMsgs.length - 1];
      if (lastMsg?.direction === 'outbound') {
        this.aiSuggestion.set(null); 
      }
    }, (error) => {
      console.error('[Inbox] Firestore Subscription Error:', error);
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
    if (this.messagesUnsubscribe) this.messagesUnsubscribe();
    if (this.globalMessagesUnsubscribe) this.globalMessagesUnsubscribe();
    this.stopRecordingTimer();
  }

  sendMessage() {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    const text = this.newMessageText.trim();
    const phone = this.targetPhone();
    
    if (!channel || (!leadId && !phone)) {
      console.warn('[Inbox] Cannot send: Missing channel or recipient (leadId/phone)', { channel: !!channel, leadId, phone });
      return;
    }
    if (!text) return; // For text messages, we need text

    this.sending.set(true);
    this.whatsappService.sendMessage(channel.id, leadId, text, 'text', undefined, this.targetPhone() || undefined).subscribe({
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

  triggerAiSuggestion() {
    const channel = this.selectedChannel();
    const phone = this.targetPhone();
    if (!channel || !phone) return;

    this.aiSuggestionLoading.set(true);
    this.whatsappService.getAiSuggestion(channel.id, phone).subscribe({
      next: (res) => {
        this.aiSuggestion.set(res.suggestion);
        this.aiSuggestionLoading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.aiSuggestionLoading.set(false);
      }
    });
  }

  useAiSuggestion() {
    const suggestion = this.aiSuggestion();
    if (suggestion) {
      this.newMessageText = suggestion;
      this.aiSuggestion.set(null);
    }
  }

  fetchingHistory = signal(false);

  loadMoreHistory() {
    const channel = this.selectedChannel();
    const leadId = this.currentLeadId();
    if (!channel || !leadId) return;

    this.fetchingHistory.set(true);
    this.whatsappService.fetchHistory(leadId, channel.id, 50).subscribe({
      next: (res) => {
        this.fetchingHistory.set(false);
        this.messageService.add({ 
          severity: 'success', 
          summary: 'تم التحميل', 
          detail: `تم استرجاع ${res.count} رسالة قديمة` 
        });
      },
      error: (err) => {
        this.fetchingHistory.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'خطأ', 
          detail: 'فشل تحميل التاريخ: ' + (err.error?.message || 'خطأ غير معروف') 
        });
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
