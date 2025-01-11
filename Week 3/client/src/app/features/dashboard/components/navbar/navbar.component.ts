import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/core/services/profile.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  user = {
    email: '',
    username: '',
    thumbnail: ''
  };
  isDropdownOpen = false;

  constructor(
    private profileService: ProfileService,
    private router: Router
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

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profilePicture', file);

      this.profileService.updateProfilePicture(formData).subscribe({
        next: (response) => {
          this.user.thumbnail = response.thumbnail;
          this.isDropdownOpen = false;
        },
        error: (error) => {
          console.error('Error updating profile picture:', error);
        }
      });
    }
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }
}