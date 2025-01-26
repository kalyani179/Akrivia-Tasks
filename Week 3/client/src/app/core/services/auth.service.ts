import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import * as CryptoJS from 'crypto-js';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; 
  private secretKey = environment.secretKey; 
  private userId: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.userId = localStorage.getItem('userId');
  }

  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, userData);
  }

  login(loginData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, loginData).pipe(
      map((response: any) => {
        if (response.userId) {
          localStorage.setItem('userId', response.userId);
          this.userId = response.userId;
        }
        return response;
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isTokenValid(token: string): boolean {
    try {
      const decodedToken: any = jwtDecode(token);
      const expirationDate = new Date(decodedToken.exp * 1000); 
      return expirationDate > new Date();
    } catch (error) {
      return false;
    }
  }

  refreshToken(): Observable<any> {
    if (!this.userId) {
      this.logout();
      return throwError(() => new Error('No user ID available'));
    }
    
    return this.http.post(`${this.apiUrl}/refresh-token`, { userId: this.userId }).pipe(
      map((response: any) => {
        if (response.accessToken) {
          localStorage.setItem('accessToken', response.accessToken);
        }
        return response;
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(id: string, accessToken: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/${id}/${accessToken}`, { password });
  }

  logout(redirectToLogin: boolean = true): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    this.userId = null;
    
    if (redirectToLogin) {
      this.router.navigate(['/login']);
    }
  }

  getUserFromToken(): any {
    const token = this.getToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        console.log('Decoded token:', decodedToken);
        
        // Decrypt the data field
        const decryptedData = this.decryptData(decodedToken.data);
        console.log('Decrypted data:', decryptedData);
        
        // Parse the decrypted JSON string
        const userData = JSON.parse(decryptedData);
        return {
          id: userData.id,
          username: userData.username
        };
      } catch (error) {
        console.error('Error decoding/decrypting token:', error);
        return null;
      }
    }
    return null;
  }

  private decryptData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  handleAuthError(error: any): void {
    console.error('Authentication error:', error);
    this.logout();
  }
}
