import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { InventoryTableComponent } from './components/inventory-table/inventory-table.component';

@NgModule({
  declarations: [
    DashboardComponent,
    NavbarComponent,
    FileUploadComponent,
    InventoryTableComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [DashboardComponent]
})
export class DashboardModule { } 