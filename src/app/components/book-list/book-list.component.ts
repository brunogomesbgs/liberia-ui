import { Component, inject, OnInit, PLATFORM_ID, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BookService } from '../../services/book.service';
import { AuthService } from '../../services/auth.service';
import { Book } from '../../models/types';
import { CreateBookDialogComponent } from '../create-book-dialog/create-book-dialog.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatGridListModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  template: `
    <div class="book-list-page">
      <mat-toolbar color="primary">
        <span>Liberia Library</span>
        <span class="spacer"></span>
        <button mat-button (click)="openCreateBookDialog()">
          <mat-icon>add</mat-icon>
          Add Book
        </button>
        <button mat-icon-button (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <div class="content">
        <h1>Your Library</h1>
        <div *ngIf="loading" class="loading-state">
          <p>Loading books...</p>
          <mat-spinner diameter="40"></mat-spinner>
        </div>
        <div *ngIf="!loading && errorMessage" class="error-state">
          <p>{{ errorMessage }}</p>
          <button mat-raised-button color="primary" (click)="loadBooks()">Retry</button>
        </div>
        <mat-grid-list cols="4" rowHeight="400px" gutterSize="20px" *ngIf="!loading && !errorMessage && books.length > 0">
          <mat-grid-tile *ngFor="let book of books; trackBy: trackByBookId">
            <mat-card class="book-card">
              <div class="book-cover" [style.background-color]="getBookColor(book)">
                <mat-icon>{{ getBookIcon(book) }}</mat-icon>
              </div>
              <mat-card-header>
                <mat-card-title>{{ book.title }}</mat-card-title>
                <mat-card-subtitle>{{ book.author }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-actions>
                <button mat-raised-button color="accent" (click)="openChat(book)">
                  Discuss
                </button>
              </mat-card-actions>
            </mat-card>
          </mat-grid-tile>
        </mat-grid-list>
        <div *ngIf="!loading && books.length === 0" class="no-books">
          <p>No books found. Click "Add Book" to start your library.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .book-list-page {
      min-height: 100vh;
      background: #f7f9ff;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .content {
      padding: 40px;
    }
    h1 {
      margin-bottom: 30px;
      font-weight: 300;
      color: #333;
    }
    .book-card {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .book-cover {
      height: 200px;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
    }
    .book-cover mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
    }
    .loading-state, .no-books, .error-state {
      text-align: center;
      padding: 40px;
      font-size: 1.2rem;
      color: #666;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .error-state p {
      color: #f44336;
      margin-bottom: 16px;
    }
    mat-card-header {
      padding: 16px;
    }
    mat-card-actions {
      margin-top: auto;
      padding: 16px;
      justify-content: flex-end;
    }
  `]
})
export class BookListComponent implements OnInit {
  private router = inject(Router);
  private bookService = inject(BookService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  private platformId = inject(PLATFORM_ID);

  books: Book[] = [];
  loading = true;
  errorMessage = '';

  ngOnInit() {
    console.log('BookListComponent initialized, isBrowser:', isPlatformBrowser(this.platformId));
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.loadBooks();
      }, 0);
    } else {
      this.loading = false; // Don't show loading on server
    }
  }

  loadBooks() {
    console.log('loadBooks() called');
    this.loading = true;
    this.errorMessage = '';
    this.bookService.getBooks().subscribe({
      next: (books) => {
        console.log('Books loaded successfully:', books);
        this.zone.run(() => {
          this.books = [...books]; // Ensure new reference
          this.loading = false;
          this.cdr.detectChanges();
          console.log('State updated and change detection triggered, loading:', this.loading, 'books count:', this.books.length);
        });
      },
      error: (err) => {
        console.error('Failed to load books', err);
        this.zone.run(() => {
          this.loading = false;
          if (err.status === 401) {
            this.errorMessage = 'You are not authorized to view this page. Please log in again.';
          } else {
            this.errorMessage = 'Failed to load books. Please try again later.';
          }
          this.cdr.detectChanges();
        });
      }
    });
  }

  getBookIcon(book: Book): string {
    // Simple logic to assign icons based on title or just a default
    const title = book.title.toLowerCase();
    if (title.includes('1984')) return 'visibility';
    if (title.includes('gatsby')) return 'menu_book';
    if (title.includes('world')) return 'science';
    if (title.includes('hobbit')) return 'terrain';
    if (title.includes('punishment')) return 'gavel';
    return 'book';
  }

  getBookColor(book: Book): string {
    // Simple logic to assign colors based on id or just a default
    const colors = ['#3f51b5', '#f44336', '#4caf50', '#795548', '#607d8b'];
    const index = book.title.length % colors.length;
    return colors[index];
  }

  openChat(book: Book) {
    this.router.navigate(['/chat', book.id]);
  }

  openCreateBookDialog() {
    const dialogRef = this.dialog.open(CreateBookDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result) {
        console.log('Refreshing book list...');
        // Standard data refresh
        this.loadBooks();

        // If the user really wants a "reload" behavior, we can force a navigation refresh
        // but loadBooks() should be enough for data.
        // Given the user's feedback, maybe they expect the page to "feel" like it reloaded.
      }
    });
  }

  trackByBookId(index: number, book: Book): number | string {
    return book.id || book.title;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
