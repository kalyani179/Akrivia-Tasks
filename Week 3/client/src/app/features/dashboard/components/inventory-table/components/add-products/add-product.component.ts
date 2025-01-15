import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { ProductService } from '../../../../../../core/services/product.service';
import { HttpClient } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';

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
  previewUrl: string | null = null;

  // Mock data - replace with actual data from your service
  categories = ['Product Designer', 'Product Manager', 'Frontend Developer', 'Backend Developer'];
  vendors = ['Swiggy','Zepto','Fresh Meat','Blinkit'];
  statuses = ['Created','Active', 'Inactive', 'Deleted'];

  constructor(
    private fb: FormBuilder,
    private toast: NgToastService,
    private productService: ProductService,
    private http: HttpClient
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
      this.createImagePreview();
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
      const file = files[0];
      if (file.type.startsWith('image/')) {
        this.selectedFile = file;
        this.createImagePreview();
      } else {
        this.toast.error({
          detail: 'Please upload only image files',
          summary: 'Invalid File',
          duration: 3000
        });
      }
    }
  }

  handleModalClose(): void {
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

  onSubmit(): void {
    if (this.productForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    if (this.selectedFile) {
      const fileName = this.selectedFile.name;
      const fileType = this.selectedFile.type;
      
      // First get the presigned URL
      this.productService.getPresignedUrlProductImage(fileName, fileType)
        .subscribe({
          next: (response) => {
            const uploadUrl = response.uploadUrl;
            // Upload to S3 with Skip-Auth header
            const headers = new HttpHeaders()
              .set('Content-Type', fileType)
              .set('Skip-Auth', 'true');

            this.http.put(uploadUrl, this.selectedFile, { headers })
              .subscribe({
                next: () => {
                  // After successful upload, add the product with the image URL
                  const productData = {
                    ...this.productForm.value,
                    product_image: response.imageUrl
                  };
                  console.log(productData);
                  this.createProduct(productData);
                },
                error: (err) => {
                  this.isSubmitting = false;
                  console.error('Error uploading image:', err);
                  this.toast.error({
                    detail: 'Upload failed',
                    summary: 'Error uploading image.',
                    duration: 3000
                  });
                }
              });
          },
          error: (err) => {
            this.isSubmitting = false;
            console.error('Error getting presigned URL:', err);
            this.toast.error({
              detail: 'Upload failed',
              summary: 'Error generating pre-signed URL.',
              duration: 3000
            });
          }
        });
    } else {
      // If no image is selected, just add the product without an image
      this.createProduct(this.productForm.value);
    }
  }

  // Separate method to create product
  private createProduct(productData: any): void {
    this.productService.addProduct(productData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.productAdded.emit(response);
        this.handleModalClose();
        this.toast.success({
          detail: 'Product added successfully',
          summary: 'Success',
          duration: 3000
        });
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error adding product:', error);
        this.toast.error({
          detail: 'Failed to add product. Please try again.',
          summary: 'Error',
          duration: 3000
        });
      }
    });
  }

  createImagePreview(): void {
    if (!this.selectedFile) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(this.selectedFile);
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
