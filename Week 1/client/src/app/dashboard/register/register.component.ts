import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], 
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent {

  constructor(private http: HttpClient) {}

  registerForm: FormGroup = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(
        '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}' // Pattern for strong password
      ),
    ]),
  });

  get username(): FormControl {
    return this.registerForm.get('username') as FormControl; 
  }

  get email(): FormControl {
    return this.registerForm.get('email') as FormControl;
  }
  
  get password(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      console.log('Form is invalid');
      this.registerForm.markAllAsTouched();
      return;
    }

    const userData = this.registerForm.value;  

    console.log(userData); 

    this.http.post('http://localhost:3000/register', userData)
    .subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);
        if (response.message) {
          alert(response.message);
        } else {
          alert('Registration successful');
        }
      },
      error: (err) => {
        console.error('Error during registration:', err);
        if (err.error.message) {
          alert(err.error.message);
        } else {
          alert('Registration failed');
        }
      }
    });

  }
}
