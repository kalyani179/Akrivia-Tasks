import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { NgToastService } from 'ng-angular-popup';

interface ProcessingStatus {
  fileId: number;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  processedCount?: number;
  errorCount?: number;
  error?: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly PROCESSING_STATUS_KEY = 'file_processing_status';

  constructor(private socket: Socket, private toast: NgToastService) {
    console.log('NotificationService initialized');
    this.setupSocketListeners();
    this.checkPendingNotifications();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected in NotificationService');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected in NotificationService');
    });

    this.socket.on('fileProcessing', (data: any) => {
      console.log('Received fileProcessing event:', data);
      this.saveProcessingStatus({
        fileId: data.fileId,
        fileName: data.fileName,
        status: 'processing',
        timestamp: Date.now()
      });
      this.toast.info({
        detail: data.message,
        summary: 'Processing File',
        duration: 5000
      });
    });

    this.socket.on('fileProgress', (data: any) => {
      console.log('Received fileProgress event:', data);
      this.toast.info({
        detail: `Processing: ${data.progress}%`,
        summary: data.message || 'File Processing',
        sticky: true
      });
    });

    this.socket.on('fileProcessingComplete', (data: any) => {
      console.log('Received fileProcessingComplete event:', data);
      this.saveProcessingStatus({
        fileId: data.fileId,
        fileName: data.fileName,
        status: 'completed',
        processedCount: data.processedCount,
        errorCount: data.errorCount,
        timestamp: Date.now()
      });

      if (data.errorCount > 0) {
        this.toast.warning({
          detail: `File processed with ${data.errorCount} errors. Check Error Sheet for details`,
          duration: 5000
        });

      } else {
        this.toast.success({
          detail: `Successfully processed ${data.processedCount} records`,
          duration: 5000
        });

      }
    });

    this.socket.on('fileProcessingError', (data: any) => {
      console.log('Received fileProcessingError event:', data);
      this.saveProcessingStatus({
        fileId: data.fileId,
        fileName: data.fileName,
        status: 'failed',
        error: data.error,
        timestamp: Date.now()
      });
      this.toast.error({
        detail: data.error,
        summary: 'Processing Failed',
        sticky: true
      });
    });
  }

  private saveProcessingStatus(status: ProcessingStatus) {
    try {
      const currentStatuses = this.getStoredStatuses();
      currentStatuses[status.fileId] = {
        ...status,
        timestamp: Date.now()
      };
      localStorage.setItem(this.PROCESSING_STATUS_KEY, JSON.stringify(currentStatuses));
    } catch (error) {
      console.error('Error saving processing status:', error);
    }
  }

  private getStoredStatuses(): { [key: number]: ProcessingStatus } {
    try {
      const stored = localStorage.getItem(this.PROCESSING_STATUS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting stored statuses:', error);
      return {};
    }
  }

  private checkPendingNotifications() {
    const storedStatuses = this.getStoredStatuses();
    const currentTime = Date.now();
    const ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

    Object.values(storedStatuses).forEach(status => {
      // Only show notifications for processes completed in the last hour
      if (currentTime - status.timestamp <= ONE_HOUR) {
        switch (status.status) {
          case 'completed':
            if (status.errorCount && status.errorCount > 0) {
              this.toast.warning({
                detail: `"${status.fileName}" processed with ${status.errorCount} errors.`,
                // summary: 'Previous Upload Completed with Errors',
                duration: 5000
              });
            } else {
              this.toast.success({
                detail: `File "${status.fileName}" successfully processed ${status.processedCount} records`,
                // summary: 'Previous Upload Completed',
                duration: 5000
              });
            }
            break;
          case 'failed':
            this.toast.error({
              detail: `File "${status.fileName}" processing failed: ${status.error}`,
              summary: 'Previous Upload Failed',
              duration: 5000
            });
            break;
          case 'processing':
            // For files still marked as processing, we might want to check their actual status
            this.checkFileStatus(status.fileId);
            break;
        }
      }
    });

    // Clean up old statuses
    this.cleanupOldStatuses();
  }

  private cleanupOldStatuses() {
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const currentTime = Date.now();
    const storedStatuses = this.getStoredStatuses();

    const updatedStatuses = Object.entries(storedStatuses).reduce((acc, [key, status]) => {
      if (currentTime - status.timestamp <= ONE_DAY) {
        acc[Number(key)] = status;
      }
      return acc;
    }, {} as { [key: number]: ProcessingStatus });

    localStorage.setItem(this.PROCESSING_STATUS_KEY, JSON.stringify(updatedStatuses));
  }

  private checkFileStatus(fileId: number) {
    // You'll need to implement this method to check the actual status of the file
    // This would typically involve making an API call to your backend
    this.socket.emit('checkFileStatus', { fileId });
  }
}