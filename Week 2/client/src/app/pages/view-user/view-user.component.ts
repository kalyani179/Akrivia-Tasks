import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from 'src/app/services/profile.service';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-view-user',
  templateUrl: './view-user.component.html',
  styleUrls: ['./view-user.component.scss']
})
export class ViewUserComponent implements OnInit {
  user: any;

  constructor(
    private route: ActivatedRoute,
    private profileService: ProfileService,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.fetchUserDetails(userId);
    } else {
      this.toast.error({ detail: 'Error', summary: 'Invalid user ID', duration: 5000 });
    }
  }

  fetchUserDetails(userId: string): void {
    this.profileService.getUserById(userId).subscribe({
      next: (response: any) => {
        this.user = response;
        console.log('User details:', this.user);
      },
      error: (err) => {
        this.toast.error({ detail: 'Error', summary: 'Failed to fetch user details', duration: 5000 });
        console.error('Error fetching user details:', err);
      }
    });
  }
}