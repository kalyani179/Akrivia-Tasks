import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './service/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): Observable<boolean> | boolean {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (accessToken) {
      if (this.authService.isTokenValid(accessToken)) {
        // Access token is valid
        return true;
      } else if (refreshToken) {
        // Access token is expired, try to refresh it
        return this.authService.refreshToken().pipe(
          map((response: any) => {
            if (response.accessToken) {
              localStorage.setItem('accessToken', response.accessToken);
              return true;
            } else {
              this.router.navigate(['/login']);
              return false;
            }
          }),
          catchError(() => {
            this.router.navigate(['/login']);
            return of(false);
          })
        );
      } else {
        // No refresh token available
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      // No access token available
      this.router.navigate(['/login']);
      return false;
    }
  }
}