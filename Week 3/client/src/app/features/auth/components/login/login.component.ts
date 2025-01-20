import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { AuthService } from 'src/app/core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm !: FormGroup;
  isSubmitted = false;

  constructor(private toast: NgToastService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('',[Validators.required, Validators.minLength(8)])
    });

    this.loadFormState();
    this.loginForm.valueChanges.subscribe(() => {
      this.saveFormState();
    });
  }

  saveFormState(): void {
    sessionStorage.setItem('loginForm', JSON.stringify(this.loginForm.value));
  }

  loadFormState(): void {
    const savedForm = sessionStorage.getItem('loginForm');
    if (savedForm) {
      this.loginForm.setValue(JSON.parse(savedForm));
    }
  }

  get email(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  onSubmit(): void {
    this.isSubmitted = true;

    if (this.loginForm.invalid) {
      this.toast.error({
        detail: 'Error',
        summary: 'Please fill out the form correctly.',
        duration: 1000
      });
      return;
    }

    const loginData = this.loginForm.value;

    this.authService.login(loginData).subscribe({
      next: (response: any) => {
        this.toast.success({
          detail: 'Success',
          summary: response.message,
          duration: 1000
        });
        this.isSubmitted = true;
        this.loginForm.reset();
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        console.log('Token saved:', localStorage.getItem('accessToken'));
        console.log('Refresh Token saved:', localStorage.getItem('refreshToken'));
        sessionStorage.removeItem('loginForm');
        this.router.navigate(['/dashboard']); 
      },  
      error: (err: HttpErrorResponse) => {
        console.error('Error during login:', err);
        const errorMessage = err.error?.error || 'An error occurred. Please try again.';
        this.toast.error({
          detail: 'Login failed',
          summary: errorMessage,
          duration: 1000
        });
      }
    });
  }
  canDeactivate(): boolean {
    if (this.loginForm.dirty && !this.isSubmitted) {
      return false;
    }
    return true;
  }
}
