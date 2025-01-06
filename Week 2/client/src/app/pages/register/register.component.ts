import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  registerForm !: FormGroup;

  constructor(private auth: AuthService, private router: Router, private toast: NgToastService) {}

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      username: new FormControl('', [Validators.required, Validators.minLength(3)]),
      gender: new FormControl('', [Validators.required]),
      dob: new FormControl('', [Validators.required]),
      course: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.pattern(
          '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}' // Pattern for strong password
        ),
      ])
    });
  }

  get username(): FormControl {
    return this.registerForm.get('username') as FormControl;
  }

  get gender(): FormControl {
    return this.registerForm.get('gender') as FormControl;
  }

  get dob(): FormControl {
    return this.registerForm.get('dob') as FormControl;
  }

  get course(): FormControl {
    return this.registerForm.get('course') as FormControl;
  }


  get email(): FormControl {
    return this.registerForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }


  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const data = this.registerForm.value;
    this.auth.register(data).subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);
        this.toast.success({
          detail: 'Registration successful',
          summary: response.message,
          duration: 5000
        });
        this.router.navigate(['/login']);
        this.registerForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error during registration:', err);
        const errorMessage = err.error?.message || 'An error occurred. Please try again.';
        this.toast.error({
          detail: 'Registration failed',
          summary: errorMessage,
          duration: 5000
        });
      }
    });
  }
}
