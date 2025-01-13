import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/api/inventory`;

  constructor(private http: HttpClient) {}

  getPresignedUrl(fileName: string, fileType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/presigned-url`, { fileName, fileType });
  }

  uploadToS3(url: string, file: File): Observable<any> {
    return this.http.put(url, file, {
      headers: {
        'Content-Type': file.type
      }
    });
  }

  addProduct(productData: any): Observable<any> {
    return this.http.post(this.apiUrl, productData);
  }

  getInventoryItems(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/inventory?page=${page}&limit=${limit}`);
  }
}