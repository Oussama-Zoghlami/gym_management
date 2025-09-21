import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FacialRecognitionService, RecognitionResponse } from '../../services/facial-recognition.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-facial-recognition',
  templateUrl: './facial-recognition.component.html',
  styleUrls: ['./facial-recognition.component.scss']
})
export class FacialRecognitionComponent implements OnInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<video>;
  @ViewChild('canvasElement', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;

  isRecognizing = false;
  recognitionResult: RecognitionResponse | null = null;
  errorMessage = '';
  isCameraActive = false;
  stream: MediaStream | null = null;

  constructor(
    private facialRecognitionService: FacialRecognitionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.testConnection();
  }

  async testConnection(): Promise<void> {
    try {
      await this.facialRecognitionService.testConnection().toPromise();
      console.log('Flask service connection successful');
    } catch (error) {
      console.error('Flask service connection failed:', error);
      this.errorMessage = 'Cannot connect to facial recognition service. Please make sure the Flask service is running on port 5000.';
    }
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.isCameraActive = true;
        this.errorMessage = '';
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.errorMessage = 'Cannot access camera. Please check camera permissions.';
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isCameraActive = false;
  }

  async captureAndRecognize(): Promise<void> {
    if (!this.isCameraActive || !this.videoElement || !this.canvasElement) {
      this.errorMessage = 'Camera not active';
      return;
    }

    this.isRecognizing = true;
    this.errorMessage = '';
    this.recognitionResult = null;

    try {
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Cannot get canvas context');
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Image = imageData.split(',')[1];

      // Send to Flask service for recognition
      const result = await this.facialRecognitionService.recognizeFace({ image: base64Image }).toPromise();
      
      this.recognitionResult = result;
      
      if (result?.recognized) {
        console.log('Face recognized:', result.member);
        // You can redirect to dashboard or show success message
        // this.router.navigate(['/dashboard']);
      } else {
        console.log('Face not recognized');
      }

    } catch (error) {
      console.error('Recognition error:', error);
      this.errorMessage = 'Recognition failed. Please try again.';
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
      // Convert file to base64
      const base64Image = await this.facialRecognitionService.fileToBase64(file);

      // Send to Flask service for recognition
      const result = await this.facialRecognitionService.recognizeFace({ image: base64Image }).toPromise();
      
      this.recognitionResult = result;
      
      if (result?.recognized) {
        console.log('Face recognized:', result.member);
      } else {
        console.log('Face not recognized');
      }

    } catch (error) {
      console.error('Recognition error:', error);
      this.errorMessage = 'Recognition failed. Please try again.';
    } finally {
      this.isRecognizing = false;
    }
  }

  goToRegistration(): void {
    this.router.navigate(['/register']);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }
}
