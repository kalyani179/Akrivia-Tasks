import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})

export class UserService {

  private apiUrl = `${environment.serverUrl}/profile/users`; 

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
