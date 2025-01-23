import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap, from } from 'rxjs';
import * as JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl = `http://localhost:3000/api/files`;

  constructor(private http: HttpClient) {}

  generatePresignedUrl(fileName: string, fileType: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/generate-upload-url`, {
      fileName,
      fileType
    });
  }

  uploadToS3(uploadUrl: string, file: File): Observable<any> {
    const headers = new HttpHeaders()
      .set('Content-Type', file.type)
      .set('Skip-Auth', 'true');
    
    return this.http.put(uploadUrl, file, { headers });
  }

  getDownloadUrls(fileNames: string[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/download`, { fileNames });
  }

  downloadFiles(fileNames: string[]): Observable<void> {
    return this.http.post<any>(`${this.apiUrl}/download`, { fileNames }).pipe(
      switchMap(response => {
        if (fileNames.length === 1) {
          const headers = new HttpHeaders().set('Skip-Auth', 'true');
          return this.http.get(response.downloadUrl, { 
            responseType: 'blob',
            headers 
          }).pipe(
            switchMap(blob => {
              saveAs(blob, fileNames[0]);
              return from(Promise.resolve());
            })
          );
        }
        const zip = new JSZip();
        const headers = new HttpHeaders().set('Skip-Auth', 'true');
        const downloadObservables = response.downloadUrls.map((item: { fileName: string, downloadUrl: string }) =>
          this.http.get(item.downloadUrl, { responseType: 'blob', headers }).pipe(
            switchMap(blob => {
              zip.file(item.fileName, blob);
              return from(Promise.resolve());
            })
          )
        );
        return from(Promise.all(downloadObservables)).pipe(
          switchMap(() => from(zip.generateAsync({ type: 'blob' }))),
          switchMap(content => {
            saveAs(content, 'downloaded_files.zip');
            return from(Promise.resolve());
          })
        );
      })
    );
  }

  getAllFiles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/list`);
  }
}
