import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService, private toast: NgToastService) {}

  canActivate(): Observable<boolean> | boolean {
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    if (accessToken) {
      if (this.authService.isTokenValid(accessToken)) {
        return true;
      } else if (userId) {
        // Access token is expired, try to refresh it using userId
        return this.authService.refreshToken().pipe(
          map((response: any) => {
            localStorage.setItem('accessToken', response.accessToken);
            return true;
          }),
          catchError((error) => {
            console.error('Token refresh failed:', error);
            this.toast.error({ detail: 'Session Expired', summary: 'Please login again to continue.', duration: 5000 });
            this.router.navigate(['/login']);
            return of(false);
          })
        );
      }
    }

    this.toast.error({ detail: 'Access Denied', summary: 'Please login to access the dashboard.', duration: 5000 });
    this.router.navigate(['/login']);
    return false;
  }
}