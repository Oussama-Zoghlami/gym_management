import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, OnChanges } from '@angular/core';
import { SubscriptionService, SubscriptionPlan } from '../../services/subscription.service';
import { FacialRecognitionService } from '../../services/facial-recognition.service';

@Component({
  selector: 'app-subscription-modal',
  templateUrl: './subscription-modal.component.html',
  styleUrls: ['./subscription-modal.component.scss']
})
export class SubscriptionModalComponent implements OnDestroy, OnChanges {
  @Input() gym: any;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  
  plans: SubscriptionPlan[] = [];
  selectedPlan: SubscriptionPlan | null = null;
  isLoading: boolean = false;
  
  // Photo capture properties
  showPhotoCapture: boolean = false;
  capturedPhoto: string | null = null;
  isCapturingPhoto: boolean = false;
  photoError: string = '';
  showCameraPreview: boolean = false;
  currentStream: MediaStream | null = null;
  
  @ViewChild('cameraVideo') cameraVideo!: ElementRef<HTMLVideoElement>;
  
  constructor(
    private subscriptionService: SubscriptionService,
    private facialRecognitionService: FacialRecognitionService
  ) {
    this.updatePlansFromGym();
  }
  
  selectPlan(plan: SubscriptionPlan) {
    this.selectedPlan = plan;
  }

  ngOnChanges() {
    this.updatePlansFromGym();
  }

  private updatePlansFromGym() {
    if (this.gym) {
      // Create plans based on gym pricing or use defaults
      this.plans = [
        {
          name: 'MONTHLY',
          displayName: 'Monthly',
          price: this.gym.monthlyPrice || 29.99,
          interval: 'month',
          priceInCents: Math.round((this.gym.monthlyPrice || 29.99) * 100)
        },
        {
          name: 'ANNUAL',
          displayName: 'Annual',
          price: this.gym.annualPrice || 299.99,
          interval: 'year',
          priceInCents: Math.round((this.gym.annualPrice || 299.99) * 100)
        }
      ];
      this.selectedPlan = this.plans[0]; // Default to monthly
    } else {
      // Fallback to default plans
      this.plans = this.subscriptionService.getSubscriptionPlans();
      this.selectedPlan = this.plans[0];
    }
  }
  
  onSubscribe() {
    if (!this.selectedPlan || !this.gym) return;
    
    // Show photo capture step first - MANDATORY for facial recognition
    if (!this.capturedPhoto) {
      this.showPhotoCapture = true;
      return;
    }
    
    this.isLoading = true;
    
    const request = {
      gymId: this.gym.id,
      plan: this.selectedPlan.name
    };
    
    this.subscriptionService.createCheckoutSession(request).subscribe({
      next: (response) => {
        // Store photo data for later registration
        this.storePhotoForRegistration();
        // Redirect to Stripe Checkout
        window.location.href = response.checkoutUrl;
      },
      error: (error) => {
        console.error('Error creating checkout session:', error);
        this.isLoading = false;
        // Show error message to user
        alert('Failed to create checkout session. Please try again.');
      }
    });
  }
  
  onClose() {
    this.close.emit();
  }

  async startCameraPreview(): Promise<void> {
    this.photoError = '';
    
    try {
      this.currentStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user', // Front camera
          frameRate: { ideal: 30, max: 60 }
        }
      });
      
      // Show camera preview first
      this.showCameraPreview = true;
      
      // Wait for the view to update, then set the video source
      setTimeout(() => {
        if (this.cameraVideo && this.cameraVideo.nativeElement) {
          this.cameraVideo.nativeElement.srcObject = this.currentStream;
          this.cameraVideo.nativeElement.play();
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera access error:', error);
      this.photoError = 'Camera access denied. Please allow camera permissions and try again.';
    }
  }

  async capturePhoto(): Promise<void> {
    this.isCapturingPhoto = true;
    this.photoError = '';

    try {
      // Use the existing camera stream to capture photo
      if (this.cameraVideo && this.cameraVideo.nativeElement && this.currentStream) {
        const video = this.cameraVideo.nativeElement;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (context) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw the current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to base64
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          const base64 = imageData.split(',')[1];
          
          this.capturedPhoto = `data:image/jpeg;base64,${base64}`;
          this.showPhotoCapture = false;
          this.showCameraPreview = false;
          this.stopCamera();
        } else {
          throw new Error('Could not get canvas context');
        }
      } else {
        // Fallback to the facial recognition service method
        const base64Image = await this.facialRecognitionService.captureFromCamera();
        this.capturedPhoto = `data:image/jpeg;base64,${base64Image}`;
        this.showPhotoCapture = false;
        this.showCameraPreview = false;
        this.stopCamera();
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      this.photoError = 'Failed to capture photo. Please try again.';
    } finally {
      this.isCapturingPhoto = false;
    }
  }

  stopCamera(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach(track => track.stop());
      this.currentStream = null;
    }
    this.showCameraPreview = false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.facialRecognitionService.fileToBase64(file).then(base64 => {
        this.capturedPhoto = `data:image/jpeg;base64,${base64}`;
        this.showPhotoCapture = false;
        this.photoError = '';
      }).catch(error => {
        this.photoError = 'Failed to process image. Please try again.';
      });
    }
  }


  retakePhoto(): void {
    this.capturedPhoto = null;
    this.showPhotoCapture = true;
    this.stopCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  storePhotoForRegistration(): void {
    // Store photo data in localStorage for later registration
    if (this.capturedPhoto) {
      const photoData = {
        image: this.capturedPhoto.split(',')[1], // Remove data URL prefix
        gymId: this.gym?.id,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pending_facial_registration', JSON.stringify(photoData));
    }
  }
}
