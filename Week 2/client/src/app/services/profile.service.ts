import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private serverUrl = environment.serverUrl;

  constructor(private http: HttpClient,private authService:AuthService) {}

   getProfile(): Observable<any> {
      return this.http.get(`${this.serverUrl}/profile/user`, {
        headers: this.getAuthHeaders()
      }).pipe(
        catchError(error => {
          if (error.status === 403) {
            return this.authService.refreshToken().pipe(
              switchMap(() => this.getProfile())
            );
          }
          return throwError(()=> new Error(error));
        })
      );
    }

    generatePresignedUrl(fileName: string, fileType: string): Observable<any> {
      return this.http.post(`${this.serverUrl}/file/generate-presigned-url`, { fileName, fileType });
    }
  
    getUsers(page: number, limit: number): Observable<any> {
      return this.http.get(`${this.serverUrl}/profile/users?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).pipe(
        catchError(error => {
          if (error.status === 403) {
            return this.authService.refreshToken().pipe(
              switchMap(() => this.getUsers(page, limit))
            );
          }
          return throwError(()=>new Error(error));
        })
      );
    }
    
    getUserById(userId: string): Observable<any> {
      return this.http.get(`${environment.serverUrl}/profile/user/${userId}`);
    }

    deleteUser(userId: number): Observable<any> {
      return this.http.delete(`${environment.serverUrl}/profile/user/${userId}`);
    }
    
    private getAuthHeaders(): HttpHeaders {
      const accessToken = localStorage.getItem('accessToken');
      return new HttpHeaders({
        'Authorization': `Bearer ${accessToken}`
      });
    }
}