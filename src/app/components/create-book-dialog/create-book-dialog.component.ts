import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { BookService } from '../../services/book.service';

@Component({
  selector: 'app-create-book-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>Add New Book</h2>
    <form [formGroup]="bookForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div style="display: flex; flex-direction: column; gap: 16px; min-width: 400px; padding-top: 8px;">
          <mat-form-field appearance="outline">
            <mat-label>Title</mat-label>
            <input matInput formControlName="title" placeholder="Enter book title">
            <mat-error *ngIf="bookForm.get('title')?.hasError('required')">Title is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Author</mat-label>
            <input matInput formControlName="author" placeholder="Enter author name">
            <mat-error *ngIf="bookForm.get('author')?.hasError('required')">Author is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Content</mat-label>
            <textarea matInput formControlName="content" rows="10" placeholder="Paste book content here"></textarea>
            <mat-error *ngIf="bookForm.get('content')?.hasError('required')">Content is required</mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="bookForm.invalid || loading">
          {{ loading ? 'Creating...' : 'Create Book' }}
        </button>
      </mat-dialog-actions>
    </form>
  `
})
export class CreateBookDialogComponent {
  private fb = inject(FormBuilder);
  private bookService = inject(BookService);
  private dialogRef = inject(MatDialogRef<CreateBookDialogComponent>);

  bookForm = this.fb.group({
    title: ['', Validators.required],
    author: ['', Validators.required],
    content: ['', Validators.required]
  });

  loading = false;

  onSubmit() {
    if (this.bookForm.valid) {
      this.loading = true;
      const val = this.bookForm.value;
      this.bookService.createBook({
        title: val.title!,
        author: val.author!,
        content: val.content!
      }).subscribe({
        next: (book) => {
          console.log('Book created successfully:', book);
          this.loading = false;
          // Ensure we pass a value that evaluates to true
          this.dialogRef.close(book || true);
        },
        error: (err) => {
          this.loading = false;
          console.error('Failed to create book', err);
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
