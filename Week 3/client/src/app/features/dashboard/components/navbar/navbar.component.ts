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
  imageLoading = false;

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private elementRef: ElementRef,
    private http: HttpClient,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.imageLoading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.user = response;
        console.log(response);
          this.imageLoading = false;
      },
      error: (error) => {
        this.imageLoading = false;
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

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onImageLoad(): void {
    this.imageLoading = false;
  }

  onImageError(): void {
    this.imageLoading = false;
    this.user.thumbnail = '';
    this.toast.error({
      detail: 'Error',
      summary: 'Failed to load profile picture',
      duration: 3000
    });
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
        duration: 1000
      });
      return;
    }

    const fileName = this.selectedFile.name;
    const fileType = this.selectedFile.type;
    this.profileService.generatePresignedUrl(fileName, fileType).subscribe({
      next: (response) => {
        this.imageLoading = true;
        const uploadUrl = response.uploadUrl;
        if (this.selectedFile) {
          this.uploadToS3(uploadUrl, this.selectedFile, fileName);
          this.closeUploadModal();
        }
      },
      error: (err) => {
        this.imageLoading = false;
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Error generating pre-signed URL.',
          duration: 1000
        });
        console.error('Error generating pre-signed URL:', err);
      }
    });
  }

  uploadToS3(uploadUrl: string, file: File, fileName: string): void {
    const headers = new HttpHeaders()
      .set('Content-Type', file.type)
      .set('Skip-Auth', 'true');
    
    this.imageLoading = true;
    
    this.http.put(uploadUrl, file, { headers }).subscribe({
      next: () => {
        const fileUrl = uploadUrl.split('?')[0];
        this.saveFileMetadata(fileName, fileUrl);
      },
      error: (err) => {
        this.imageLoading = false;
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Error uploading image.',
          duration: 1000
        });
        console.error('Error uploading image:', err);
      }
    });
  }

  saveFileMetadata(fileName: string, fileUrl: string): void {
    const body = { fileName, fileUrl };
    this.http.post(`http://localhost:3000/api/profile/save-file-metadata`, body).subscribe({
      next: (response: any) => {
        this.user.thumbnail = response.thumbnail;
        this.imageLoading = false;
        this.showUploadModal = false;
        
        this.toast.success({
          detail: 'Success',
          summary: 'Profile picture updated successfully.',
          duration: 1000
        });
      },
      error: (err) => {
        this.imageLoading = false;
        this.toast.error({
          detail: 'Save metadata failed',
          summary: 'Error saving file metadata.',
          duration: 1000
        });
        console.error('Error saving file metadata:', err);
      }
    });
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
      this.uploadFile();
    }
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

  getDefaultProfileImage(): string {
    if (!this.user.thumbnail) {
      // Create initials from first and last name
      const initials = (this.user.firstname.charAt(0) + this.user.lastname.charAt(0)).toUpperCase();
      
      // Generate a random pastel color based on the username
      const hue = Math.abs(this.hashCode(this.user.username)) % 360;
      const backgroundColor = `hsl(${hue}, 70%, 85%)`; // Pastel color
      const textColor = '#000000'; // Black text
      
      // Create a canvas to generate the image
      const canvas = document.createElement('canvas');
      const size = 128; // Size of the image
      canvas.width = size;
      canvas.height = size;
      
      const context = canvas.getContext('2d');
      if (context) {
        // Draw background
        context.fillStyle = backgroundColor;
        context.fillRect(0, 0, size, size);
        
        // Draw text
        context.fillStyle = textColor;
        context.font = 'bold 64px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(initials, size/2, size/2);
        
        // Convert to base64 image
        return canvas.toDataURL('image/png');
      }
    }
    return '';
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}