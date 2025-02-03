import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { NgToastService } from 'ng-angular-popup';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
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

interface ColumnFilter {
  key: string;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-file-uploads',
  templateUrl: './file-uploads.component.html',
  styleUrls: ['./file-uploads.component.scss']
})
export class FileUploadsComponent implements OnInit, OnDestroy {
  fileUploads: FileUpload[] = [];
  searchText = '';
  showFilters = false;
  selectedColumns: string[] = [];
  columns: ColumnFilter[] = [
    { key: 'file_name', label: 'File Name', checked: true },
    { key: 'status', label: 'Status', checked: true },
    { key: 'processed_count', label: 'Processed Count', checked: true },
    { key: 'error_count', label: 'Error Count', checked: true },
    { key: 'created_at', label: 'Created At', checked: true },
    { key: 'completed_at', label: 'Completed At', checked: true }
  ];
  private refreshInterval: any;
  private searchSubject = new Subject<string>();

  constructor(
    private productService: ProductService,
    private elementRef: ElementRef,
    private toast: NgToastService
  ) {}

  ngOnInit() {
    // Initialize selected columns
    this.selectedColumns = this.columns
      .filter(col => col.checked)
      .map(col => col.key);

    this.loadFileUploads();
    
    // Set up search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchValue => {
      this.searchText = searchValue;
      this.loadFileUploads();
    });

    // Refresh data periodically
    this.refreshInterval = setInterval(() => {
      this.loadFileUploads();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.searchSubject.complete();
  }

  loadFileUploads() {
    const searchParams = {
      searchText: this.searchText || '',
      selectedColumns: this.selectedColumns || []
    };

    this.productService.getFileUploads(searchParams).subscribe({
      next: (uploads) => {
        this.fileUploads = uploads;
        console.log(this.fileUploads);
        // Check for pending files and trigger processing
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

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const filtersMenu = this.elementRef.nativeElement.querySelector('.filter-menu');
    if (!filtersMenu?.contains(event.target as Node)) {
      this.showFilters = false;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'text-success';
      case 'failed': return 'text-danger';
      case 'processing': return 'text-primary';
      default: return 'text-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'bi-check-circle';
      case 'failed': return 'bi-x-circle';
      case 'processing': return 'bi-arrow-repeat';
      default: return 'bi-clock';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  onSearch(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchText = searchValue;
    this.searchSubject.next(searchValue);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onColumnToggle(column: ColumnFilter): void {
    column.checked = !column.checked;
    this.selectedColumns = this.columns
      .filter(col => col.checked)
      .map(col => col.key);
    this.loadFileUploads();
  }
} 