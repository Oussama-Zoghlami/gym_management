import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isAdminSignup = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.signupForm = this.fb.group({
      firstname: ['', [Validators.required, Validators.minLength(2)]],
      lastname: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      cin: ['']
    }, { validators: this.passwordMatchValidator });

    // Add CIN validation when Admin signup is selected
    this.updateCinValidation();
  }

  passwordMatchValidator(group: FormGroup): any {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  toggleSignupType(): void {
    this.isAdminSignup = !this.isAdminSignup;
    this.updateCinValidation();
    this.clearMessages();
  }

  updateCinValidation(): void {
    const cinControl = this.signupForm.get('cin');
    if (this.isAdminSignup) {
      cinControl?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      cinControl?.clearValidators();
      cinControl?.setValue('');
    }
    cinControl?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.markFormGroupTouched(this.signupForm);
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const formData = { ...this.signupForm.value };
    delete formData.confirmPassword;

    const signup$ = this.isAdminSignup 
      ? this.authService.signupAdmin(formData)
      : this.authService.signupMember(formData);

    signup$.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Please check your email for verification.';
        
        // Notify SuperAdmin about new registration
        const userType = this.isAdminSignup ? 'Admin' : 'Member';
        const userName = `${formData.firstname} ${formData.lastname}`;
        // Notification removed - using local success message instead
        
        setTimeout(() => {
          this.router.navigate(['/email-verification']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  get f() {
    return this.signupForm.controls;
  }
}
