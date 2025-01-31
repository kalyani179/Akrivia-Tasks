import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgToastService } from 'ng-angular-popup';
import { ProductService } from 'src/app/core/services/product.service';

interface FileUpload {
    id: number;
    file_name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processed_count: number;
    error_count: number;
    error_message?: string;
    created_at: string;
    completed_at?: string;
    errorFileUrl?: string;
}

@Component({
  selector: 'app-file-uploads',
  templateUrl: './file-uploads.component.html',
  styleUrls: ['./file-uploads.component.scss']
})

export class FileUploadsComponent implements OnInit, OnDestroy {
  fileUploads: FileUpload[] = [];
  showUploadModal = false;
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  private refreshInterval: any;

  constructor(
    private productService: ProductService,
    private toast: NgToastService
  ) {}

  ngOnInit() {
    this.loadFileUploads();
    // Refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.loadFileUploads();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadFileUploads() {
    this.productService.getFileUploads().subscribe({
      next: (uploads) => {
        this.fileUploads = uploads;
        // Check if any files need processing
        const pendingFiles = uploads.filter(u => u.status === 'pending');
        if (pendingFiles.length > 0) {
          this.triggerProcessing();
        }
      },
      error: (error) => {
        console.error('Error loading file uploads:', error);
        this.toast.error({
          detail: 'Failed to load file uploads',
          summary: 'Error',
          duration: 3000
        });
      }
    });
  }

  triggerProcessing() {
    this.productService.triggerProcessing().subscribe({
      next: () => {
        console.log('Processing triggered successfully');
        this.loadFileUploads();
      },
      error: (error) => {
        console.error('Error triggering processing:', error);
        this.toast.error({
          detail: 'Failed to trigger processing',
          summary: 'Error',
          duration: 3000
        });
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-danger';
      case 'processing':
        return 'text-primary';
      default:
        return 'text-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'bi-check-circle';
      case 'failed':
        return 'bi-x-circle';
      case 'processing':
        return 'bi-arrow-repeat';
      default:
        return 'bi-clock';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
} 