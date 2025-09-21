import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-coach-gym-view',
  templateUrl: './coach-gym-view.component.html',
  styleUrls: ['./coach-gym-view.component.scss']
})
export class CoachGymViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  gym: any;
  private api = 'http://localhost:8080/api/v1/coach/gym';
  map: any; marker: any;
  private destroyed = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadGym();
    this.loadGoogleMaps().then(() => setTimeout(() => this.renderMap())).catch(() => {});
  }

  ngAfterViewInit(): void {
    // Attempt rendering again once the view is initialized
    setTimeout(() => this.renderMap());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (!this.map) return;
    const center = this.marker?.getPosition ? this.marker.getPosition() : this.map.getCenter();
    google.maps.event.trigger(this.map, 'resize');
    if (center) this.map.setCenter(center);
  }

  private loadGym(): void {
    this.http.get<any>(this.api).subscribe({
      next: (g) => {
        this.gym = g;
        setTimeout(() => this.renderMap());
      },
      error: () => {}
    });
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) return resolve();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}`;
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });
  }

  private renderMap(): void {
    if (this.destroyed) return;
    if (!this.mapContainer || !('google' in window)) return;
    const center = (this.gym?.latitude && this.gym?.longitude) ? { lat: this.gym.latitude, lng: this.gym.longitude } : { lat: 34.0, lng: 9.0 };

    if (!this.map) {
      this.map = new google.maps.Map(this.mapContainer.nativeElement, { center, zoom: this.gym?.latitude ? 15 : 6 });
      this.marker = new google.maps.Marker({ position: center, map: this.map, draggable: false });
    } else {
      this.map.setCenter(center);
      this.map.setZoom(this.gym?.latitude ? 15 : 6);
      if (this.marker) this.marker.setPosition(center);
    }

    // Fix rendering when container size changes
    setTimeout(() => {
      try {
        google.maps.event.trigger(this.map, 'resize');
        this.map.setCenter(center);
      } catch {}
    });
  }

  photoUrl(url?: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  }
}


