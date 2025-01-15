import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import jsPDF from 'jspdf';
import { NgToastService } from 'ng-angular-popup';
import { ProductService } from 'src/app/core/services/product.service';
import * as XLSX from 'xlsx';

interface InventoryItem {
  product_id: number;
  product_name: string;
  category: string;
  quantity_in_stock: number;
  unit_price: number;
  unit: string;
  product_image: string;
  status: string;
  created_at: string;
  updated_at: string;
  vendors: string[];
  isChecked?: boolean;
}

interface InventoryResponse {
  items: InventoryItem[];
  total: number;
  totalPages: number;
}

interface ColumnFilter {
  key: string;
  label: string;
  checked: boolean;
}

interface ExcelProduct {
  'Product Name'?: string;
  'productName'?: string;
  'Category'?: string;
  'category'?: string;
  'Vendors'?: string | string[];
  'vendors'?: string | string[];
  'Quantity'?: number;
  'quantity'?: number;
  'Unit'?: string;
  'unit'?: string;
  'Status'?: string;
  'status'?: string;
}

interface EditForm {
  product_name: string;
  category: string;
  vendors: string;
  selectedVendors: string[];
  quantity_in_stock: number;
  unit: string;
  status: string;
}

@Component({
  selector: 'app-inventory-table',
  templateUrl: './inventory-table.component.html',
  styleUrls: ['./inventory-table.component.scss']
})
export class InventoryTableComponent implements OnInit, OnDestroy {
  inventoryItems: InventoryItem[] = [];
  currentPage = 1;
  itemsPerPage = 3;
  totalItems = 0;
  totalPages = 0;
  showAddProductModal = false;
  showImportModal = false;
  loading = false;
  error = '';
  Math = Math;
  totalVendors = 0;
  showCart = false;
  showAll = true;
  selectedFile : File | null = null;
  isDragging = false;
  showDeleteModal = false;
  selectedItem: InventoryItem | null = null;
  status = 'Available';
  showMoveToCartModal = false;

  isAllSelected = false;


  showFilters = false;
  searchText = '';
  selectedColumns: string[] = [];
  columns: ColumnFilter[] = [
    { key: 'product_name', label: 'Product Name', checked: true },
    { key: 'status', label: 'Status', checked: true },
    { key: 'category', label: 'Category', checked: true },
    { key: 'vendors', label: 'Vendors', checked: true },
    { key: 'quantity_in_stock', label: 'Quantity', checked: true },
    { key: 'unit', label: 'Unit', checked: true }
  ];
 

  refreshSubscription: any;
  selectedItems: InventoryItem[] = [];
  editingItem: InventoryItem | null = null;
  editForm: EditForm = {
    product_name: '',
    category: '',
    vendors: '',
    selectedVendors: [],
    quantity_in_stock: 0,
    unit: '',
    status: ''
  };

  availableVendors: string[] = [
    'Zepto',
    'Blinkit',
    'Fresh Meat',
    'Swiggy',
    'Dunzo',
    'Big Basket'
  ];
  availableCategories: string[] = [];

  constructor(
    private productService: ProductService, 
    private elementRef: ElementRef,
    private toast: NgToastService
  ) {}

  ngOnInit(): void {
    this.loadInventoryItems();
    this.loadVendorCount();
    this.loadVendorsAndCategories();

    // Subscribe to refresh events
    this.refreshSubscription = this.productService.refreshInventory$.subscribe(() => {
      this.loadInventoryItems();
      this.loadVendorCount();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const filtersMenu = this.elementRef.nativeElement.querySelector('.filter-menu');
    console.log('Clicked target:', event.target);
    console.log('Is target inside menu:', filtersMenu?.contains(event.target as Node));
    if (!filtersMenu?.contains(event.target as Node)) {
      this.showFilters = false;
    }
  }

  toggleSelectAll(): void {
    this.isAllSelected = !this.isAllSelected;
    
    // Clear the selectedItems array first if we're deselecting all
    if (!this.isAllSelected) {
      this.selectedItems = [];
    } else {
      // If selecting all, replace selectedItems with all current inventory items
      this.selectedItems = [...this.inventoryItems];
    }

    // Update the isChecked property for all items
    this.inventoryItems.forEach(item => {
      item.isChecked = this.isAllSelected;
    });
  }  
  
  
  toggleAll(){
    this.showAll = true;
    this.showCart = false;
    console.log('showAll', this.showAll);
  }

  toggleCart(){
    this.showAll = false;
    this.showCart = true;
    console.log('showCart', this.showCart);
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
      if (this.isExcelFile(file)) {
        this.selectedFile = file;
      } else {
        this.toast.error({
          detail: 'Please upload only Excel files (.xlsx, .xls)',
          summary: 'Invalid File',
          duration: 3000
        });
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isExcelFile(file)) {
        this.selectedFile = file;
        this.readExcelFile(file);
      } else {
        this.toast.error({
          detail: 'Please upload only Excel files (.xlsx, .xls)',
          summary: 'Invalid File',
          duration: 3000
        });
        input.value = ''; // Clear the input
        this.selectedFile = null;
      }
    }
  }

  isExcelFile(file: File): boolean {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ];
    return allowedTypes.includes(file.type);
  }

  readExcelFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelProduct[];
        
        console.log('Raw Excel Data:', jsonData); // Debug log

        // Format the data with proper type checking
        const formattedProducts = jsonData.map(row => {
          // Handle vendors field safely
          let vendorsList: string[] = [];
          if (row.Vendors || row.vendors) {
            const vendorsData = row.Vendors || row.vendors;
            if (typeof vendorsData === 'string') {
              vendorsList = vendorsData.split(',').map((vendor: string) => vendor.trim());
            } else if (Array.isArray(vendorsData)) {
              vendorsList = vendorsData;
            }
          }

          return {
            productName: row['Product Name'] || row.productName || '',
            category: row['Category'] || row.category || '',
            vendors: vendorsList,
            quantity: Number(row['Quantity'] || row.quantity || 0),
            unit: row['Unit'] || row.unit || '',
            status: row['Status'] || row.status || 'Active'
          };
        });

        console.log('Formatted Products:', formattedProducts); // Debug log

        // Use bulk upload
        this.productService.bulkAddProducts(formattedProducts).subscribe({
          next: (response) => {
            this.toast.success({
              detail: 'Products added successfully',
              summary: 'Success',
              duration: 3000
            });
            this.loadInventoryItems();
            this.closeUploadModal();
          },
          error: (error) => {
            console.error('Upload error:', error);
            this.toast.error({
              detail: `Failed to add products: ${error.message}`,
              summary: 'Error',
              duration: 3000
            });
          }
        });
      } catch (error) {
        console.error('Error processing Excel file:', error);
        this.toast.error({
          detail: 'Error processing Excel file. Please check the file format.',
          summary: 'Error',
          duration: 3000
        });
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      this.toast.error({
        detail: 'Error reading file',
        summary: 'Error',
        duration: 3000
      });
    };

    reader.readAsArrayBuffer(file);
  }

  uploadFile(): void {
    console.log('File uploaded:', this.selectedFile);
    this.showImportModal = false;
  }
  
  openUploadModal(): void {
    this.showImportModal = true;
  }

  closeUploadModal(): void {
    this.showImportModal = false;
    this.selectedFile = null;
  }

  openDeleteModal(item: InventoryItem): void {
    this.showDeleteModal = true;
    this.selectedItem = item;
  } 

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedItem = null;
  }

  loadInventoryItems(): void {
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
    };

    this.loading = true;
    this.error = '';
    this.productService.getInventoryItems(params).subscribe({
      next: (response: InventoryResponse) => {
        this.inventoryItems = response.items;
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err: Error) => {
        console.error('Error loading inventory items:', err);
        this.error = 'Failed to load inventory items. Please try again.';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInventoryItems();
    if (this.inventoryItems && this.selectedItems) {
      this.isAllSelected = this.inventoryItems.every(item => this.selectedItems.includes(item));
    }
  }

  get pages(): number[] {
    const totalPages = Math.min(5, this.totalPages || 0);
    const currentPage = this.currentPage;
    const pages: number[] = [];
    
    if (this.totalPages && this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else if (this.totalPages) {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min((this.totalPages - 1), currentPage + 1);
      
      if (start > 2) {
        pages.push(-1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < this.totalPages - 1) {
        pages.push(-1);
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  openAddProductModal(): void {
    this.showAddProductModal = true;
  }

  closeAddProductModal(): void {
    this.showAddProductModal = false;
  }

  openImportModal(): void {
    console.log('Opening import modal');
    this.showImportModal = true;
  }

  closeImportModal(): void {
    console.log('Closing import modal');
    this.showImportModal = false;
  }

  importProducts(): void {
    console.log('Import button clicked');
    this.showImportModal = true;
    console.log('showImportModal set to:', this.showImportModal);
  }

  onProductAdded(newProduct: any): void {
    this.loadInventoryItems(); // Refresh the list
    this.closeAddProductModal();
  }


  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  onColumnToggle(column: ColumnFilter): void {
    column.checked = !column.checked;
    this.selectedColumns = this.columns
      .filter(col => col.checked)
      .map(col => col.key);
  }

  onSearch(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchText = searchValue;
    this.loadInventoryItems();
  }

  loadVendorCount(): void {
    this.productService.getVendorCount().subscribe({
      next: (count: number) => {
        this.totalVendors = count;
      },
      error: (error: Error) => {
        console.error('Error loading vendor count:', error);
      }
    });
  }

  downloadAll(): void {
    // Determine which items to download (selected items or all items)
    const itemsToDownload = this.selectedItems.length > 0 ? this.selectedItems : this.inventoryItems;

    // Format the data
    const formattedData = itemsToDownload.map((item: InventoryItem) => ({
      'Product Name': item.product_name,
      'Category': item.category,
      'Status': item.quantity_in_stock > 0 ? 'Available' : 'Sold Out',
      'Vendors': Array.isArray(item.vendors) ? item.vendors.join(', ') : item.vendors,
      'Quantity': item.quantity_in_stock,
      'Unit': item.unit,
      'Created At': new Date(item.created_at).toLocaleDateString(),
      'Updated At': new Date(item.updated_at).toLocaleDateString()
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = this.selectedItems.length > 0 ? 
      `selected_inventory_${new Date().toISOString().split('T')[0]}.xlsx` :
      `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.download = fileName;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // Show success message
    this.toast.success({
      detail: `${itemsToDownload.length} items downloaded successfully`,
      summary: 'Success',
      duration: 3000
    });
  }
  downloadField(item: any): void {
    const doc = new jsPDF();
    const data: { [key: string]: any } = {
      'Product Name': item.product_name,
      'Category': item.category,
      'Status': item.status,
      'Vendors': Array.isArray(item.vendors) ? item.vendors.join(', ') : item.vendors,
      'Quantity': item.quantity_in_stock,
      'Unit': item.unit,
      'Created At': new Date(item.created_at).toLocaleDateString(),
      'Updated At': new Date(item.updated_at).toLocaleDateString()
    };
  
    let yOffset = 10; // Start position for text
  
    Object.keys(data).forEach((key) => {
      doc.text(`${key}: ${data[key]}`, 10, yOffset);
      yOffset += 10; // Move down for the next line
    });
  
    doc.save(`${item.product_name}.pdf`); // Save as PDF with dynamic filename
  }   

  deleteProduct(): void {
    if (this.selectedItem) {
      this.productService.deleteProduct(this.selectedItem.product_id.toString()).subscribe({
        next: () => {
          this.loadInventoryItems();
          this.closeDeleteModal();
        }
      });
    } else {
      console.error('No product selected for deletion');
    } 
  }

 // cart functions
  increaseQuantity(item: any): void {
    item.quantity_in_stock++;
  }
  
  decreaseQuantity(item: any): void {
    if (item.quantity_in_stock > 0) {
      item.quantity_in_stock--;
    }
  }

  openMoveToCartModal(): void {   
    this.showMoveToCartModal = true;
  }

  closeMoveToCartModal(): void {
    this.showMoveToCartModal = false;
  }

  toggleFileSelection(item: InventoryItem): void {
    if (!this.selectedItems) {
      this.selectedItems = [];
    }

    item.isChecked = !item.isChecked;

    if (item.isChecked) {
      if (!this.selectedItems.includes(item)) {
        this.selectedItems.push(item);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(selectedItem => selectedItem.product_id !== item.product_id);
    }

    if (this.inventoryItems) {
      this.isAllSelected = this.inventoryItems.every(item => item.isChecked);
    }
  }

  startEditing(item: InventoryItem): void {
    this.editingItem = item;
    this.editForm = {
      product_name: item.product_name,
      category: item.category,
      vendors: item.vendors.join(','),
      selectedVendors: [...item.vendors],
      quantity_in_stock: item.quantity_in_stock,
      unit: item.unit,
      status: item.status
    };
  }

  saveEdit(item: InventoryItem): void {
    const updatedProduct = {
      ...item,
      product_name: this.editForm.product_name,
      category: this.editForm.category,
      vendors: this.editForm.selectedVendors,
      quantity_in_stock: Number(this.editForm.quantity_in_stock),
      unit: this.editForm.unit,
      status: this.editForm.status
    };

    this.productService.updateProduct(item.product_id.toString(), updatedProduct).subscribe({
      next: () => {
        this.toast.success({
          detail: 'Product updated successfully',
          summary: 'Success',
          duration: 3000
        });
        this.loadInventoryItems();
        this.editingItem = null;
      },
      error: (error) => {
        this.toast.error({
          detail: 'Failed to update product',
          summary: 'Error',
          duration: 3000
        });
      }
    });
  }

  cancelEdit(): void {
    this.editingItem = null;
    this.editForm = {
      product_name: '',
      category: '',
      vendors: '',
      selectedVendors: [],
      quantity_in_stock: 0,
      unit: '',
      status: ''
    };
  }

  loadVendorsAndCategories(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.availableCategories = categories.map(c => c.category_name);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onVendorsChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedVendors = Array.from(select.selectedOptions).map(option => option.value);
    this.editForm.vendors = selectedVendors.join(',');
  }

  toggleVendor(vendor: string): void {
    const index = this.editForm.selectedVendors.indexOf(vendor);
    if (index === -1) {
      // Add vendor if not selected
      this.editForm.selectedVendors.push(vendor);
    } else {
      // Remove vendor if already selected
      this.editForm.selectedVendors.splice(index, 1);
    }
    // Update the vendors string
    this.editForm.vendors = this.editForm.selectedVendors.join(',');
  }
}
