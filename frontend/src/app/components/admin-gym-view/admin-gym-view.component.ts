import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GymService } from '../../services/gym.service';
import { environment } from '../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-admin-gym-view',
  templateUrl: './admin-gym-view.component.html',
  styleUrls: ['./admin-gym-view.component.scss']
})
export class AdminGymViewComponent implements OnInit, AfterViewInit, OnDestroy {
  gyms: any[] = [];
  private api = 'http://localhost:8080/api/v1/admin/gym';
  private destroyed = false;
  private mapsReady = false;
  private miniMaps = new Map<number, any>();
  isDeleting = false;

  constructor(private http: HttpClient, private gymService: GymService) {}

  ngOnInit(): void {
    this.loadAllGyms();
    this.loadGoogleMaps().then(() => {
      this.mapsReady = true;
      setTimeout(() => {
        this.renderMiniMaps();
      });
    }).catch(() => {});
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.renderMiniMaps());
  }

  ngOnDestroy(): void { this.destroyed = true; }



  private loadAllGyms(): void {
    this.http.get<any[]>(`${this.api}/all`).subscribe({
      next: (list) => { this.gyms = list || []; setTimeout(() => this.renderMiniMaps()); },
      error: () => { this.gyms = []; }
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


  photoUrl(url?: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:8080${url}`;
  }

  deleteGym(gymId: number, gymName: string): void {
    if (!confirm(`Are you sure you want to delete "${gymName}"? This action cannot be undone.`)) {
      return;
    }

    this.isDeleting = true;
    this.gymService.deleteGym(gymId).subscribe({
      next: () => {
        // Remove the gym from the local array
        this.gyms = this.gyms.filter(g => g.id !== gymId);
        this.isDeleting = false;
        // Show success message (optional)
        alert('Gym deleted successfully!');
      },
      error: (err) => {
        this.isDeleting = false;
        console.error('Error deleting gym:', err);
        alert('Error deleting gym. Please try again.');
      }
    });
  }

  private renderMiniMaps(): void {
    if (!this.mapsReady || !Array.isArray(this.gyms)) return;
    this.gyms.forEach(g => {
      const el = document.getElementById(`map-${g.id}`);
      if (!el) return;
      if (this.miniMaps.has(g.id)) return;
      const center = (g.latitude && g.longitude) ? { lat: g.latitude, lng: g.longitude } : { lat: 34.0, lng: 9.0 };
      try {
        const m = new google.maps.Map(el, { center, zoom: g?.latitude ? 14 : 6, disableDefaultUI: true });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const mk = new google.maps.Marker({ position: center, map: m, draggable: false });
        this.miniMaps.set(g.id, m);
      } catch {}
    });
  }
}


