import { Component, inject, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, effect, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
    TranslatePipe
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="flex h-[calc(100vh-9rem)] gap-4 overflow-hidden relative w-full">
      
      <!-- Sidebar (Channels & Leads) -->
      @if (!isMobile() || !targetPhone()) {
        <div class="w-full lg:w-85 flex flex-col bg-surface-50 dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm">
          
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
          
          <!-- Leads List -->
          <div class="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            <div class="flex flex-col gap-1">
              @for (lead of filteredLeads(); track lead.id) {
                <div 
                  class="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 group"
                  [class.bg-white]="targetPhone() === lead.phone"
                  [class.dark:bg-surface-800]="targetPhone() === lead.phone"
                  [class.shadow-sm]="targetPhone() === lead.phone"
                  [class.border-emerald-200]="targetPhone() === lead.phone"
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
                    @if (lead.isOnline) {
                      <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <div class="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                      </div>
                    }
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-0.5">
                      <span class="font-black text-sm truncate text-surface-900 dark:text-surface-100" [class.text-emerald-600]="targetPhone() === lead.phone">
                        {{ lead.name }}
                      </span>
                      @if (lead.lastMessageAt) {
                        <span class="text-[9px] text-surface-400 font-bold whitespace-nowrap">
                          {{ lead.lastMessageAt | date:'shortTime' }}
                        </span>
                      }
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="text-[11px] text-surface-500 font-bold truncate dir-ltr text-right w-full">
                        {{ lead.phone }}
                      </span>
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
        <div class="flex-1 flex flex-col bg-white dark:bg-surface-900 rounded-3xl border border-surface-200 dark:border-surface-700 overflow-hidden shadow-sm">
          @if (selectedChannel()) {
            <!-- Chat Header -->
            <div class="p-4 border-b dark:border-surface-700 bg-surface-50/50 dark:bg-surface-800/50 flex justify-between items-center shadow-sm relative z-10">
              <div class="flex items-center gap-3">
                @if (isMobile() && targetPhone()) {
                  <p-button 
                    icon="pi pi-arrow-right" 
                    [text]="true" 
                    (click)="backToList()"
                    styleClass="p-0 w-8 h-8 text-surface-600 lg:hidden">
                  </p-button>
                }
                <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary overflow-hidden border border-emerald-100 dark:border-emerald-800/50 shadow-sm">
                  @if (selectedLead()?.profilePicUrl) {
                    <img [src]="selectedLead()?.profilePicUrl" class="w-full h-full object-cover" />
                  } @else {
                    <i class="pi pi-user text-xl"></i>
                  }
                </div>
                <div class="flex flex-col">
                  <span class="font-black text-lg">{{ currentLeadName() || targetPhone() }}</span>
                  @if (selectedLead()?.isOnline) {
                    <span class="text-[10px] text-emerald-500 font-black animate-pulse flex items-center gap-1">
                      <i class="pi pi-circle-fill text-[6px]"></i>
                      متصل الآن
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div #scrollContainer class="flex-1 overflow-y-auto p-6 flex flex-col gap-2 whatsapp-bg">
              @for (msg of messages(); track msg.id) {
                <div class="flex flex-col max-w-[85%] mb-1" 
                     [class.self-start]="msg.direction === 'outbound'"
                     [class.self-end]="msg.direction === 'inbound'">
                  <div class="px-3 py-2 rounded-lg shadow-sm text-[13px] relative bubble"
                       [class.bg-[#dcf8c6]]="msg.direction === 'outbound'"
                       [class.bg-white]="msg.direction === 'inbound'"
                       [class.dark:bg-surface-800]="msg.direction === 'inbound'"
                       [class.bubble-out]="msg.direction === 'outbound'"
                       [class.bubble-in]="msg.direction === 'inbound'">
                    
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
                              styleClass="w-10 h-10 bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-md flex items-center justify-center p-0 rtl-flip">
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
                    } @else {
                      <!-- Text Content -->
                      <div class="whitespace-pre-wrap break-words leading-relaxed text-[#303030] dark:text-white">
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
                  </div>
                </div>
              }
            </div>

            <!-- Input Area -->
            <div class="p-3 bg-[#f0f2f5] dark:bg-surface-900 border-t dark:border-surface-700">
              <form (ngSubmit)="sendMessage()" class="flex items-center gap-2 max-w-5xl mx-auto">
                <div class="flex items-center gap-1">
                  <!-- Attachments Toggle -->
                  <p-button 
                    type="button" 
                    icon="pi pi-plus" 
                    [text]="true" 
                    (click)="attachOp.toggle($event)"
                    severity="secondary"
                    styleClass="p-0 w-10 h-10 text-xl text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-all">
                  </p-button>

                  <p-popover #attachOp styleClass="w-56 p-2 rounded-2xl border-none shadow-2xl overflow-hidden">
                    <div class="flex flex-col gap-1">
                      <button type="button" (click)="triggerFileUpload('image'); attachOp.hide()" class="flex items-center gap-3 p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group">
                        <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <i class="pi pi-image text-lg"></i>
                        </div>
                        <span class="text-sm font-black text-surface-700 dark:text-surface-200">{{ 'whatsapp.inbox.upload_image' | t }}</span>
                      </button>

                      <button type="button" (click)="triggerFileUpload('document'); attachOp.hide()" class="flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group">
                        <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                          <i class="pi pi-file text-lg"></i>
                        </div>
                        <span class="text-sm font-black text-surface-700 dark:text-surface-200">{{ 'whatsapp.inbox.upload_document' | t }}</span>
                      </button>

                      <button type="button" (click)="stickerOp.toggle($event); attachOp.hide()" class="flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors border-none bg-transparent w-full cursor-pointer group">
                        <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                          <i class="pi pi-bolt text-lg"></i>
                        </div>
                        <span class="text-sm font-black text-surface-700 dark:text-surface-200">{{ 'whatsapp.inbox.upload_sticker' | t }}</span>
                      </button>
                    </div>
                  </p-popover>

                  <!-- Voice Recording -->
                  <p-button 
                    type="button" 
                    [icon]="isRecording() ? 'pi pi-stop-circle' : 'pi pi-microphone'" 
                    [text]="true" 
                    (click)="isRecording() ? cancelRecording() : startRecording()"
                    [severity]="isRecording() ? 'danger' : 'secondary'"
                    [pTooltip]="isRecording() ? 'إلغاء التسجيل' : ('whatsapp.inbox.record_audio' | t)"
                    styleClass="p-0 w-10 h-10 text-xl text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-all">
                  </p-button>

                  <!-- Emoji Picker -->
                  <p-button 
                    type="button"
                    icon="pi pi-face-smile" 
                    [text]="true"
                    (click)="emojiOp.toggle($event)"
                    severity="secondary"
                    styleClass="p-0 w-10 h-10 text-xl text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-all">
                  </p-button>

                  <p-popover #emojiOp styleClass="p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                    <emoji-picker (emoji-click)="addEmoji($event)"></emoji-picker>
                  </p-popover>
                </div>

                @if (isRecording()) {
                  <div class="flex-1 bg-white dark:bg-surface-800 rounded-full px-5 py-2 flex items-center justify-between border border-emerald-100 dark:border-emerald-900/30 animate-pulse">
                    <div class="flex items-center gap-3">
                      <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span class="text-xs font-black text-red-500">جاري التسجيل...</span>
                    </div>
                    <span class="text-sm font-black font-mono text-surface-600 dark:text-surface-300">{{ recordingDuration() }}</span>
                    <p-button 
                      type="button"
                      icon="pi pi-trash" 
                      [text]="true"
                      (click)="cancelRecording()"
                      severity="danger"
                      styleClass="p-0 w-6 h-6 text-xs">
                    </p-button>
                  </div>
                } @else {
                  <div class="flex-1 relative">
                    <input 
                      pInputText 
                      [(ngModel)]="newMessageText" 
                      name="msg"
                      [disabled]="isRecording()"
                      [placeholder]="isRecording() ? 'جاري التسجيل...' : ('chat.type_message_placeholder' | t)"
                      class="w-full rounded-full bg-white dark:bg-surface-800 border-none px-5 py-2.5 text-sm focus:ring-1 focus:ring-primary/20"
                      autocomplete="off" />
                  </div>
                }

                @if (isRecording()) {
                  <p-button 
                    type="button"
                    icon="pi pi-send" 
                    (click)="stopAndSendRecording()"
                    severity="success"
                    styleClass="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                  </p-button>
                } @else {
                  <p-button 
                    type="submit"
                    icon="pi pi-send" 
                    [disabled]="!newMessageText.trim() || sending()"
                    styleClass="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                  </p-button>
                }

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
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .whatsapp-bg {
        background-color: #efeae2;
        background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
        background-repeat: repeat;
        background-blend-mode: overlay;
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

  private checkMobile() {
    const isSmall = window.innerWidth < 1100;
    console.log('[Inbox] Checking screen size:', window.innerWidth, 'isMobile:', isSmall);
    this.isMobile.set(isSmall);
  }

  backToList() {
    this.targetPhone.set(null);
    this.currentLeadId.set(null);
    this.currentLeadName.set(null);
    this.messages.set([]);
  }
  
  leadSearchTerm = signal('');
  filteredLeads = computed(() => {
    const term = this.leadSearchTerm().toLowerCase();
    // Filter to show only leads with conversations (lastMessageAt is not null)
    let leads = this.leadsStore.allLeads().filter(l => !!l.lastMessageAt);
    
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
    this.recordingTimer = setInterval(() => {
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
        
        this.whatsappService.sendMessage(
          channel.id, 
          leadId, 
          contentVal, 
          this.currentFileType, 
          mediaUrl,
          this.targetPhone() || undefined
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

  addEmoji(event: any) {
    this.newMessageText += event.detail.unicode;
  }

  currentFileType: 'image' | 'audio' | 'sticker' | 'document' | 'text' = 'text';

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

  triggerFileUpload(type: 'image' | 'audio' | 'sticker' | 'document') {
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
    this.store.startListening();
    this.leadsStore.loadLeads({ page: 1, limit: 100 });
    
    // Handle query params for direct chat from Leads
    this.route.queryParams.subscribe(params => {
      if (params['phone']) {
        this.targetPhone.set(params['phone']);
        this.currentLeadId.set(params['leadId'] || null);
        
        // Find lead name from store if possible
        const lead = this.leadsStore.allLeads().find(l => l.id === params['leadId'] || l.phone === params['phone']);
        if (lead) {
          this.currentLeadName.set(lead.name);
          if (!this.currentLeadId()) this.currentLeadId.set(lead.id);
        }

        // Handle specific channel if provided
        if (params['channelId']) {
            const channel = this.store.channels().find(c => c.id === params['channelId']);
            if (channel) {
                this.selectedChannel.set(channel);
            }
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
      this.messages.set(filteredMsgs);
      this.scrollToBottom();
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

  private scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
