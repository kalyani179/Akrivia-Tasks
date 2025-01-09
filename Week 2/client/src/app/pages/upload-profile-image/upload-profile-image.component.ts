import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgToastService } from 'ng-angular-popup';
import { ProfileService } from 'src/app/services/profile.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-upload-profile-image',
  templateUrl: './upload-profile-image.component.html',
  styleUrls: ['./upload-profile-image.component.scss']
})
export class UploadProfileImageComponent {
  selectedFile: File | null = null;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private toast: NgToastService,
    private http: HttpClient
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.toast.error({
        detail: 'Upload failed',
        summary: 'Please select a file to upload.',
        duration: 5000
      });
      return;
    }

    const fileName = this.selectedFile.name;
    const fileType = this.selectedFile.type;

    this.profileService.generatePresignedUrl(fileName, fileType).subscribe({
      next: (response) => {
        const uploadUrl = response.uploadUrl;
        if (this.selectedFile) {
          this.uploadToS3(uploadUrl, this.selectedFile, fileName);
        }
      },
      error: (err) => {
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Error generating pre-signed URL.',
          duration: 5000
        });
        console.error('Error generating pre-signed URL:', err);
      }
    });
  }

  uploadToS3(uploadUrl: string, file: File, fileName: string): void {
    const headers = new HttpHeaders()
      .set('Content-Type', file.type)
      .set('Skip-Auth', 'true');
    this.http.put(uploadUrl, file, { headers }).subscribe({
      next: () => {
        this.toast.success({
          detail: 'Upload successful',
          summary: 'Image uploaded successfully.',
          duration: 5000
        });
        const fileUrl = uploadUrl.split('?')[0]; // Extract the file URL without query parameters
        this.saveFileMetadata(fileName, fileUrl);
      },
      error: (err) => {
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Error uploading image.',
          duration: 5000
        });
        console.error('Error uploading image:', err);
      }
    });
  }

  saveFileMetadata(fileName: string, fileUrl: string): void {
    const body = { fileName, fileUrl };
    this.http.post(`${environment.serverUrl}/file/save-file-metadata`, body).subscribe({
      next: (response) => {
        console.log('File metadata saved successfully:', response);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.toast.error({
          detail: 'Save metadata failed',
          summary: 'Error saving file metadata.',
          duration: 5000
        });
        console.error('Error saving file metadata:', err);
      }
    });
  }
}