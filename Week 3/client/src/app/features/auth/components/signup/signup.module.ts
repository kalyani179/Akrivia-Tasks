import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SignupComponent } from './signup.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgToastModule } from 'ng-angular-popup';

const routes: Routes = [
  { path: '', component: SignupComponent }
];

@NgModule({
  declarations: [SignupComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NgToastModule,
    RouterModule.forChild(routes)
  ]
})
export class SignupModule { } 