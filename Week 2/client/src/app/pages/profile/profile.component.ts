import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { NgToastService } from 'ng-angular-popup';

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

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.getUsers(this.page);
  }

  getUsers(page: number): void {
    this.profileService.getUsers(page, this.limit).subscribe({
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

  viewUser(userId: number): void {
    this.router.navigate(['/view-user', userId]);
  }

  editUser(userId: number): void {
    this.router.navigate(['/edit-user', userId]);
  }

  deleteUser(userId: number): void {
    this.profileService.deleteUser(userId).subscribe({
      next: () => {
        this.toast.success({ detail: 'Success', summary: 'User deleted successfully', duration: 5000 });
        this.getUsers(this.page);
      },
      error: (err) => {
        this.toast.error({ detail: 'Error', summary: 'Failed to delete user', duration: 5000 });
        console.error('Error deleting user:', err);
      }
    });
  }
}