import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the access token from local storage
    const accessToken = localStorage.getItem('accessToken');

    // Clone the request and add the authorization header if the access token exists
    let authRequest = request;
    if (accessToken) {
      authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${accessToken}`)
      });
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log('Error status:', error.status);
        if (error.status === 403 && !authRequest.url.includes('/auth/refresh-token')) {
          // If the access token is expired, try to refresh it
          console.log('Access token expired. Attempting to refresh token...');
          return this.authService.refreshToken().pipe(
            switchMap((response: any) => {
              console.log('Token refreshed successfully');
              // Store the new access token
              localStorage.setItem('accessToken', response.accessToken);

              // Clone the request with the new access token
              const newAuthRequest = request.clone({
                headers: request.headers.set('Authorization', `Bearer ${response.accessToken}`)
              });

              // Retry the request with the new access token
              return next.handle(newAuthRequest);
            }),
            catchError((refreshError) => {
              console.error('Error refreshing token:', refreshError);
              return throwError( () => new Error("refresh token error " + refreshError));
            })
          );
        }
        return throwError(error);
      })
    );
  }
}