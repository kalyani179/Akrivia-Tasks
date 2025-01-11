import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignupComponent } from './features/auth/components/signup/signup.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { DashboardComponent } from './features/dashboard/dashboard.component';

const routes: Routes = [
  { path : '', redirectTo : '/login', pathMatch : 'full' },
  { path : 'login',component : LoginComponent,canDeactivate:[UnsavedChangesGuard] },
  { path : 'signup',component : SignupComponent,canDeactivate:[UnsavedChangesGuard] },
  {
    path: 'dashboard',
    component: DashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
