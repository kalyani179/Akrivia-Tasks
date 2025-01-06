import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  data: any = null; 
  dropdownOpen = false; 

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.getProfiler();
  }

  getProfiler(): void {
    this.auth.getProfile().subscribe({
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

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.data = null;  // Clear the data on logout
    this.dropdownOpen = false; // Close the dropdown on logout
    this.router.navigate(['/login']);
  }
}