import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { InventoryTableComponent } from './components/inventory-table/inventory-table.component';
import { AddProductComponent } from './components/inventory-table/components/add-products/add-product.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { FileUploadsComponent } from './components/file-uploads/file-uploads.component';

const routes: Routes = [
  { path: '', component: DashboardComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    NavbarComponent,
    FileUploadComponent,
    InventoryTableComponent,
    AddProductComponent,
    FileUploadsComponent
  ],
  imports: [
    CommonModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    DashboardRoutingModule
  ],
  exports: [DashboardComponent]
})
export class DashboardModule { }