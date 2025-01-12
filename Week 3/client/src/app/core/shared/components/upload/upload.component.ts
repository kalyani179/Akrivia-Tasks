import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  @Input() showModal = false;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() modalClosed = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  selectedFile: File | null = null;
  isDragging = false;

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
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  closeModal(): void {
    this.selectedFile = null;
    this.modalClosed.emit();
  }

  upload(): void {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
      this.closeModal();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}
