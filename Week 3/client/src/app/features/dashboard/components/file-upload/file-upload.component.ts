import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { NgToastService } from 'ng-angular-popup';
import { FileService } from 'src/app/core/services/file.service';
import { DomSanitizer, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  url?: SafeResourceUrl;
  selected: boolean;
}


@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  showModal = false;
  isDragging = false;
  selectedFile: File | null = null;
  files: UploadedFile[] = [];
  isUploading = false;
  isDownloading = false;
  showPreviewModal = false;
  previewFile: UploadedFile | null = null;

  constructor(
    private fileService: FileService,
    private toast: NgToastService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadFiles();
  }

  loadFiles(): void {
    this.fileService.getAllFiles().subscribe({
      next: (response) => {
        this.files = response.files.map((file: any) => ({
          name: file.Key.split('/').pop(), // Get filename from full path
          size: this.formatFileSize(file.Size),
          type: this.getFileType(file.Key),
          url: this.sanitizer.bypassSecurityTrustResourceUrl(file.url),
          selected: false
        }));
      },
      error: (err) => {
        console.error('Error loading files:', err);
        this.toast.error({
          detail: 'Error',
          summary: 'Failed to load files',
          duration: 1000
        });
      }
    });
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
      // Add more as needed
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  getFileIcon(fileType: string): string {
    if (fileType.includes('image')) return 'bi-image text-purple';
    if (fileType.includes('video')) return 'bi-camera-video text-purple';
    if (fileType.includes('pdf')) return 'bi-file-pdf text-purple';
    if (fileType.includes('word')) return 'bi-file-word text-purple';
    return 'bi-file-text text-secondary';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    
    const fileName = this.selectedFile.name;
    const fileType = this.selectedFile.type;

    this.fileService.generatePresignedUrl(fileName, fileType).subscribe({
      next: (response) => {
        this.isUploading = true;
        const uploadUrl = response.uploadUrl;
        if (this.selectedFile) {
          this.uploadToS3(uploadUrl, this.selectedFile, fileName);
          this.closeModal();
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Error generating pre-signed URL.',
          duration: 1000
        });
        console.error('Error generating pre-signed URL:', err);
      }
    });
  }

  uploadToS3(uploadUrl: string, file: File, fileName: string): void {
    this.isUploading = true;
    
    this.fileService.uploadToS3(uploadUrl, file).subscribe({
      next: () => {
        this.files.push({
          name: fileName,
          size: this.formatFileSize(file.size),
          type: file.type,
          url: this.sanitizer.bypassSecurityTrustResourceUrl(uploadUrl.split('?')[0]),
          selected: false
        });
        this.isUploading = false;
        this.toast.success({
          detail: 'Success',
          summary: 'File uploaded successfully',
          duration: 1000
        });
      },
      error: (err) => {
        this.isUploading = false;
        this.toast.error({
          detail: 'Upload failed',
          summary: 'Error uploading file.',
          duration: 1000
        });
        console.error('Error uploading file:', err);
      }
    });
  }

  downloadFiles(fileNames?: string[]): void {
    try {
      if (!fileNames) {
        fileNames = this.files
          .filter(file => file.selected)
          .map(file => file.name);
      }

      if (fileNames.length === 0) {
        this.toast.error({
          detail: 'No files selected',
          summary: 'Please select files to download.',
          duration: 1000
        });
        return;
      }

      this.isDownloading = true;
      
      this.fileService.downloadFiles(fileNames).subscribe({
        next: () => {
          this.toast.success({
            detail: 'Success',
            summary: fileNames!.length === 1 ? 'File downloaded successfully' : 'Files downloaded as zip',
            duration: 1000
          });
        },
        error: (err: Error) => {
          this.toast.error({
            detail: 'Download failed',
            summary: 'Error downloading files.',
            duration: 1000
          });
          console.error('Download failed:', err);
        },
        complete: () => {
          this.isDownloading = false;
        }
      });
 
    } catch (error) {
      this.isDownloading = false;
      console.error('Download failed:', error);
    }
  }

  handleFileSelection(event: Event): void {
    const element = event.target as HTMLInputElement;
    const files = element.files;
    
    if (files && files.length > 0) {
      this.selectedFile = files[0];  // For single file upload
      console.log('File selected:', this.selectedFile); // Debug log
    }
  }

  downloadSingleFile(fileName: string): void {
    this.downloadFiles([fileName]);
  }

  downloadSelectedFiles(): void {
    this.downloadFiles();
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  openUploadModal(): void {
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedFile = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.handleFileSelection({ target: { files } } as unknown as Event);
    }
  }

  toggleFileSelection(file: UploadedFile): void {
    file.selected = !file.selected;
  }

  hasSelectedFiles(): boolean {
    return this.files.some(f => f.selected);
  }

  allFilesSelected(): boolean {
    return this.files.length > 0 && this.files.every(f => f.selected);
  }

  toggleAllFiles(): void {
    const newValue = !this.allFilesSelected();
    this.files.forEach(file => file.selected = newValue);
  }

  previewFileItem(file: UploadedFile): void {
    this.previewFile = file;
    console.log(this.previewFile.url);
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewFile = null;
  }

  isPreviewable(fileType: string): boolean {
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    const documentTypes = ['application/pdf', 'text/plain'];
    return imageTypes.includes(fileType) || documentTypes.includes(fileType);
  }

  getFileUrl(fileName: string): string {
    return `/api/files/download/${fileName}`;
  }
}