import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FacialRecognitionService } from '../../services/facial-recognition.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  signinForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '/';
  showPassword = false;
  showForgotPasswordModal = false;
  
  // Facial recognition properties
  showFacialLogin = false;
  showCameraPreview = false;
  isRecognizing = false;
  recognitionResult: any = null;
  currentStream: MediaStream | null = null;
  private isFacialRecognitionLogin = false;
  showPasswordInput: boolean = false;
  recognizedUser: any = null;
  passwordInput: string = '';
  @ViewChild('facialVideoElement') facialVideoElement!: ElementRef<HTMLVideoElement>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private facialRecognitionService: FacialRecognitionService
  ) {}

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Check if user is already logged in (but not during facial recognition login)
    if (this.authService.isAuthenticated() && !this.isFacialRecognitionLogin) {
      const role = this.authService.getRole();
      if (role) {
        this.authService.navigateToDashboard(role);
      }
    }

    this.initializeForm();
  }

  initializeForm(): void {
    this.signinForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.signinForm.invalid) {
      this.markFormGroupTouched(this.signinForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.signinForm.value.email,
      password: this.signinForm.value.password
    };

    this.authService.signin(credentials).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Navigation is handled in the auth service
      },
      error: (error) => {
        this.isLoading = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openForgotPasswordModal(): void {
    this.showForgotPasswordModal = true;
  }

  closeForgotPasswordModal(): void {
    this.showForgotPasswordModal = false;
  }

  get f() {
    return this.signinForm.controls;
  }

  // Facial recognition methods
  openFacialLogin(): void {
    this.showFacialLogin = true;
    this.isFacialRecognitionLogin = true;
    this.errorMessage = '';
    this.recognitionResult = null;
  }

  closeFacialLogin(): void {
    this.stopCameraPreview();
    this.showFacialLogin = false;
    this.isFacialRecognitionLogin = false;
    this.recognitionResult = null;
  }

  private authenticateWithBackend(member: any): void {
    // For facial recognition, authenticate with the special backend endpoint
    // that accepts facial recognition data and returns a real JWT token
    
    
    const facialCredentials = {
      email: member.email,
      memberId: member.id,
      gymId: member.gym_id,
      firstname: member.firstname,
      lastname: member.lastname
    };


    this.authService.signinFacial(facialCredentials).subscribe({
      next: (response) => {
        
        // Success! The user is now properly authenticated with the backend
        // The backend provided a real JWT token with all the correct data
        
        // Close the facial recognition modal immediately after authentication
        this.showFacialLogin = false;
        this.isFacialRecognitionLogin = false;
        
        // The user will be redirected to their dashboard by the normal signin flow
      },
      error: (error) => {
        console.error('❌ Facial recognition authentication failed:', error);
        console.log('User was recognized but backend authentication failed');
        // Could show error message to user here
      }
    });
  }




  async startCameraPreview(): Promise<void> {
    this.showCameraPreview = true;
    this.errorMessage = '';

    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (this.facialVideoElement) {
        this.facialVideoElement.nativeElement.srcObject = this.currentStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      this.errorMessage = 'Failed to access camera. Please check permissions and try again.';
      this.showCameraPreview = false;
    }
  }

  stopCameraPreview(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    this.showCameraPreview = false;
  }

  async captureFromPreview(): Promise<void> {
    if (!this.facialVideoElement || !this.currentStream) return;

    this.isRecognizing = true;
    this.errorMessage = '';

    try {
      const video = this.facialVideoElement.nativeElement;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      const base64Image = imageData.split(',')[1];
      
      const result = await this.facialRecognitionService.recognizeFace({ image: base64Image }).toPromise();
      
      this.recognitionResult = result;
      
      if (result?.recognized && result.member) {
        const member = result.member;
        this.errorMessage = '';
        
        // Stop camera first
        this.stopCameraPreview();
        
        // Wait 2 seconds to show the recognition message, then authenticate
        setTimeout(() => {
          this.authenticateWithBackend(member);
        }, 2000);
      } else {
        console.log('Face not recognized, result:', result);
        this.errorMessage = 'Face not recognized. Please try again or use email/password login.';
      }

    } catch (error) {
      console.error('Facial recognition error:', error);
      this.errorMessage = 'Facial recognition failed. Please try again or use email/password login.';
    } finally {
      this.isRecognizing = false;
    }
  }

  async captureAndRecognize(): Promise<void> {
    this.isRecognizing = true;
    this.errorMessage = '';
    this.recognitionResult = null;

    try {
      const base64Image = await this.facialRecognitionService.captureFromCamera();
      
      const result = await this.facialRecognitionService.recognizeFace({ image: base64Image }).toPromise();
      
      this.recognitionResult = result;
      
      if (result?.recognized && result.member) {
        const member = result.member;
        this.errorMessage = '';
        
        // Wait 2 seconds to show the recognition message, then authenticate
        setTimeout(() => {
          this.authenticateWithBackend(member);
        }, 2000);
      } else {
        console.log('Face not recognized, result:', result);
        this.errorMessage = 'Face not recognized. Please try again or use email/password login.';
      }

    } catch (error) {
      console.error('Facial recognition error:', error);
      this.errorMessage = 'Facial recognition failed. Please try again or use email/password login.';
    } finally {
      this.isRecognizing = false;
    }
  }

  async uploadAndRecognize(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    this.isRecognizing = true;
    this.errorMessage = '';
    this.recognitionResult = null;

    try {
      const base64Image = await this.facialRecognitionService.fileToBase64(file);
      const result = await this.facialRecognitionService.recognizeFace({ image: base64Image }).toPromise();
      
      this.recognitionResult = result;
      
      if (result?.recognized && result.member) {
        const member = result.member;
        this.errorMessage = '';
        
        // Wait 2 seconds to show the recognition message, then authenticate
        setTimeout(() => {
          this.authenticateWithBackend(member);
        }, 2000);
      } else {
        this.errorMessage = 'Face not recognized. Please try again or use email/password login.';
      }

    } catch (error) {
      console.error('Facial recognition error:', error);
      this.errorMessage = 'Facial recognition failed. Please try again or use email/password login.';
    } finally {
      this.isRecognizing = false;
    }
  }
}
