import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  genders = ["male", "female"];
  registerForm !: FormGroup;

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      'lastname': new FormControl(null,Validators.required),
      'firstname': new FormControl(null,Validators.required),
      'gender': new FormControl('male'),
      'email': new FormControl(null,[Validators.required,Validators.email]),
      'password': new FormControl(null)
    });
  }

  onSubmit(): void {
    console.log(this.registerForm.value);
  }
}
