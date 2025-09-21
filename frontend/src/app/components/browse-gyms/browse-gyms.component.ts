import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { RatingService } from '../../services/rating.service';
import { SubscriptionService } from '../../services/subscription.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
declare const google: any;

@Component({
  selector: 'app-browse-gyms',
  templateUrl: './browse-gyms.component.html',
  styleUrls: ['./browse-gyms.component.scss']
})
export class BrowseGymsComponent implements OnInit, AfterViewInit, OnDestroy {
  gyms: any[] = [];
  userRatings = new Map<number, number>();
  gymSubscriptions = new Map<number, boolean>();
  activeSubscription: any = null;
  private miniMaps = new Map<number, any>();
  private destroyed = false;
  private mapsReady = false;
  mapsLoading = false;
  
  // Subscription modal
  selectedGym: any = null;
  showSubscriptionModal = false;

  constructor(
    private authService: AuthService,
    private ratingService: RatingService,
    private subscriptionService: SubscriptionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGyms();
    this.loadActiveSubscription();
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
  }

  loadGyms(): void {
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
      console.log('Browse gyms - loadGoogleMaps called');
      if (typeof google !== 'undefined' && google.maps) {
        console.log('Browse gyms - Google Maps already loaded');
        return resolve();
      }
      
      // Check if script already exists
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('Browse gyms - Google Maps script already exists');
        resolve();
        return;
      }
      
      console.log('Browse gyms - Loading Google Maps script...');
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
      s.async = true; 
      s.defer = true;
      s.onload = () => {
        console.log('Browse gyms - Google Maps loaded successfully');
        resolve();
      };
      s.onerror = (error) => {
        console.error('Browse gyms - Failed to load Google Maps:', error);
        // Still resolve to prevent blocking the UI
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  private renderMiniMaps(): void {
    console.log('Browse gyms - renderMiniMaps called', { destroyed: this.destroyed, mapsReady: this.mapsReady, gymsCount: this.gyms.length });
    if (this.destroyed || !this.mapsReady) {
      console.log('Browse gyms - maps not ready or destroyed');
      return;
    }
    
    this.gyms.forEach(g => {
      const el = document.getElementById(`map-${g.id}`);
      console.log(`Browse gyms - looking for map element: map-${g.id}`, el);
      
      if (!el) {
        console.log(`Browse gyms - map element not found for gym ${g.id}`);
        return;
      }
      
      if (this.miniMaps.has(g.id)) {
        console.log(`Browse gyms - map already rendered for gym ${g.id}`);
        return;
      }
      
      console.log(`Browse gyms - creating map for gym ${g.id}`, { lat: g.latitude, lng: g.longitude });
      
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
        console.log(`Browse gyms - map created successfully for gym ${g.id}`);
      } catch (error) {
        console.error('Browse gyms - Error creating map:', error);
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
        console.log(`Browse gyms - fallback placeholder created for gym ${g.id}`);
      }
    });
  }

  photoUrl(url: string): string {
    return url?.startsWith('http') ? url : `http://localhost:8080${url}`;
  }

  loadActiveSubscription(): void {
    this.subscriptionService.getActiveSubscription().subscribe({
      next: (subscription) => {
        this.activeSubscription = subscription;
      },
      error: (error) => {
        console.error('Error loading active subscription:', error);
        this.activeSubscription = null;
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

  getSubscriptionStatus(gym: any): string {
    if (this.hasActiveSubscription(gym.id)) {
      return 'Subscribed';
    }
    return 'Available';
  }

  getSubscriptionStatusClass(gym: any): string {
    if (this.hasActiveSubscription(gym.id)) {
      return 'status-subscribed';
    }
    return 'status-available';
  }
}
