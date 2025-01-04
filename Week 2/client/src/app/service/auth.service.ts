import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; 

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
    return this.http.post(`${this.serverUrl}/auth/login`, data);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.serverUrl}/profile/user`);
  }

  getUsers(page: number, limit: number): Observable<any> {
    return this.http.get(`${this.serverUrl}/profile/users?page=${page}&limit=${limit}`);
  }
}
