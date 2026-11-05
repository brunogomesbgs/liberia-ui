import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000'; // Assuming FastAPI runs here
  private tokenKey = 'liberia_token';

  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private http: HttpClient) {
    if (this.isBrowser) {
      const token = localStorage.getItem(this.tokenKey);
      if (token) {
        this.isAuthenticated.set(true);
        // We set a dummy user to indicate we are authenticated
        // The real user would be fetched from an /me endpoint
        const storedUser = localStorage.getItem('liberia_user');
        if (storedUser) {
          try {
            this.currentUser.set(JSON.parse(storedUser));
          } catch (e) {
            this.currentUser.set({ username: 'user' });
          }
        } else {
          this.currentUser.set({ username: 'user' });
        }
      }
    }
  }

  login(username: string, password: string): Observable<AuthResponse> {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post<AuthResponse>(`${this.apiUrl}/token`, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(res => {
        if (this.isBrowser) {
          localStorage.setItem(this.tokenKey, res.access_token);
          localStorage.setItem('liberia_user', JSON.stringify({ username }));
        }
        this.isAuthenticated.set(true);
        this.currentUser.set({ username });
      })
    );
  }

  register(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, {
      username,
      password_hash: password // Backend expects password_hash in UserIn_Pydantic
    }, {
      headers: { 'X-Origin': 'liberia-ui' }
    });
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem('liberia_user');
    }
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    if (this.isBrowser) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
}
