import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

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
    return this.http.post(`${this.apiUrl}/add`, productData);
  }

  getPresignedUrlProductImage(fileName: string, fileType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-prodcut-image`, { fileName, fileType });
  }

  uploadProductImage(url: string, file: File): Observable<any> {
    return this.http.put(url, file, {
      headers: new HttpHeaders(),
      withCredentials: false
    });
  }


  getInventoryItems(params: {
    page: number;
    limit: number;
    search?: string;
    columns?: string;
  }): Observable<any> {
    const queryParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString())
      .set('search', params.search || '')
      .set('columns', params.columns || '');

    return this.http.get(`${this.apiUrl}/inventory`, { params: queryParams });
  }

  getVendorCount(): Observable<number> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/vendors/count`)
      .pipe(map(response => response.count));
  }

  getAllInventoryItems(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/inventory/all`);
  }

  refreshInventory() {
    // Implement a way to notify subscribers that inventory needs to be refreshed
    // This could be using a Subject/BehaviorSubject
    this.refreshInventorySubject.next();
  }

  private refreshInventorySubject = new Subject<void>();
  refreshInventory$ = this.refreshInventorySubject.asObservable();

	getAllProducts(): Observable<any[]> {
		return this.http.get<any[]>(`${this.apiUrl}/inventory`);
	}

	getCartProducts(): Observable<any[]> {
		return this.http.get<any[]>(`${this.apiUrl}/inventory/cart`);
	}

	addToCart(productId: string): Observable<any> {
		return this.http.post(`${this.apiUrl}/inventory/cart`, { productId });
	}

	removeFromCart(productId: string): Observable<any> {
		return this.http.delete(`${this.apiUrl}/inventory/cart/${productId}`);
	}

  deleteProduct(productId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/inventory/${productId}`);
  }

  bulkAddProducts(products: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-add`, { products });
  }

  updateCartProduct(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/cart/${id}`, payload);
  }

  updateProduct(id: string, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/inventory/${id}`, payload)
      .pipe(
        catchError(error => {
          console.error('Error updating product:', error);
          if (error.status === 0) {
            throw new Error('Unable to connect to the server. Please check your connection.');
          } else if (error.status === 500) {
            throw new Error(error.error?.message || 'Server error occurred');
          }
          throw error.error?.message || error.message || 'Unknown error occurred';
        })
      );
  }

  getVendors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vendors`);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }
}
