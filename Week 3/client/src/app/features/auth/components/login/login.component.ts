import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm !: FormGroup;

  constructor(private toast: NgToastService) {}

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('',[Validators.required, Validators.minLength(8)])
    });
  }

  get email(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      // Handle login logic here
      this.toast.success({ detail: 'Success', summary: 'Login successful', duration: 5000 });
    } else {
      this.toast.error({ detail: 'Error', summary: 'Invalid login credentials', duration: 5000 });
    }
  }
}