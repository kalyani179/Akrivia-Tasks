import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { NgToastService } from 'ng-angular-popup';
import { HttpErrorResponse } from '@angular/common/http';
import { CanComponentDeactivate } from 'src/app/guards/unsaved-changes.guard';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit, CanComponentDeactivate {

  registerForm !: FormGroup;
  isSubmitted = false; // Custom property to track form submission

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

    this.loadFormState();
    this.registerForm.valueChanges.subscribe(() => {
      this.saveFormState();
    });

  }

  saveFormState(): void {
    sessionStorage.setItem('registerForm', JSON.stringify(this.registerForm.value));
  }

  loadFormState(): void {
    const savedForm = sessionStorage.getItem('registerForm');
    if (savedForm) {
      this.registerForm.setValue(JSON.parse(savedForm));
    }
  }

  onSubmit(): void {

    console.log('Changed', this.registerForm.dirty)
    this.isSubmitted = true;

    if (this.registerForm.invalid) {
      this.toast.error({
        detail: 'Error',
        summary: 'Please fill out the form correctly.',
        duration: 5000
      });
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
        this.isSubmitted = true; // Set the custom property to true on successful submission
        this.registerForm.reset();
        sessionStorage.removeItem('registerForm'); // Clear the form state from sessionStorage after successful submission
        this.router.navigate(['/login']); // Navigate to login page after successful registration
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

  canDeactivate(): boolean {
    if (this.registerForm.dirty && !this.isSubmitted) {
      console.log('RegisterComponent: Unsaved changes detected');
      return false;
    }
    return true;
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
}