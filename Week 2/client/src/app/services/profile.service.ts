import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private http: HttpClient) {}

  uploadProfileImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post(`${environment.serverUrl}/profile/upload`, formData);
  }
}