import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-add-coach',
  templateUrl: './admin-add-coach.component.html',
  styleUrls: ['./admin-add-coach.component.scss']
})
export class AdminAddCoachComponent {
  form: FormGroup;
  isSubmitting = false;
  successMsg = '';
  errorMsg = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.form = this.fb.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      cin: [''],
      speciality: [''],
      gymName: [''],
      password: [''] // optional; backend can generate temp
    });
  }

  submit(): void {
    this.successMsg = '';
    this.errorMsg = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;
    this.http.post('http://localhost:8080/api/v1/admin/gym/add-coach', this.form.value).subscribe({
      next: () => {
        this.successMsg = 'Coach created successfully.';
        this.isSubmitting = false;
        this.form.reset();
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Failed to create coach.';
        this.isSubmitting = false;
      }
    });
  }
}


