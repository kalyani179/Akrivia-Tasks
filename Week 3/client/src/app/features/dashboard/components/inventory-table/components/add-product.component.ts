import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { ProductService } from '../../../../../core/services/product.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss']
})
export class AddProductComponent {
  @Input() showModal = false;
  @Output() modalClosed = new EventEmitter<void>();
  @Output() productAdded = new EventEmitter<any>();

  productForm: FormGroup;
  selectedFile: File | null = null;
  isDragging = false;
  isSubmitting = false;
  selectedVendors: string[] = [];

  // Mock data - replace with actual data from your service
  categories = ['Electronics', 'Clothing', 'Food', 'Books'];
  vendors = ['Swiggy','Zepto','Fresh Meat','Blinkit'];
  statuses = ['Created','Active', 'Inactive', 'Deleted'];

  constructor(
    private fb: FormBuilder,
    private toast: NgToastService,
    private productService: ProductService
  ) {
    this.productForm = this.fb.group({
      productName: ['', Validators.required],
      category: ['', Validators.required],
      vendors: [[], Validators.required],
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

  toggleVendor(vendor: string): void {
    const currentVendors = this.productForm.get('vendors')?.value || [];
    const index = currentVendors.indexOf(vendor);
    
    if (index === -1) {
      currentVendors.push(vendor);
    } else {
      currentVendors.splice(index, 1);
    }
    
    this.productForm.patchValue({ vendors: currentVendors });
  }

  isVendorSelected(vendor: string): boolean {
    return (this.productForm.get('vendors')?.value || []).includes(vendor);
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid) {
      return;
    }

    try {
      this.isSubmitting = true;
      let imageUrl = '';

      // Handle file upload to S3 if file is selected
      if (this.selectedFile) {
        // Get presigned URL
        const presignedData = await firstValueFrom(
          this.productService.getPresignedUrl(
            this.selectedFile.name,
            this.selectedFile.type
          )
        );

        // Upload to S3
        await firstValueFrom(
          this.productService.uploadToS3(presignedData.uploadUrl, this.selectedFile)
        );

        // Get the S3 URL (this would be the URL where the file will be accessible)
        imageUrl = presignedData.uploadUrl.split('?')[0];
      }

      // Prepare product data
      const productData = {
        ...this.productForm.value,
        imageUrl
      };

      // Add product
      const response = await firstValueFrom(
        this.productService.addProduct(productData)
      );

      this.toast.success({
        detail: 'Success',
        summary: 'Product added successfully',
        duration: 3000
      });
      
      this.productAdded.emit(response);
      this.closeModal();
    } catch (error) {
      console.error('Error adding product:', error);
      this.toast.error({
        detail: 'Error',
        summary: 'Failed to add product',
        duration: 3000
      });
    } finally {
      this.isSubmitting = false;
    }
  }
}
