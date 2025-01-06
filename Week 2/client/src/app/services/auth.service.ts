import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment'; 
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private serverUrl = environment.serverUrl;

  constructor(private http: HttpClient) { }

  register(data: any): Observable<any> {
    return this.http.post(`${this.serverUrl}/auth/register`, data);
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.serverUrl}/auth/login`, data).pipe(
      map((response: any) => {
        this.storeTokens(response.accessToken, response.refreshToken);
        return response;
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.serverUrl}/profile/user`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        if (error.status === 403) {
          return this.refreshToken().pipe(
            switchMap(() => this.getProfile())
          );
        }
        return throwError(error);
      })
    );
  }

  getUsers(page: number, limit: number): Observable<any> {
    return this.http.get(`${this.serverUrl}/profile/users?page=${page}&limit=${limit}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(error => {
        if (error.status === 403) {
          return this.refreshToken().pipe(
            switchMap(() => this.getUsers(page, limit))
          );
        }
        return throwError(error);
      })
    );
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private getAuthHeaders(): HttpHeaders {
    const accessToken = localStorage.getItem('accessToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`
    });
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError('No refresh token available');
    }
    return this.http.post(`${this.serverUrl}/auth/refresh-token`, { token: refreshToken }).pipe(
      map((response: any) => {
        localStorage.setItem('accessToken', response.accessToken);
        return response;
      })
    );
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
}