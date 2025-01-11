import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3000/api/profile';

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/update`, profileData);
  }

  updateProfilePicture(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-picture`, formData);
  }
}
