import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { Observable, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loginResponse$!: Observable<any>;

  constructor(public router: Router, private auth: AuthService, private toast: NgToastService) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(
          '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}' // Pattern for strong password
        )
      ])
    });
  }

  get email(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const data = this.loginForm.value;

    this.loginResponse$ = this.auth.login(data).pipe(
      tap(response => {
        if (response.refreshToken && response.accessToken) {
          // On success, show the success toast and redirect
          this.toast.success({
            detail: 'Login successful',
            summary: response.message,
            duration: 5000
          });
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          this.router.navigate(['/profile']);
        }
      }),
      catchError(err => {
        const errorMessage = err.error?.message || 'An error occurred. Please try again.';
        this.toast.error({
          detail: 'Login failed',
          summary: errorMessage,
          duration: 5000
        });
        return of(null); // Return null observable to continue the stream
      })
    );
  }
}
