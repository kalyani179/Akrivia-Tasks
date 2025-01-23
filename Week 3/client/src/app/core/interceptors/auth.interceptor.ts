import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError, map } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private secretKey = environment.secretKey;

  constructor(private authService: AuthService) {}

  private encryptData(data: any): string {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
    console.log('Encrypted Payload (Frontend):', encrypted);
    return encrypted;
  }

  private decryptData(encryptedData: string): any {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      throw new Error('Decryption resulted in empty string');
    }
    return JSON.parse(decryptedText);
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip both auth and encryption for specific requests
    if (request.headers.has('Skip-Auth')) {
      const headers = request.headers.delete('Skip-Auth');
      const authReq = request.clone({ headers });
      return next.handle(authReq);
    }

    // Get the access token from local storage
    const accessToken = localStorage.getItem('accessToken');

    // Determine if encryption should be skipped
    const skipEncryption = request.body instanceof FormData || 
                          request.url.includes('s3.amazonaws.com');

    // Clone the request and add the authorization header if the access token exists
    let authRequest = request;
    if (accessToken) {
      authRequest = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${accessToken}`)
      });
    }

    // Apply encryption if needed
    if (!skipEncryption && authRequest.body) {
      console.log('Request Body (Frontend):', authRequest.body);
      authRequest = authRequest.clone({
        body: { encryptedPayload: this.encryptData(authRequest.body) }
      });
      console.log('Encrypted Request Body (Frontend):', authRequest.body);
    }

    return next.handle(authRequest).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && !skipEncryption && event.body?.encryptedPayload) {
          const decryptedBody = this.decryptData(event.body.encryptedPayload);
          return event.clone({ body: decryptedBody });
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        console.log('Error status:', error.status);
        if (error.status === 403 && !authRequest.url.includes('/api/auth/refresh-token')) {
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

              // Apply encryption to the new request if needed
              let finalRequest = newAuthRequest;
              if (!skipEncryption && finalRequest.body) {
                finalRequest = finalRequest.clone({
                  body: { encryptedPayload: this.encryptData(finalRequest.body) }
                });
              }

              // Retry the request with the new access token
              return next.handle(finalRequest);
            }),
            catchError((refreshError) => {
              console.error('Error refreshing token:', refreshError);
              return throwError(() => new Error("refresh token error " + refreshError));
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}