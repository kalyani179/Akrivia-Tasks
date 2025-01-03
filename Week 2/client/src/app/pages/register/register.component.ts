import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from 'src/app/service/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm !: FormGroup;

  constructor(private auth:AuthService) { }

  ngOnInit(): void {
    this.registerForm = new FormGroup({
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
  }
  get username(): FormControl {
    return this.registerForm.get('username') as FormControl; 
  }

  get email(): FormControl {
    return this.registerForm.get('email') as FormControl;
  }
  
  get password(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }

  onSubmit(): void {
    const data = this.registerForm.value;
    this.auth.register(data).subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);
        if (response.message) {
          alert(response.message);
        } else {
          alert('Registration successful');
        }
        this.registerForm.reset();
      },
      error: (err) => {
        console.error('Error during registration:', err);
        if (err.error.message) {
          alert(err.error.message);
        } else {
          alert('Registration failed');
        }
        this.registerForm.reset();
      }
    });
  }
}