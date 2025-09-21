import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RatingService } from '../../services/rating.service';
import { SubscriptionService } from '../../services/subscription.service';
import { WebSocketService } from '../../services/websocket.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
declare const google: any;

@Component({
  selector: 'app-member-dashboard',
  templateUrl: './member-dashboard.component.html',
  styleUrls: ['./member-dashboard.component.scss']
})
export class MemberDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  gyms: any[] = [];
  userRatings = new Map<number, number>();
  gymSubscriptions = new Map<number, boolean>();
  activeSubscription: any = null;
  showBrowseButton = false;
  private miniMaps = new Map<number, any>();
  private destroyed = false;
  private mapsReady = false;
  
  // Subscription modal
  selectedGym: any = null;
  showSubscriptionModal = false;

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private ratingService: RatingService,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
    private router: Router
  ) {
    // Make component accessible from browser console for debugging
    if (typeof window !== 'undefined') {
      (window as any).memberDashboard = this;
    }
  }

  ngOnInit(): void {
    this.loadGyms();
    this.loadActiveSubscription();
    this.setupWebSocket();
    this.loadGoogleMaps().then(() => {
      this.mapsReady = true;
      setTimeout(() => this.renderMiniMaps());
    }).catch(() => {});
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderMiniMaps());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.subscriptions.unsubscribe();
  }

  loadGyms(): void {
    // Now that facial recognition uses real JWT tokens, we can use normal API calls
    this.ratingService.getAllGymsForMember().subscribe({
      next: (gyms) => {
        this.gyms = gyms || [];
        setTimeout(() => this.renderMiniMaps());
        // Load user's existing ratings
        this.loadUserRatings();
        // Load subscription status for each gym
        this.loadGymSubscriptions();
      },
      error: () => {
        this.gyms = [];
      }
    });
  }

  // Facial recognition now uses real JWT tokens, so we don't need special handling


  loadUserRatings(): void {
    this.gyms.forEach(gym => {
      this.ratingService.getMyRating(gym.id).subscribe({
        next: (rating) => {
          if (rating) {
            this.userRatings.set(gym.id, rating.rating);
          }
        },
        error: () => {} // User hasn't rated this gym yet
      });
    });
  }

  getUserRating(gymId: number): number {
    return this.userRatings.get(gymId) || 0;
  }

  onRateGym(gymId: number, rating: number): void {
    this.ratingService.rateGym({ gymId, rating }).subscribe({
      next: () => {
        this.userRatings.set(gymId, rating);
        // Refresh gym data to get updated average
        this.loadGyms();
      },
      error: (err) => {
        console.error('Error rating gym:', err);
      }
    });
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) return resolve();
      
      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        resolve();
        return;
      }
      
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
      s.async = true; 
      s.defer = true;
      s.onload = () => {
        console.log('Google Maps loaded successfully');
        resolve();
      };
      s.onerror = (error) => {
        console.error('Failed to load Google Maps:', error);
        // Still resolve to prevent blocking the UI
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  private renderMiniMaps(): void {
    if (this.destroyed || !this.mapsReady) return;
    this.gyms.forEach(g => {
      const el = document.getElementById(`map-${g.id}`);
      if (!el || this.miniMaps.has(g.id)) return;
      
      const center = (g.latitude && g.longitude) ? { lat: g.latitude, lng: g.longitude } : { lat: 34.0, lng: 9.0 };
      try {
        const m = new google.maps.Map(el, { 
          center, 
          zoom: g?.latitude ? 14 : 6, 
          disableDefaultUI: true,
          styles: [
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#ffffff" }]
            }
          ]
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const mk = new google.maps.Marker({ 
          position: center, 
          map: m, 
          draggable: false,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#e53e3e"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
          }
        });
        this.miniMaps.set(g.id, m);
      } catch (error) {
        console.error('Error creating map:', error);
        // Fallback to placeholder if map creation fails
        el.innerHTML = `
          <div style="
            width: 100%; 
            height: 100%; 
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6c757d;
            font-size: 14px;
            text-align: center;
            border-radius: 8px;
          ">
            <div>
              <div style="font-size: 24px; margin-bottom: 8px; color: #495057;">📍</div>
              <div style="font-weight: 500; margin-bottom: 4px; color: #495057;">Gym Location</div>
              <div style="font-size: 12px; color: #6c757d; font-family: monospace;">
                ${g.latitude && g.longitude ? `${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}` : 'Location not available'}
              </div>
            </div>
          </div>
        `;
        this.miniMaps.set(g.id, true);
      }
    });
  }

  photoUrl(url: string): string {
    return url?.startsWith('http') ? url : `http://localhost:8080${url}`;
  }

  loadActiveSubscription(): void {
    // Use normal API call for all users (facial recognition now uses real JWT tokens)
    this.subscriptionService.getActiveSubscription().subscribe({
      next: (subscription) => {
        this.activeSubscription = subscription;
        this.showBrowseButton = !!subscription;
        // If user has active subscription and just logged in, redirect to subscribed gym view
        // Only redirect if we're at the root member dashboard route
        if (subscription && this.router.url === '/member') {
          this.router.navigate(['/member/my-gym']);
        }
      },
      error: () => {
        this.activeSubscription = null;
        this.showBrowseButton = false;
      }
    });
  }



  loadGymSubscriptions(): void {
    this.gyms.forEach(gym => {
      this.subscriptionService.checkSubscription(gym.id).subscribe({
        next: (response) => {
          this.gymSubscriptions.set(gym.id, response.hasActiveSubscription);
        },
        error: () => {
          this.gymSubscriptions.set(gym.id, false);
        }
      });
    });
  }

  hasActiveSubscription(gymId: number): boolean {
    return this.gymSubscriptions.get(gymId) || false;
  }

  openSubscriptionModal(gym: any): void {
    this.selectedGym = gym;
    this.showSubscriptionModal = true;
  }

  closeSubscriptionModal(): void {
    this.showSubscriptionModal = false;
    this.selectedGym = null;
  }

  goToMyGym(): void {
    this.router.navigate(['/member/my-gym']);
  }


  viewSchedule(gymId: number): void {
    this.router.navigate(['/member/gym', gymId, 'schedule']);
  }

  logout(): void {
    this.authService.logout();
  }

  cancelSubscription(): void {
    if (!this.activeSubscription) return;
    
    const confirmed = confirm(
      `Are you sure you want to cancel your subscription to ${this.activeSubscription.gym?.name}?\n\n` +
      'This action cannot be undone. You will lose access to the gym immediately.'
    );
    
    if (!confirmed) return;
    
    this.subscriptionService.cancelSubscription(this.activeSubscription.id).subscribe({
      next: (response) => {
        console.log('Subscription cancelled:', response);
        // Clear the active subscription
        this.activeSubscription = null;
        this.showBrowseButton = false;
        
        // Refresh subscription status for all gyms
        this.loadGymSubscriptions();
        
        // Show success message
        alert('Your subscription has been cancelled successfully. You can now subscribe to any gym again.');
        
        // Optionally redirect to member dashboard to browse gyms
        this.router.navigate(['/member']);
      },
      error: (error) => {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription. Please try again or contact support.');
      }
    });
  }



  setupWebSocket(): void {
    // Connect to WebSocket (for other features if needed)
    this.webSocketService.connect();
  }







}
