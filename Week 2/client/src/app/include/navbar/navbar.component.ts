import { Component, OnInit } from '@angular/core';
import { Router,NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ProfileService } from 'src/app/services/profile.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  data: any = null; 
  sidebarOpen = false;
  dropdownOpen = false; 
  currentRoute: string = '';
  isLoggedIn: boolean = false;

  constructor(private authService:AuthService, private profileService: ProfileService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = event.urlAfterRedirects;
      }
    });
  }

  ngOnInit(): void {
    this.getProfiler();
    this.checkLoginStatus();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  getProfiler(): void {
    this.profileService.getProfile().subscribe({
      next: (response: any) => {
        console.log('Profile data:', response);
        this.data = response;  
      },
      error: (err) => {
        console.error('Error while fetching profile:', err);
      }
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  checkLoginStatus(): void {
    const accessToken = localStorage.getItem('accessToken');
    this.isLoggedIn = !!(accessToken && this.authService.isTokenValid(accessToken));
  }
  
  navigateToUploadImage(): void {
    this.router.navigate(['/upload-profile-image']);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.data = null;  // Clear the data on logout
    this.dropdownOpen = false; // Close the dropdown on logout
    this.router.navigate(['/login']);
  }
}