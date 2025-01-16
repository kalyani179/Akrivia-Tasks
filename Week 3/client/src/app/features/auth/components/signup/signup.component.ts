import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';  // Import HttpClient
import { AuthService } from 'src/app/core/services/auth.service';
import { Router } from '@angular/router';
import { CanComponentDeactivate } from 'src/app/core/guards/unsaved-changes.guard';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})

export class SignupComponent implements OnInit,CanComponentDeactivate {

  signupForm !: FormGroup;
  isSubmitted = false;

  constructor(private toast: NgToastService, private router: Router, private authService:AuthService) { }

  ngOnInit(): void {
    this.signupForm = new FormGroup({
      firstname: new FormControl('', [Validators.required]),
      lastname: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });

    this.loadFormState();
    this.signupForm.valueChanges.subscribe(() => {
      this.saveFormState();
    });
  }

  get firstname(): FormControl {
    return this.signupForm.get('firstname') as FormControl;
  }

  get lastname(): FormControl {
    return this.signupForm.get('lastname') as FormControl;
  }

  get email(): FormControl {
    return this.signupForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.signupForm.get('password') as FormControl;
  }

  saveFormState(): void {
    sessionStorage.setItem('signupForm', JSON.stringify(this.signupForm.value));
  }

  loadFormState(): void {
    const savedForm = sessionStorage.getItem('signupForm');
    if (savedForm) {
      this.signupForm.setValue(JSON.parse(savedForm));
    }
  }

  onSubmit(): void {

    console.log('Changed', this.signupForm.dirty)
    this.isSubmitted = true;

    if (this.signupForm.invalid) {
      this.toast.error({
        detail: 'Error',
        summary: 'Please fill out the form correctly.',
        duration: 1000
      });
      return;
    }

    const userData = this.signupForm.value;

    this.authService.signup(userData).subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);
        this.toast.success({
          detail: 'Registration successful',
          summary: response.message,
          duration: 1000
        });
        this.isSubmitted = true; // Set the custom property to true on successful submission
        this.signupForm.reset();
        sessionStorage.removeItem('signupForm'); // Clear the form state from sessionStorage after successful submission
        this.router.navigate(['/login']); // Navigate to login page after successful registration
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error during registration:', err);
        const errorMessage = err.error?.error || 'An error occurred. Please try again.';
        this.toast.error({
          detail: 'Registration failed',
          summary: errorMessage,
          duration: 1000
        });
      }
    });
  }

  canDeactivate(): boolean {
    if (this.signupForm.dirty && !this.isSubmitted) {
      console.log('RegisterComponent: Unsaved changes detected');
      return false;
    }
    return true;
  }
}
