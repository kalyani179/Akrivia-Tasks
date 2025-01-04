import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from './auth.guard';

const routes: Routes = [
  {path:'login',component:LoginComponent},
  {path:'register',component:RegisterComponent},
  {path:'dashboard',component:DashboardComponent},
  {path:'profile',component:ProfileComponent, canActivate: [AuthGuard] },
  {path:'**',component:DashboardComponent} // default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

