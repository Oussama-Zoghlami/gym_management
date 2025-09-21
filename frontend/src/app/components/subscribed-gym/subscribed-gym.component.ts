import { Component, OnInit, OnDestroy } from '@angular/core';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { WebSocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-subscribed-gym',
  templateUrl: './subscribed-gym.component.html',
  styleUrls: ['./subscribed-gym.component.scss']
})
export class SubscribedGymComponent implements OnInit, OnDestroy {
  subscription: any = null;
  isLoading = true;
  showMessaging: boolean = false;
  showWorkoutPlans: boolean = false;
  showSubscriptionCalendar: boolean = false;
  unreadCount: number = 0;
  private unreadCountSubscription: Subscription | null = null;


  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private messageService: MessageService,
    private webSocketService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
    this.loadUnreadCount();
    this.setupWebSocket();
    
    // Set up periodic checking for new messages every 30 seconds
    this.unreadCountSubscription = interval(30000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  ngOnDestroy(): void {
    if (this.unreadCountSubscription) {
      this.unreadCountSubscription.unsubscribe();
    }
  }

  loadSubscription(): void {
    // Use normal API call for all users (facial recognition now uses real JWT tokens)
    this.subscriptionService.getActiveSubscription().subscribe({
      next: (subscription) => {
        this.subscription = subscription;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading subscription:', error);
        this.isLoading = false;
        // If no subscription, redirect to browse gyms
        this.router.navigate(['/member']);
      }
    });
  }


  browseOtherGyms(): void {
    this.router.navigate(['/member/browse-gyms']);
  }

  viewSchedule(): void {
    if (this.subscription?.gym?.id) {
      this.router.navigate(['/member/gym', this.subscription.gym.id, 'schedule']);
    }
  }

  photoUrl(url: string): string {
    return url?.startsWith('http') ? url : `http://localhost:8080${url}`;
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMessaging(): void {
    this.showMessaging = !this.showMessaging;
    this.showWorkoutPlans = false; // Close workout plans when opening messaging
    this.showSubscriptionCalendar = false; // Close calendar when opening messaging
    // Refresh unread count when closing messaging
    if (!this.showMessaging) {
      this.loadUnreadCount();
    }
  }

  toggleWorkoutPlans(): void {
    this.showWorkoutPlans = !this.showWorkoutPlans;
    this.showMessaging = false; // Close messaging when opening workout plans
    this.showSubscriptionCalendar = false; // Close calendar when opening workout plans
  }

  toggleSubscriptionCalendar(): void {
    this.showSubscriptionCalendar = !this.showSubscriptionCalendar;
    this.showMessaging = false; // Close messaging when opening calendar
    this.showWorkoutPlans = false; // Close workout plans when opening calendar
  }

  private loadUnreadCount(): void {
    // Use normal API call for all users (facial recognition now uses real JWT tokens)
    this.messageService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  cancelSubscription(): void {
    if (!this.subscription) return;
    
    const confirmed = confirm(
      `Are you sure you want to cancel your subscription to ${this.subscription.gym?.name}?\n\n` +
      'This action cannot be undone. You will lose access to the gym immediately and will be redirected to browse other gyms.'
    );
    
    if (!confirmed) return;
    
    this.subscriptionService.cancelSubscription(this.subscription.id).subscribe({
      next: (response) => {
        console.log('Subscription cancelled:', response);
        
        // Show success message
        alert('Your subscription has been cancelled successfully. You can now subscribe to any gym again.');
        
        // Redirect to member dashboard to browse gyms
        this.router.navigate(['/member']);
      },
      error: (error) => {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription. Please try again or contact support.');
      }
    });
  }


  setupWebSocket(): void {
    console.log('🔌 Setting up WebSocket for subscribed gym...');
    
    // Connect to WebSocket
    this.webSocketService.connect();
    
  }


  getTimeAgo(date: Date): string {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }
}
