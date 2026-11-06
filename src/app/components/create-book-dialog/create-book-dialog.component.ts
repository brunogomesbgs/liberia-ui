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
          <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px dashed #9fa8da; border-radius: 8px; background: #f8f9ff;">
            <label style="font-size: 0.85rem; font-weight: 500; color: #3f51b5;">
              Upload Book File (PDF, EPUB, TXT, MD) — or paste text below
            </label>
            <input type="file"
                   accept=".pdf,.epub,.txt,.md,.markdown"
                   (change)="onFileSelected($event)">
            <small *ngIf="selectedFile" style="color: #2e7d32;">
              Selected: {{ selectedFile.name }} ({{ (selectedFile.size / 1024) | number:'1.0-1' }} KB)
            </small>
          </div>

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

          <mat-form-field appearance="outline" *ngIf="!selectedFile">
            <mat-label>Content</mat-label>
            <textarea matInput formControlName="content" rows="10" placeholder="Paste book content here"></textarea>
            <mat-error *ngIf="bookForm.get('content')?.hasError('required')">Content is required when no file is uploaded</mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!canSubmit() || loading">
          {{ loading ? 'Ingesting & Chunking...' : 'Create Book' }}
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

  selectedFile: File | null = null;
  loading = false;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedFile = file;

    const contentCtrl = this.bookForm.get('content');
    if (file) {
      contentCtrl?.clearValidators();
      contentCtrl?.updateValueAndValidity();
      const currentTitle = this.bookForm.get('title')?.value;
      if (!currentTitle) {
        const inferredTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
        this.bookForm.patchValue({ title: inferredTitle });
      }
    } else {
      contentCtrl?.setValidators([Validators.required]);
      contentCtrl?.updateValueAndValidity();
    }
  }

  canSubmit(): boolean {
    if (this.selectedFile) {
      return !!(this.bookForm.get('title')?.valid && this.bookForm.get('author')?.valid);
    }
    return this.bookForm.valid;
  }

  onSubmit() {
    if (!this.canSubmit()) return;
    this.loading = true;
    const val = this.bookForm.value;

    const req$ = this.selectedFile
      ? this.bookService.uploadBook(this.selectedFile, val.title || undefined, val.author || undefined)
      : this.bookService.createBook({
          title: val.title!,
          author: val.author!,
          content: val.content!
        });

    req$.subscribe({
      next: (book) => {
        console.log('Book created successfully:', book);
        this.loading = false;
        this.dialogRef.close(book || true);
      },
      error: (err) => {
        this.loading = false;
        console.error('Failed to create book', err);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
