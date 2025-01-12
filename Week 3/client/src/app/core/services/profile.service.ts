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

  generatePresignedUrl(fileName: string, fileType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/generate-presigned-url`, { fileName, fileType });
  }
}
