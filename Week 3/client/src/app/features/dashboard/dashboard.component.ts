import { Component } from '@angular/core';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  constructor(private notificationService: NotificationService) {}
  ngOnInit(){}
} 