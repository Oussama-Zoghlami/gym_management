import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, PendingUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) { }

  // SuperAdmin endpoints
  getPendingUsers(): Observable<PendingUser[]> {
    return this.http.get<PendingUser[]>(`${this.apiUrl}/superAdmin/pending-users`);
  }

  approveUser(userId: number, role?: string): Observable<any> {
    const url = role
      ? `${this.apiUrl}/superAdmin/${userId}/approve?role=${role}`
      : `${this.apiUrl}/superAdmin/${userId}/approve`;
    return this.http.post(url, {});
  }

  getAllGyms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/superAdmin/gyms`);
  }

  rejectUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/superAdmin/${userId}/reject`, {});
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/superAdmin/users`);
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/superAdmin/users/${userId}`);
  }

  // Get user by ID
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${userId}`);
  }

  // Update user profile
  updateUserProfile(userId: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}`, userData);
  }

  // Email verification
  verifyEmail(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/verify-email?token=${token}`);
  }

  // Resend verification email
  resendVerificationEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/resend-verification`, { email });
  }

  // Admin endpoints
  getSubscribedMembers(): Observable<SubscribedMember[]> {
    return this.http.get<SubscribedMember[]>(`${this.apiUrl}/admin/gym/subscribed-members`);
  }

  // Coach endpoints
  getGymMembers(): Observable<SubscribedMember[]> {
    return this.http.get<SubscribedMember[]>(`${this.apiUrl}/coach/gym-members`);
  }
}

export interface SubscribedMember {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  gymName: string;
  gymCode: string;
  subscriptionDate: string;
}
