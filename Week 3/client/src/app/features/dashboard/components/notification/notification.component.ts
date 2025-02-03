import { Component, HostListener, OnInit } from '@angular/core';
import { NotificationService, Notification } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
    });

    this.notificationService.getUnreadCount().subscribe(count => {
      this.unreadCount = count;
    });
  }
  
  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!event.target.closest('.notification-container')) {
      this.showNotifications = false;
    }
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notification: Notification) {  
    this.notificationService.deleteNotification(notification.id);
  }

  getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'success': return 'bi bi-check-circle text-success';
      case 'error': return 'bi bi-x-circle text-danger';
      case 'warning': return 'bi bi-exclamation-circle text-warning';
      default: return 'bi bi-info-circle text-info';
    }
  }
}