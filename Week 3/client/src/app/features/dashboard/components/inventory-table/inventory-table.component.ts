import { Component } from '@angular/core';

interface InventoryItem {
  productName: string;
  status: string;
  category: string;
  vendors: string[];
  quantity: number;
  unit: string;
}

@Component({
  selector: 'app-inventory-table',
  templateUrl: './inventory-table.component.html',
  styleUrls: ['./inventory-table.component.scss']
})
export class InventoryTableComponent {
  inventoryItems: InventoryItem[] = [
    {
      productName: 'Maggie',
      status: 'Available',
      category: 'Product Designer',
      vendors: ['Zepto', 'Blinkit', 'Swiggy'],
      quantity: 100,
      unit: '1 piece'
    }
  ];

  showAddProductModal = false;

  openAddProductModal(): void {
    this.showAddProductModal = true;
  }

  closeAddProductModal(): void {
    this.showAddProductModal = false;
  }
}
