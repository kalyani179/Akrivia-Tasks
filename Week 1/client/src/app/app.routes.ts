import { Routes } from '@angular/router';

// Lazy Loading => components are loaded only when needed, improving initial load times.

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./dashboard/home/home.component').then(m => m.HomeComponent),
    },
    {
        path: 'register',
        loadComponent: () => import('./dashboard/register/register.component').then(m => m.RegisterComponent),
    },
    {
        path: 'login',
        loadComponent: () => import('./dashboard/login/login.component').then(m => m.LoginComponent),
    },
];


