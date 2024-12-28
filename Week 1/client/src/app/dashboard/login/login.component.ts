import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, FormGroup, FormsModule,ReactiveFormsModule,Validators } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule,NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  constructor(private http: HttpClient) {}

  loginForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(6),
      Validators.pattern(
        '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}' // Pattern for strong password
      ),
    ]),
  });
   get email(): FormControl {
      return this.loginForm.get('email') as FormControl;
    }
    
    get password(): FormControl {
      return this.loginForm.get('password') as FormControl;
    }

  onSubmit() {
    if (this.loginForm.invalid) {
      console.log('Form is invalid');
      return;
    }
  
    const loginData = this.loginForm.value; 
    console.log('Login data:', loginData);

    this.http.post('http://localhost:3000/login', loginData)
      .subscribe({
        next: (response: any) => {
          console.log('Login successful:', response);
          if (response.message) {
            alert(response.message);
          } else {
            alert('Login successful');
          }
        },
        error: (err) => {
          console.error('Error during Login:', err);
          if (err.error.message) {
            alert(err.error.message);
          } else {
            alert('Login failed');
          }
        }
      });
  }
}
