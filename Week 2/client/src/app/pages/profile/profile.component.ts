import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  users: any[] = [];
  page: number = 1;
  limit: number = 10;
  totalPages: number = 1;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.getUsers(this.page);
  }

  getUsers(page: number): void {
    this.authService.getUsers(page, this.limit).subscribe({
      next: (response: any) => {
        this.users = response.users;
        this.totalPages = response.totalPages;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
      }
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.getUsers(this.page);
    }
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.getUsers(this.page);
    }
  }
}
