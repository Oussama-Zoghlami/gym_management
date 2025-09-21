import { Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ActivatedRoute } from '@angular/router';

declare const google: any;

@Component({
  selector: 'app-admin-gym',
  templateUrl: './admin-gym.component.html',
  styleUrls: ['./admin-gym.component.scss']
})
export class AdminGymComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  gym: any = {};
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  map: any; marker: any; autocomplete: any;
  private api = 'http://localhost:8080/api/v1/admin/gym';
  private forceCreate = false;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const routePath = this.route.snapshot.routeConfig?.path || '';
    const fullUrl = this.route.snapshot.url.map(segment => segment.path).join('/');
    const isEditRoute = routePath === 'edit';
    const isCreateRoute = routePath === '' && !isEditRoute; // Empty path means /admin/gym (create)
    
    console.log('Route path:', routePath);
    console.log('Full URL:', fullUrl);
    console.log('Is create route:', isCreateRoute);
    console.log('Is edit route:', isEditRoute);

    // For /admin/gym route (empty path in children), always create new gym
    if (isCreateRoute) {
      this.forceCreate = true;
      // Reset gym to empty state for new creation
      this.gym = { name: '', address: '', latitude: null, longitude: null, description: '', phone: '', email: '', code: '', monthlyPrice: null, annualPrice: null };
      console.log('Force create mode - new gym:', this.gym);
      return; // Exit early, don't load any existing gym data
    }

    // Only honor create=true for non-edit route
    this.forceCreate = !isEditRoute && (this.route.snapshot.queryParamMap.get('create') === 'true');
    if (this.forceCreate) {
      // Reset gym to empty state for new creation
      this.gym = { name: '', address: '', latitude: null, longitude: null, description: '', phone: '', email: '', code: '', monthlyPrice: null, annualPrice: null };
      console.log('Force create mode via query param - new gym:', this.gym);
      return; // Exit early, don't load any existing gym data
    }

    // Try load by code if provided (only for edit routes)
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam && codeParam.length === 3) {
      this.http.get<any>(`${this.api}/code/${codeParam}`).subscribe({
        next: (g) => {
          if (!g) return;
          this.gym = g;
          if (this.map && g.latitude && g.longitude) {
            const p = { lat: g.latitude, lng: g.longitude };
            this.map.setCenter(p); this.map.setZoom(15); this.marker.setPosition(p);
          }
        },
        error: () => { this.loadGym(); }
      });
    } else {
      // Load gym data only for edit routes
      if (isEditRoute) {
        this.loadGym();
      }
    }
  }

  ngAfterViewInit(): void {
    this.loadGoogleMaps()
      .then(() => {
        this.initMap();
        this.initAutocomplete();
        if (!this.forceCreate && this.gym?.latitude && this.gym?.longitude) {
          const p = { lat: this.gym.latitude, lng: this.gym.longitude };
          this.map.setCenter(p); this.map.setZoom(15); this.marker.setPosition(p);
        }
      })
      .catch(() => {});
  }
  ngOnDestroy(): void {}

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) return resolve();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
      s.async = true; s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });
  }

  private initMap(): void {
    const center = { lat: 34.0, lng: 9.0 };
    this.map = new google.maps.Map(this.mapContainer.nativeElement, { center, zoom: 6 });
    this.marker = new google.maps.Marker({ position: center, map: this.map, draggable: true });
    this.marker.addListener('dragend', (e: any) => {
      this.gym.latitude = e.latLng.lat();
      this.gym.longitude = e.latLng.lng();
    });
    this.map.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      this.gym.latitude = lat; this.gym.longitude = lng;
      this.marker.setPosition({ lat, lng });
    });
  }

  private initAutocomplete(): void {
    const input = document.getElementById('addressInput') as HTMLInputElement;
    if (!input || !google?.maps?.places) return;
    this.autocomplete = new google.maps.places.Autocomplete(input);
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete.getPlace();
      if (!place.geometry) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      this.gym.address = place.formatted_address || this.gym.address;
      this.gym.latitude = lat; this.gym.longitude = lng;
      const pos = { lat, lng };
      this.map.setCenter(pos); this.map.setZoom(15); this.marker.setPosition(pos);
    });
  }

  private loadGym(): void {
    this.http.get<any>(this.api).subscribe({
      next: (g) => {
        if (!g) return;
        this.gym = g;
        if (this.map && g.latitude && g.longitude) {
          const p = { lat: g.latitude, lng: g.longitude };
          this.map.setCenter(p); this.map.setZoom(15); this.marker.setPosition(p);
        }
      },
      error: () => {}
    });
  }

  onFileSelected(ev: any): void {
    this.selectedFiles = Array.from(ev.target.files ?? []);
    this.imagePreviews = [];
    this.selectedFiles.forEach(f => {
      const r = new FileReader();
      r.onload = (e: any) => this.imagePreviews.push(e.target.result);
      r.readAsDataURL(f);
    });
  }

  save(): void {
    if ((!this.gym.latitude || !this.gym.longitude) && this.marker) {
      const pos = this.marker.getPosition?.();
      if (pos) { this.gym.latitude = pos.lat(); this.gym.longitude = pos.lng(); }
    }
    const body: any = { 
      name: this.gym.name, 
      address: this.gym.address, 
      latitude: this.gym.latitude, 
      longitude: this.gym.longitude, 
      description: this.gym.description, 
      phone: this.gym.phone, 
      email: this.gym.email,
      monthlyPrice: this.gym.monthlyPrice,
      annualPrice: this.gym.annualPrice
    };
    if (this.gym?.code && String(this.gym.code).length === 3) body.code = this.gym.code;

    // Always use POST when forceCreate is true (creating new gym)
    // Only use PUT for actual updates when not in create mode
    const req = this.forceCreate ? this.http.post<any>(this.api, body) : 
                 ((this.gym?.id != null) || (this.gym?.code && String(this.gym.code).length === 3)) ? 
                 this.http.put<any>(this.api, body) : this.http.post<any>(this.api, body);

    req.subscribe(g => {
      this.gym = g;
      if (this.selectedFiles.length && g?.id) this.uploadPhotos(g.id);
    });
  }

  private uploadPhotos(gymId: number): void {
    const form = new FormData();
    this.selectedFiles.forEach(f => form.append('files', f));
    this.http.post<string[]>(`${this.api}/${gymId}/photos`, form).subscribe(() => {
      this.selectedFiles = []; this.imagePreviews = [];
      this.loadGym();
    });
  }

  photoUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  }
}


