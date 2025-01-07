import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
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

 

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }


  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(()=> new Error('No refresh token available'));
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