import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GymRating {
  id?: number;
  gymId: number;
  rating: number; // 1 to 5
  comment?: string;
  createdAt?: Date;
}

export interface RatingRequest {
  gymId: number;
  rating: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class RatingService {
  private baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  // Rate a gym (members only)
  rateGym(request: RatingRequest): Observable<GymRating> {
    return this.http.post<GymRating>(`${this.baseUrl}/rating/gym`, request);
  }

  // Get average rating for a gym
  getAverageRating(gymId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/rating/gym/${gymId}/average`);
  }

  // Get rating count for a gym
  getRatingCount(gymId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/rating/gym/${gymId}/count`);
  }

  // Get member's own rating for a gym
  getMyRating(gymId: number): Observable<GymRating> {
    return this.http.get<GymRating>(`${this.baseUrl}/rating/gym/${gymId}/my-rating`);
  }

  // Get all gyms for members
  getAllGymsForMember(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/member/gyms`);
  }
}
