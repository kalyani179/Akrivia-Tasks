import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { NgToastService } from 'ng-angular-popup';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  loading = false;
  id: string = '';
  accessToken: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private toast: NgToastService
  ) {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
    this.accessToken = this.route.snapshot.params['accessToken'];
  }

  resetPassword(): void {
    if (this.resetForm.invalid) return;

    this.loading = true;
    const password = this.resetForm.get('password')?.value;

    this.authService.resetPassword(this.id, this.accessToken, password).subscribe({
      next: () => {
        this.toast.success({
          detail: 'Password reset successful',
          summary: 'Success',
          duration: 3000
        });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toast.error({
          detail: error.error.message || 'Failed to reset password',
          summary: 'Error',
          duration: 3000
        });
        this.loading = false;
      }
    });
  }
}
