import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OverallStatistics {
  totalGyms: number;
  totalUsers: number;
  totalCoaches: number;
  totalMembers: number;
  totalAdmins: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalWorkoutPlans: number;
  completedWorkouts: number;
  newUsersLast30Days: number;
  newGymsLast30Days: number;
}

export interface TopGymStats {
  gymId: number;
  gymName: string;
  gymCode: string;
  subscriptionCount: number;
  revenue: number;
  coachCount: number;
  workoutPlanCount: number;
  completedWorkouts: number;
  averageRating: number | null;
}

export interface GymStatistics {
  gymId: number;
  gymName: string;
  gymCode: string;
  activeSubscribers: number;
  totalCoaches: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  totalRevenue: number;
  totalWorkoutPlans: number;
  completedWorkouts: number;
  pendingWorkouts: number;
  averageRating: number | null;
  ratingCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) {}

  getOverallStatistics(): Observable<OverallStatistics> {
    return this.http.get<OverallStatistics>(`${this.apiUrl}/overall`);
  }

  getTopGymsBySubscriptions(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/subscriptions`);
  }

  getTopGymsByRevenue(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/revenue`);
  }

  getTopGymsByCoaches(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/coaches`);
  }

  getTopGymsByWorkoutPlans(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/workout-plans`);
  }

  getTopGymsByCompletedWorkouts(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/completed-workouts`);
  }

  getTopGymsByRating(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/rating`);
  }

  getGymStatistics(gymId: number): Observable<GymStatistics> {
    return this.http.get<GymStatistics>(`${this.apiUrl}/gym/${gymId}`);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
  }

  formatPercentage(num: number): string {
    return `${num.toFixed(1)}%`;
  }
}
