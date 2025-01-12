import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgToastService } from 'ng-angular-popup';
import { ProfileService } from 'src/app/core/services/profile.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user = {
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    thumbnail: ''
  };
  selectedFile: File | null = null;
  isDropdownOpen = false;
  showUploadModal = false;
  isDragging = false;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private elementRef: ElementRef ,
    private http: HttpClient,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.user = response;
        console.log(response)
      },
      error: (error) => {
        console.error('Error fetching profile:', error);
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const dropdownMenu = this.elementRef.nativeElement.querySelector('.dropdown-menu');
    const dropdownToggle = this.elementRef.nativeElement.querySelector('.dropdown-toggle');
    
    if (!dropdownMenu?.contains(event.target as Node) && 
        !dropdownToggle?.contains(event.target as Node)) {
      this.isDropdownOpen = false;
    }
  }

  // Modify your toggle function to stop event propagation
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

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
          this.closeUploadModal();
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
    this.http.post(`http://localhost:3000/api/profile/save-file-metadata`, body).subscribe({
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

  logout(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

  openUploadModal(): void {
    this.showUploadModal = true;
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
    this.selectedFile = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }
}