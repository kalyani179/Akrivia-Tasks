import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

  data: any = null;  // Initialize as null to handle cases when data is not available yet
  dropdownOpen = false; // Track the dropdown state

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.getProfiler();
  }

  getProfiler(): void {
    this.auth.getProfile().subscribe({
      next: (response: any) => {
        console.log('Profile data:', response);
        this.data = response;  // Update data when response is received
      },
      error: (err) => {
        console.error('Error while fetching profile:', err);
      }
    });
  }

  // Toggle the dropdown visibility
  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Logout the user
  logout(): void {
    localStorage.removeItem('token');
    this.data = null;  // Clear the data on logout
    this.dropdownOpen = false; // Close the dropdown on logout
    this.router.navigate(['/login']);
  }
}
