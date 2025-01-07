// filepath: /c:/Users/lap_2/OneDrive/Documents/AKR/Week 2/client/src/app/pages/upload-profile-image/upload-profile-image.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-upload-profile-image',
  templateUrl: './upload-profile-image.component.html',
  styleUrls: ['./upload-profile-image.component.scss']
})
export class UploadProfileImageComponent {
  selectedFile: File | null = null;

  constructor(private profileService: ProfileService, private router: Router, private toast: NgToastService) {}

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

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      this.profileService.uploadProfileImage(base64String).subscribe({
        next: (response) => {
          console.log(response);
          this.toast.success({
            detail: 'Upload successful',
            summary: 'Image uploaded successfully.',
            duration: 5000
          });
          this.router.navigate(['/profile']);
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
    };
    reader.readAsDataURL(this.selectedFile);
  }
}