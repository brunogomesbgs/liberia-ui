import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="chat-page">
      <mat-toolbar color="primary">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <span>{{ bookTitle }}</span>
        <span class="spacer"></span>
        <span class="status" [class.connected]="chatService.connectionStatus() === 'connected'">
          {{ chatService.connectionStatus() }}
        </span>
      </mat-toolbar>

      <div class="messages-container" #scrollContainer>
        <div *ngIf="chatService.messages().length === 0 && !chatService.isConnecting()" class="empty-chat">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>Start a conversation about "{{ bookTitle }}"</p>
        </div>

        <div *ngIf="chatService.isConnecting()" class="loading-chat">
          <mat-spinner diameter="30"></mat-spinner>
          <p>Connecting to agent...</p>
        </div>

        <div *ngFor="let msg of chatService.messages(); let i = index"
             [class]="'message-wrapper ' + msg.sender">
          <div class="message-bubble">
            <div class="sender-label" *ngIf="msg.sender === 'admin'">Human Assistant</div>
            <p>{{ msg.content }}</p>
            <div class="message-footer">
              <div class="feedback-actions" *ngIf="msg.sender === 'agent' || msg.sender === 'admin'">
                <button mat-icon-button (click)="onFeedback(i, 'up')" [color]="msg.feedback === 'up' ? 'primary' : ''" title="Thumb Up">
                  <mat-icon [class.filled]="msg.feedback === 'up'">thumb_up</mat-icon>
                </button>
                <button mat-icon-button (click)="onFeedback(i, 'down')" [color]="msg.feedback === 'down' ? 'warn' : ''" title="Thumb Down">
                  <mat-icon [class.filled]="msg.feedback === 'down'">thumb_down</mat-icon>
                </button>
              </div>
              <span class="timestamp">{{ msg.timestamp | date:'shortTime' }}</span>
            </div>
          </div>
        </div>

        <div *ngIf="chatService.isTyping()" class="message-wrapper agent">
          <div class="message-bubble typing">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="input-area">
        <mat-form-field appearance="outline" class="full-width">
          <textarea matInput
                    placeholder="Ask about the book..."
                    [(ngModel)]="newMessage"
                    (keyup.enter)="send()"
                    rows="2"></textarea>
          <button mat-icon-button matSuffix (click)="send()" [disabled]="!newMessage.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </mat-form-field>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f7f9ff;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .status {
      font-size: 0.8rem;
      padding: 4px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.1);
    }
    .status.connected {
      background: #4caf50;
    }
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .empty-chat, .loading-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #757575;
      gap: 16px;
    }
    .empty-chat mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .message-wrapper {
      display: flex;
      max-width: 70%;
    }
    .message-wrapper.user {
      align-self: flex-end;
    }
    .message-wrapper.agent, .message-wrapper.admin {
      align-self: flex-start;
    }
    .message-bubble {
      padding: 12px 16px;
      border-radius: 12px;
      position: relative;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .user .message-bubble {
      background-color: #e3f2fd;
      border-bottom-right-radius: 0;
    }
    .agent .message-bubble, .admin .message-bubble {
      background-color: #fff;
      border-bottom-left-radius: 0;
      border-left: 4px solid #ffd740;
    }
    .admin .message-bubble {
      border-left-color: #ff5722;
    }
    .sender-label {
      font-size: 0.7rem;
      font-weight: bold;
      color: #ff5722;
      margin-bottom: 4px;
    }
    .message-bubble.typing {
      padding: 12px 20px;
    }
    .typing-indicator {
      display: flex;
      gap: 4px;
    }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #bdbdbd;
      border-radius: 50%;
      display: inline-block;
      animation: bounce 1.4s infinite ease-in-out both;
    }
    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }
    .timestamp {
      font-size: 0.7rem;
      color: #757575;
      display: block;
      text-align: right;
    }
    .message-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      gap: 8px;
    }
    .feedback-actions {
      display: flex;
      gap: 0;
    }
    .feedback-actions button {
      width: 32px;
      height: 32px;
      line-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .feedback-actions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .filled {
      font-variation-settings: 'FILL' 1;
    }
    .input-area {
      padding: 16px;
      background: #fff;
      border-top: 1px solid #e0e0e0;
    }
    .full-width {
      width: 100%;
    }
    textarea {
      resize: none;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  protected chatService = inject(ChatService);
  private bookService = inject(BookService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  newMessage = '';
  bookTitle = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const bookId = params['id'];
      this.bookTitle = 'Literary Dialogue';
      if (bookId) {
        this.bookService.getBook(bookId).subscribe({
          next: (book) => {
            if (book && book.title) {
              this.bookTitle = book.title;
            }
          },
          error: () => {}
        });
      }
      this.chatService.connect(bookId);
    });
  }

  goBack() {
    this.router.navigate(['/books']);
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  send() {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage.trim());
      this.newMessage = '';
    }
  }

  onFeedback(index: number, feedback: 'up' | 'down') {
    this.chatService.sendFeedback(index, feedback);
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
