import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && isBrowser) {
        console.warn('Unauthorized request detected:', req.url);
        // Only redirect to login if we actually tried to send a token and it was rejected
        // or if it's a known protected route.
        if (token) {
          console.warn('Token rejected, logging out...');
          authService.logout();
          router.navigate(['/login']);
        } else if (!req.url.includes('/token')) {
          console.warn('Unauthorized request without token, redirecting to login...');
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
