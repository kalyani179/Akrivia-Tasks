import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {  NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {

  signupForm !: FormGroup;

  constructor(private toast:NgToastService) { }

  ngOnInit(): void {
    this.signupForm = new FormGroup({
      firstname : new FormControl('',[Validators.required]),
      lastname : new FormControl('',[Validators.required]),
      email : new FormControl('',[Validators.required,Validators.email]),
      password : new FormControl('',[Validators.required,Validators.minLength(8)])
    })
  }

  get firstname() : FormControl {
    return this.signupForm.get('firstname') as FormControl;
  }

  get lastname() : FormControl {
    return this.signupForm.get('lastname') as FormControl
  }

  get email(): FormControl {
    return this.signupForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.signupForm.get('password') as FormControl;
  }

  onSubmit() : void {
    if (this.signupForm.valid) {
      // Handle login logic here
      this.toast.success({ detail: 'Success', summary: 'Login successful', duration: 5000 });
    } else {
      this.toast.error({ detail: 'Error', summary: 'Invalid login credentials', duration: 5000 });
    }
  }

}
