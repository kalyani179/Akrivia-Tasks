import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  
  loginForm !: FormGroup;

  constructor(private auth: AuthService, private router: Router, private toast: NgToastService) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern(
          '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}' // Pattern for strong password
        ),
      ]),
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
    this.auth.login(data).subscribe({
      next: (response: any) => {
        if (response.accessToken && response.refreshToken) {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        console.log('Login successful:', response);
  
        this.toast.success({
          detail: 'Login successful',
          summary: response.message,
          duration: 5000
        });
        this.router.navigate(['/profile']);
        this.loginForm.reset();
      },
      error: (err) => {
        console.error('Error during login:', err);
        const errorMessage = err.error?.message || 'An error occurred. Please try again.';
        this.toast.error({
          detail: 'Login failed',
          summary: errorMessage,
          duration: 5000
        });
      }
    });
  }
}