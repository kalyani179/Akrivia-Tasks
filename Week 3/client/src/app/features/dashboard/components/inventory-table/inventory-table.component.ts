import { Component, OnInit, OnDestroy } from '@angular/core';
import jsPDF from 'jspdf';
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

@Component({
  selector: 'app-inventory-table',
  templateUrl: './inventory-table.component.html',
  styleUrls: ['./inventory-table.component.scss']
})
export class InventoryTableComponent implements OnInit, OnDestroy {
  inventoryItems: InventoryItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;
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

  showFilters = false;
  searchText = '';
  selectedColumns: string[] = [];
  columns: ColumnFilter[] = [
    { key: 'product_name', label: 'Product Name', checked: true },
    { key: 'status', label: 'Status', checked: true },
    { key: 'category', label: 'Category', checked: true },
    { key: 'vendors', label: 'Vendors', checked: true },
    { key: 'quantity_in_stock', label: 'Quantity', checked: true },
    { key: 'unit_price', label: 'Unit Price', checked: true }
  ];


  refreshSubscription: any;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadInventoryItems();
    this.loadVendorCount();

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
      this.selectedFile = files[0];
      this.uploadFile();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
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
      search: this.searchText,
      columns: this.selectedColumns.join(',')
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
      error: (err) => {
        console.error('Error loading inventory items:', err);
        this.error = 'Failed to load inventory items. Please try again.';
        this.loading = false;
      }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadInventoryItems();
  }

  get pages(): number[] {
    const totalPages = Math.min(5, this.totalPages); // Show max 5 pages
    const currentPage = this.currentPage;
    const pages: number[] = [];
    
    if (this.totalPages <= 5) {
      // If total pages is 5 or less, show all pages
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of the middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(this.totalPages - 1, currentPage + 1);
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < this.totalPages - 1) {
        pages.push(-1); // -1 represents ellipsis
      }
      
      // Always show last page
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'bg-success';
      case 'Out of Stock':
        return 'bg-danger';
      case 'Low Stock':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
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
    // Get all inventory items without pagination
    this.productService.getAllInventoryItems().subscribe({
      next: (inventoryData: any[]) => {
        const formattedData = inventoryData.map((item: any) => ({
          'Product Name': item.product_name,
          'Category': item.category,
          'Status': item.status,
          'Vendors': Array.isArray(item.vendors) ? item.vendors.join(', ') : item.vendors,
          'Quantity': item.quantity_in_stock,
          'Unit Price': item.unit_price,
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
        link.download = `inventory_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error: Error) => {
        console.error('Error downloading inventory:', error);
      }
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
      'Unit Price': item.unit_price
    };
  
    let yOffset = 10; // Start position for text
  
    Object.keys(data).forEach((key) => {
      doc.text(`${key}: ${data[key]}`, 10, yOffset);
      yOffset += 10; // Move down for the next line
    });
  
    doc.save(`${item.product_name}.pdf`); // Save as PDF with dynamic filename
  }   

  deleteProduct(): void {
    console.log('Deleting product:', this.selectedItem);
    this.closeDeleteModal();
  }
}
