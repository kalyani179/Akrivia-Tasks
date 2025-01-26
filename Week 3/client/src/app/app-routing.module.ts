import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/noAuth.guard';
import { UnsavedChangesGuard } from './core/guards/unsaved-changes.guard';

const routes: Routes = [
  {
    path:'',
    redirectTo:'/login',
    pathMatch:'full'
  },
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [NoAuthGuard], // Prevent authenticated users from accessing login
    canDeactivate: [UnsavedChangesGuard]
  },
  { 
    path: 'signup', 
    loadChildren: () => import('./features/auth/components/signup/signup.module').then(m => m.SignupModule),
    canActivate: [NoAuthGuard], // Prevent authenticated users from accessing signup
    canDeactivate: [UnsavedChangesGuard]
  },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard] // Require authentication for dashboard
  },
  { 
    path: 'forgot-password', 
    loadChildren: () => import('./features/auth/components/forgot-password/forgot-password.module').then(m => m.ForgotPasswordModule),
    canActivate: [NoAuthGuard] // Prevent authenticated users from accessing forgot password
  },
  {
    path: 'reset-password/:id/:accessToken',
    loadChildren : () => import('./features/auth/components/reset-password/reset-password.module').then(m => m.ResetPasswordModule),
    canActivate: [NoAuthGuard] // Prevent authenticated users from accessing reset password
  },
  {
    path: 'chat',
    loadChildren: () => import('./features/dashboard/components/chat/chat.module').then(m => m.ChatModule),
    canActivate : [AuthGuard]
  },
  { 
    path: '**', 
    redirectTo: '/dashboard' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
