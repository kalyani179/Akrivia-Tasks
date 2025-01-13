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
  imageLoading = true;

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
    this.imageLoading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        this.user = response;
        if (!response.thumbnail) {
          this.imageLoading = false;
        }
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

  // Modify your toggle function to stop event propagation
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onImageLoad(): void {
    this.imageLoading = false;
  }

  onImageError(): void {
    this.imageLoading = false;
    this.user.thumbnail = ''; // Reset to show default icon
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

    handleFileSelected(file: File): void {
      if (!file) {
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Please select a file to upload.',
          duration: 3000
        });
        return;
      }
  
      const fileName = file.name;
      const fileType = file.type;
  
      this.imageLoading = true;
      this.profileService.generatePresignedUrl(fileName, fileType).subscribe({
        next: (response) => {
          const uploadUrl = response.uploadUrl;
          const headers = new HttpHeaders()
            .set('Content-Type', fileType)
            .set('Skip-Auth', 'true');
          
          this.http.put(uploadUrl, file, { headers }).subscribe({
            next: () => {
              const fileUrl = uploadUrl.split('?')[0];
              this.http.post(`http://localhost:3000/api/profile/save-file-metadata`, 
                { fileName, fileUrl }
              ).subscribe({
                next: (response: any) => {
                  this.user.thumbnail = response.thumbnail;
                  this.imageLoading = false;
                  this.showUploadModal = false;
                  this.toast.success({
                    detail: 'Success',
                    summary: 'Profile picture updated successfully.',
                    duration: 3000
                  });
                },
                error: () => {
                  this.imageLoading = false;
                  this.toast.error({
                    detail: 'Upload failed',
                    summary: 'Failed to update profile picture.',
                    duration: 3000
                  });
                }
              });
            },
            error: () => {
              this.imageLoading = false;
              this.toast.error({
                detail: 'Upload failed',
                summary: 'Error uploading image.',
                duration: 3000
              });
            }
          });
        },
        error: () => {
          this.imageLoading = false;
          this.toast.error({
            detail: 'Upload failed',
            summary: 'Error generating upload URL.',
            duration: 3000
          });
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

  logout(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }

}