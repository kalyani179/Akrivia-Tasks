import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { NgToastService } from 'ng-angular-popup';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isRead: boolean;
  timestamp: number;
  fileId?: number;
  fileName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly NOTIFICATIONS_KEY = 'file_notifications';
  private notifications = new BehaviorSubject<Notification[]>([]);
  private unreadCount = new BehaviorSubject<number>(0);

  constructor(private socket: Socket, private toast: NgToastService) {
    this.loadNotifications();
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('fileProcessingComplete', (data: any) => {
      const notification: Notification = {
        id: Date.now(),
        title: 'File Processing Complete',
        message: data.errorCount > 0 
          ? `File "${data.fileName}" processed with ${data.errorCount} errors` 
          : `File "${data.fileName}" successfully processed ${data.processedCount} records`,
        type: data.errorCount > 0 ? 'warning' : 'success',
        isRead: false,
        timestamp: Date.now(),
        fileId: data.fileId,
        fileName: data.fileName
      };
      
      this.addNotification(notification);
      this.showToast(notification);
    });

    this.socket.on('fileProcessingError', (data: any) => {
      const notification: Notification = {
        id: Date.now(),
        title: 'Processing Failed',
        message: `File "${data.fileName}" processing failed: ${data.error}`,
        type: 'error',
        isRead: false,
        timestamp: Date.now(),
        fileId: data.fileId,
        fileName: data.fileName
      };
      
      this.addNotification(notification);
      this.showToast(notification);
    });
  }

  private addNotification(notification: Notification) {
    const current = this.notifications.value;
    const updated = [notification, ...current];
    this.notifications.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount(updated);
  }

  private showToast(notification: Notification) {
    switch (notification.type) {
      case 'success':
        this.toast.success({ detail: notification.message, duration: 5000 });
        break;
      case 'error':
        this.toast.error({ detail: notification.message, duration: 5000 });
        break;
      case 'warning':
        this.toast.warning({ detail: notification.message, duration: 5000 });
        break;
    }
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount.asObservable();
  }

  markAsRead(notificationId: number) {
    const updated = this.notifications.value.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    );
    this.notifications.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount(updated);
  }

  markAllAsRead() {
    const updated = this.notifications.value.map(notification => 
      ({ ...notification, isRead: true })
    );
    this.notifications.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount(updated);
  }

  deleteNotification(notificationId: number) {
    const updated = this.notifications.value.filter(notification => 
      notification.id !== notificationId
    );
    this.notifications.next(updated);
    this.saveNotifications(updated);
    this.updateUnreadCount(updated);
  }

  private loadNotifications() {
    const stored = localStorage.getItem(this.NOTIFICATIONS_KEY);
    const notifications = stored ? JSON.parse(stored) : [];
    this.notifications.next(notifications);
    this.updateUnreadCount(notifications);
  }

  private saveNotifications(notifications: Notification[]) {
    localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }

  private updateUnreadCount(notifications: Notification[]) {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCount.next(unreadCount);
  }
}