import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = 'http://localhost:3000/profile/users'; // Backend API endpoint

  constructor(private http: HttpClient) { }

  // Fetch users with pagination and filters
  getUsers(page: number, limit: number, filter: string): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('filter', filter);

    return this.http.get<any>(this.apiUrl, { params });
  }
}
