import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
        return true;
      } else if (refreshToken) {
        // Access token is expired, try to refresh it
        return this.authService.refreshToken().pipe(
          map((response: any) => {
            if (response.accessToken) {
              localStorage.setItem('accessToken', response.accessToken);
              return true;
            } else { // if the refreshToken is invalid or expired
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