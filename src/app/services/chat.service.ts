import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Message } from '../models/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private wsUrl = 'ws://localhost:8000/chat';
  private socket: WebSocket | null = null;

  messages = signal<Message[]>([]);
  isConnecting = signal<boolean>(false);
  isTyping = signal<boolean>(false);
  connectionStatus = signal<'connected' | 'disconnected' | 'connecting'>('disconnected');
  activeBookId: string | null = null;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private authService: AuthService) {}

  connect(bookId?: string) {
    if (!this.isBrowser) return;
    const token = this.authService.getToken();
    if (!token) {
      console.warn('Cannot connect to WebSocket: No token found');
      return;
    }

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      if (this.activeBookId === bookId) {
        console.log('WebSocket already connected for this book');
        return;
      }
      console.log('Switching book context, reconnecting...');
      this.disconnect();
    }

    this.activeBookId = bookId || null;
    this.connectionStatus.set('connecting');
    this.isConnecting.set(true);

    // Reset messages for a new session
    this.messages.set([]);

    const url = this.activeBookId ? `${this.wsUrl}?bookId=${this.activeBookId}` : this.wsUrl;
    console.log('Connecting to WebSocket:', url);
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection opened');
      this.connectionStatus.set('connected');
      this.isConnecting.set(false);
      // Backend expects token as first message
      this.socket?.send(token);
    };

    this.socket.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      if (event.data === 'Authenticated') {
        console.log('Successfully authenticated with WebSocket');
        return;
      }
      if (event.data === 'Authentication failed') {
        console.error('WebSocket authentication failed');
        this.connectionStatus.set('disconnected');
        this.disconnect();
        return;
      }

      let sender: 'agent' | 'admin' = 'agent';
      let content = event.data;

      // Check if message is JSON and has a sender
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.sender && parsed.content) {
          sender = parsed.sender === 'admin' ? 'admin' : 'agent';
          content = parsed.content;
        }
      } catch (e) {
        // Not JSON, use default sender 'agent' and raw content
      }

      const newMessage: Message = {
        sender: sender,
        content: content,
        timestamp: new Date()
      };
      this.messages.update(msgs => [...msgs, newMessage]);
      this.isTyping.set(false);
    };

    this.socket.onclose = (event) => {
      console.log('WebSocket connection closed', event.code, event.reason);
      this.connectionStatus.set('disconnected');
      this.isConnecting.set(false);
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.connectionStatus.set('disconnected');
      this.isConnecting.set(false);
    };
  }

  sendMessage(content: string) {
    if (this.socket && this.connectionStatus() === 'connected') {
      console.log('Sending message to WebSocket:', content);
      const userMessage: Message = {
        sender: 'user',
        content,
        timestamp: new Date()
      };
      this.messages.update(msgs => [...msgs, userMessage]);
      this.isTyping.set(true);
      this.socket.send(content);
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }

  sendFeedback(index: number, feedback: 'up' | 'down') {
    let finalFeedback: 'up' | 'down' | undefined = feedback;
    
    this.messages.update(msgs => {
      const newMsgs = [...msgs];
      if (newMsgs[index]) {
        // Toggle if same feedback is clicked
        if (newMsgs[index].feedback === feedback) {
          delete newMsgs[index].feedback;
          finalFeedback = undefined;
        } else {
          newMsgs[index] = { ...newMsgs[index], feedback };
        }
      }
      return newMsgs;
    });

    if (this.socket && this.connectionStatus() === 'connected') {
      this.socket.send(JSON.stringify({
        type: 'feedback',
        messageIndex: index,
        totalMessages: this.messages().length,
        feedback: finalFeedback
      }));
    }
  }

  disconnect() {
    this.socket?.close();
  }
}
