import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { InventoryTableComponent } from './components/inventory-table/inventory-table.component';
import { AddProductComponent } from './components/inventory-table/components/add-products/add-product.component';
import { ImportModalComponent } from './components/inventory-table/components/import-modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    DashboardComponent,
    NavbarComponent,
    FileUploadComponent,
    InventoryTableComponent,
    AddProductComponent,
    ImportModalComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [DashboardComponent]
})
export class DashboardModule { }