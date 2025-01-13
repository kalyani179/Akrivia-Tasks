import { Component, OnInit } from '@angular/core';
import { ProductService } from 'src/app/core/services/product.service';

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
export class InventoryTableComponent implements OnInit {
  inventoryItems: InventoryItem[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  showAddProductModal = false;
  loading = false;
  error = '';
  Math = Math;
  totalVendors = 0;

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

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadInventoryItems();
    this.loadVendorCount();
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
    // Implement download functionality
  }

  importProducts(): void {
    // Implement import functionality
  }
}
