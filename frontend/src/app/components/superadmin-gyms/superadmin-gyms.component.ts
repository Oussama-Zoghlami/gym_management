import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
declare const google: any;

@Component({
  selector: 'app-superadmin-gyms',
  templateUrl: './superadmin-gyms.component.html',
  styleUrls: ['./superadmin-gyms.component.scss']
})
export class SuperadminGymsComponent implements OnInit, AfterViewInit, OnDestroy {
  gyms: any[] = [];
  private miniMaps = new Map<number, any>();
  private destroyed = false;
  private mapsReady = false;
  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadGyms();
    this.loadGoogleMaps().then(() => {
      this.mapsReady = true;
      setTimeout(() => this.renderMiniMaps());
    }).catch(() => {});
  }
  ngAfterViewInit(): void { setTimeout(() => this.renderMiniMaps()); }
  ngOnDestroy(): void { this.destroyed = true; }

  loadGyms(): void {
    this.userService.getAllGyms().subscribe({
      next: g => { this.gyms = Array.isArray(g) ? g : []; setTimeout(() => this.renderMiniMaps()); },
      error: () => { this.gyms = []; }
    });
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) return resolve();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=`; // uses no key in superadmin view for now
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject();
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
        const m = new google.maps.Map(el, { center, zoom: g?.latitude ? 14 : 6, disableDefaultUI: true });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const mk = new google.maps.Marker({ position: center, map: m, draggable: false });
        this.miniMaps.set(g.id, m);
      } catch {}
    });
  }

  photoUrl(url: string): string { return url?.startsWith('http') ? url : `http://localhost:8080${url}`; }

  goBack(): void {
    this.router.navigate(['/superadmin']);
  }
}


