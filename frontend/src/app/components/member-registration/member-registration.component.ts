import { Component, OnInit } from '@angular/core';
import { FacialRecognitionService, MemberRegistration } from '../../services/facial-recognition.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-member-registration',
  templateUrl: './member-registration.component.html',
  styleUrls: ['./member-registration.component.scss']
})
export class MemberRegistrationComponent implements OnInit {
  memberData: MemberRegistration = {
    firstname: '',
    lastname: '',
    email: '',
    gym_id: 1,
    image: ''
  };

  selectedFile: File | null = null;
  capturedImage: string | null = null;
  isUploading = false;
  isCapturing = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private facialRecognitionService: FacialRecognitionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Initialize with default gym_id or get from route params
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.capturedImage = null;
      this.errorMessage = '';
      
      // Preview the selected image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.memberData.image = (e.target?.result as string).split(',')[1];
      };
      reader.readAsDataURL(file);
    }
  }

  async captureFromCamera(): Promise<void> {
    this.isCapturing = true;
    this.errorMessage = '';

    try {
      const base64Image = await this.facialRecognitionService.captureFromCamera();
      this.memberData.image = base64Image;
      this.capturedImage = `data:image/jpeg;base64,${base64Image}`;
      this.selectedFile = null;
    } catch (error) {
      console.error('Camera capture error:', error);
      this.errorMessage = 'Failed to capture from camera. Please check camera permissions.';
    } finally {
      this.isCapturing = false;
    }
  }

  async registerMember(): Promise<void> {
    // Validate form
    if (!this.memberData.firstname || !this.memberData.lastname || !this.memberData.email) {
      this.errorMessage = 'Please fill in all required fields';
      return;
    }

    if (!this.memberData.image) {
      this.errorMessage = 'Please capture or upload a photo';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.memberData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Validate image for face detection
      const isValidImage = await this.facialRecognitionService.validateImageForFace(this.memberData.image);
      if (!isValidImage) {
        this.errorMessage = 'Please provide a clear photo with your face visible';
        return;
      }

      // Register member with Flask service
      const result = await this.facialRecognitionService.registerMember(this.memberData).toPromise();
      
      this.successMessage = 'Member registered successfully!';
      console.log('Registration result:', result);

      // Reset form
      this.resetForm();

      // Redirect after a short delay
      setTimeout(() => {
        this.router.navigate(['/facial-recognition']);
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);
      this.errorMessage = error.error?.error || 'Registration failed. Please try again.';
    } finally {
      this.isUploading = false;
    }
  }

  resetForm(): void {
    this.memberData = {
      firstname: '',
      lastname: '',
      email: '',
      gym_id: 1,
      image: ''
    };
    this.selectedFile = null;
    this.capturedImage = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  goToFacialRecognition(): void {
    this.router.navigate(['/facial-recognition']);
  }
}
