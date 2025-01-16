import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
  })
  export class NoAuthGuard implements CanActivate {
    constructor(
      private authService: AuthService,
      private router: Router
    ) {}
  
    canActivate(): boolean {
      const token = this.authService.getToken();
      
      if (!token) {
        return true;
      }
  
      // Redirect to dashboard if token exists
      this.router.navigate(['/dashboard']);
      return false;
    }
  }