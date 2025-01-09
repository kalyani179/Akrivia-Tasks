import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';
import { MainComponent } from './main/main.component';
import { UploadProfileImageComponent } from './pages/upload-profile-image/upload-profile-image.component';
import { NoAuthGuard } from './guards/no-auth.guard';
import { UnsavedChangesGuard } from './guards/unsaved-changes.guard';
import { RegisterComponent } from './pages/register/register.component';
import { ViewUserComponent } from './pages/view-user/view-user.component';

const routes: Routes = [
  {
    path: '', component: MainComponent, children: [
      { path: 'login', loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule), canActivate: [NoAuthGuard] },
      { path: 'view-user/:id', component: ViewUserComponent },
      // { path: 'register', loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterModule), canActivate: [NoAuthGuard], canDeactivate: [UnsavedChangesGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [NoAuthGuard], canDeactivate: [UnsavedChangesGuard] },
      { path: 'profile', loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule), canActivate: [AuthGuard] },
      { path: 'upload-profile-image', component: UploadProfileImageComponent, canActivate: [AuthGuard] }
    ]
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }