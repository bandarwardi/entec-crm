import { Injectable, inject } from '@angular/core';
import { db } from '../firebase/firebase.config';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  doc, 
  updateDoc, 
  increment,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { AuthStore } from '../stores/auth.store';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private authStore = inject(AuthStore);
  
  // Real-time message listener
  getMessages(conversationId: string): Observable<any[]> {
    return new Observable(subscriber => {
      const messagesRef = collection(db, 'chatConversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
      
      return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data()['createdAt'] as Timestamp)?.toDate() || new Date()
        }));
        subscriber.next(messages);
      }, (error) => {
        subscriber.error(error);
      });
    });
  }

  // Real-time metadata listener (last message, unread count)
  getConversationMeta(conversationId: string): Observable<any> {
    return new Observable(subscriber => {
      const docRef = doc(db, 'chatConversations', conversationId);
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          subscriber.next({ id: doc.id, ...doc.data() });
        }
      });
    });
  }

  async sendMessage(conversationId: string, senderId: string, senderName: string, content: string, otherUserId: string) {
    const batch = writeBatch(db);
    
    // 1. Add Message
    const messagesRef = collection(db, 'chatConversations', conversationId, 'messages');
    const newMessageRef = doc(messagesRef);
    batch.set(newMessageRef, {
      senderId,
      senderName,
      content,
      mediaUrl: null,
      mediaType: null,
      originalFileName: null,
      isRead: false,
      createdAt: serverTimestamp()
    });

    // 2. Update Conversation Meta
    const convRef = doc(db, 'chatConversations', conversationId);
    batch.set(convRef, {
      lastMessageContent: content,
      lastMessageSenderId: senderId,
      lastMessageMediaType: null,
      lastMessageAt: serverTimestamp(),
      unreadCounts: {
        [otherUserId]: increment(1)
      }
    }, { merge: true });

    await batch.commit();
  }

  async sendMediaMessage(conversationId: string, senderId: string, senderName: string, mediaData: any, otherUserId: string) {
    const batch = writeBatch(db);
    
    // 1. Add Message
    const messagesRef = collection(db, 'chatConversations', conversationId, 'messages');
    const newMessageRef = doc(messagesRef);
    batch.set(newMessageRef, {
      senderId,
      senderName,
      content: null,
      mediaUrl: mediaData.mediaUrl,
      mediaType: mediaData.mediaType,
      originalFileName: mediaData.originalFileName,
      isRead: false,
      createdAt: serverTimestamp()
    });

    // 2. Update Conversation Meta
    const convRef = doc(db, 'chatConversations', conversationId);
    batch.set(convRef, {
      lastMessageContent: mediaData.mediaType === 'image' ? 'صورة' : 'ملف',
      lastMessageSenderId: senderId,
      lastMessageMediaType: mediaData.mediaType,
      lastMessageAt: serverTimestamp(),
      unreadCounts: {
        [otherUserId]: increment(1)
      }
    }, { merge: true });

    await batch.commit();
  }

  async markAsRead(conversationId: string, currentUserId: string) {
    const convRef = doc(db, 'chatConversations', conversationId);
    await updateDoc(convRef, {
      [`unreadCounts.${currentUserId}`]: 0
    });
  }

  // Observables for Store compatibility (will be triggered manually or via snapshot)
  newMessage$ = new Subject<any>().asObservable();
  userTyping$ = new Subject<any>().asObservable();
  messagesRead$ = new Subject<any>().asObservable();
}
