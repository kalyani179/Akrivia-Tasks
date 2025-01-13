import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent {
  @Input() showModal = false;
  @Output() modalClosed = new EventEmitter<void>();

  productForm: FormGroup;
  selectedFile: File | null = null;
  isDragging = false;
  isSubmitting = false;

  // Mock data - replace with actual data from your service
  categories = ['Electronics', 'Clothing', 'Food', 'Books'];
  vendors = ['Vendor A', 'Vendor B', 'Vendor C'];
  statuses = ['Available', 'Out of Stock', 'Low Stock'];

  constructor(
    private fb: FormBuilder,
    private toast: NgToastService
  ) {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      vendor: ['', Validators.required],
      quantity: ['', [Validators.required, Validators.min(0)]],
      unit: ['', Validators.required],
      status: ['', Validators.required]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
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
    }
  }

  closeModal(): void {
    this.modalClosed.emit();
    this.productForm.reset();
    this.selectedFile = null;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    const formData = {
      ...this.productForm.value,
      image: this.selectedFile
    };

    // Replace with your actual API call
    console.log('Submitting:', formData);
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.toast.success({
        detail: 'Success',
        summary: 'Product added successfully',
        duration: 3000
      });
      this.closeModal();
    }, 1000);
  }
}
