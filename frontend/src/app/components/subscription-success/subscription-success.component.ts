import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { FacialRecognitionService } from '../../services/facial-recognition.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-subscription-success',
  templateUrl: './subscription-success.component.html',
  styleUrls: ['./subscription-success.component.scss']
})
export class SubscriptionSuccessComponent implements OnInit {
  sessionId: string | null = null;
  isProcessing: boolean = true;
  isSuccess: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private facialRecognitionService: FacialRecognitionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (this.sessionId) {
      this.completePayment();
    } else {
      this.isProcessing = false;
      this.errorMessage = 'No session ID found';
    }
  }

  private completePayment(): void {
    if (!this.sessionId) return;

    this.subscriptionService.completePayment(this.sessionId).subscribe({
      next: (response) => {
        console.log('Payment completed successfully:', response);
        this.isProcessing = false;
        this.isSuccess = true;
        
        // Register member with facial recognition service
        this.registerMemberForFacialRecognition(response);
      },
      error: (error) => {
        console.error('Error completing payment:', error);
        this.isProcessing = false;
        this.errorMessage = error.error?.error || 'Failed to complete subscription';
      }
    });
  }

  private async registerMemberForFacialRecognition(paymentResponse: any): Promise<void> {
    try {
      // Get stored photo data
      const storedPhotoData = localStorage.getItem('pending_facial_registration');
      if (!storedPhotoData) {
        return;
      }

      const photoData = JSON.parse(storedPhotoData);
      
      // Get current user info from token
      const token = this.authService.getToken();
      if (!token) {
        return;
      }

      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userEmail = payload.sub;

      // Try to get user info from payment response first
      let userInfo = paymentResponse.user;
      
      // If not available in payment response, create basic user info
      if (!userInfo) {
        userInfo = {
          firstname: userEmail.split('@')[0], // Use email prefix as firstname
          lastname: 'User', // Default lastname
          email: userEmail
        };
      }

      // Prepare member data for facial recognition service
      const memberData = {
        firstname: userInfo.firstname || userEmail.split('@')[0],
        lastname: userInfo.lastname || 'User',
        email: userInfo.email || userEmail,
        gym_id: photoData.gymId || paymentResponse.gymId,
        image: photoData.image
      };


      // Register with facial recognition service
      const result = await this.facialRecognitionService.registerMember(memberData).toPromise();

      // Clear stored photo data
      localStorage.removeItem('pending_facial_registration');

    } catch (error) {
      console.error('Error registering member for facial recognition:', error);
      // Don't show error to user as subscription was successful
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/member']);
  }
}
