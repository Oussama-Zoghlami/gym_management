import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GymService {
  private baseUrl = 'http://localhost:8080/api/v1/admin/gym';

  constructor(private http: HttpClient) {}

  // Get all gyms for current admin
  getAllMyGyms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/all`);
  }

  // Delete a gym by ID
  deleteGym(gymId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${gymId}`);
  }

  // Get gym by ID
  getGymById(gymId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${gymId}`);
  }

  // Create gym
  createGym(gymData: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, gymData);
  }

  // Update gym
  updateGym(gymData: any): Observable<any> {
    return this.http.put<any>(this.baseUrl, gymData);
  }
}
