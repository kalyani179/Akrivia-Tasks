import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { NgToastService } from 'ng-angular-popup';
import { ProductService } from '../../../../../../core/services/product.service';
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
  categories = ['Product Designer', 'Product Manager', 'Frontend Developer', 'Backend Developer'];
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

  async onSubmit(): Promise<void> {
    if (this.productForm.invalid || this.isSubmitting) {
      return;
    }

    try {
      this.isSubmitting = true;

      const formData = {
        productName: this.productForm.get('productName')?.value,
        category: this.productForm.get('category')?.value,
        vendors: this.productForm.get('vendors')?.value,
        quantity: this.productForm.get('quantity')?.value,
        unit: this.productForm.get('unit')?.value,
        status: this.productForm.get('status')?.value
      };

      const response = await firstValueFrom(this.productService.addProduct(formData));

      if (response.success) {
        this.toast.success({
          detail: 'Success',
          summary: 'Product added successfully',
          duration: 3000
        });
        // Emit an event to refresh the inventory table
        this.productService.refreshInventory();
      } else {
        throw new Error(response.message || 'Failed to add product');
      }
    } catch (error: any) {
      this.toast.error({
        detail: 'Error',
        summary: error.message || 'Failed to add product',
        duration: 5000
      });
    } finally {
      this.isSubmitting = false;
    }
  }
}
