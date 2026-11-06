import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Book, CreateBookCommand, UpdateBookCommand } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private apiUrl = 'http://localhost:8000';
  private http = inject(HttpClient);

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/books`);
  }

  getBook(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/books/${id}`);
  }

  createBook(book: CreateBookCommand): Observable<Book> {
    return this.http.post<Book>(`${this.apiUrl}/books`, book);
  }

  uploadBook(file: File, title?: string, author?: string): Observable<Book> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    if (title) {
      formData.append('title', title);
    }
    if (author) {
      formData.append('author', author);
    }
    return this.http.post<Book>(`${this.apiUrl}/books/upload`, formData);
  }

  updateBook(id: string, payload: UpdateBookCommand): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/books/${id}`, payload);
  }
}
