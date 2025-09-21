import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { User, SignupRequest, SigninRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      this.getUserInfo();
    }
  }

  signupMember(data: SignupRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/signup`, data);
  }

  signupAdmin(data: SignupRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/signupAdmin`, data);
  }

  signin(credentials: SigninRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('role', response.role);
          this.getUserInfo();
          this.navigateToDashboard(response.role);
        })
      );
  }

  signinFacial(facialCredentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin-facial`, facialCredentials)
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('role', response.role);
          this.getUserInfo();
          this.navigateToDashboard(response.role);
        })
      );
  }

  getUserInfo(): void {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode JWT token to get user info
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const user: User = {
        email: payload.sub,
        role: localStorage.getItem('role') || '',
        firstname: '',
        lastname: '',
        gymId: payload.gym_id || null,
        userId: payload.user_id || null
      };
      this.currentUserSubject.next(user);
      
      // Store gym_id in localStorage for easy access
      if (payload.gym_id) {
        localStorage.setItem('user_gym_id', payload.gym_id.toString());
      }
    }
  }

  navigateToDashboard(role: string): void {
    switch(role.toUpperCase()) {
      case 'SUPERADMIN':
        this.router.navigate(['/superadmin']);
        break;
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'MEMBER':
      case 'USER':
        // For members, we'll check if they have a subscription and redirect accordingly
        this.navigateMemberDashboard();
        break;
      case 'COACH':
        this.router.navigate(['/coach']);
        break;
      default:
        this.router.navigate(['/signin']);
    }
  }

  private navigateMemberDashboard(): void {
    // For now, just navigate to member dashboard
    // The subscription logic will be handled in the member dashboard component
    this.router.navigate(['/member']);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    this.currentUserSubject.next(null);
    this.router.navigate(['/signin']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;
      const now = new Date().getTime() / 1000;
      return now < expiry;
    } catch (e) {
      return false;
    }
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { token: refreshToken })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('refreshToken', response.refreshToken);
        })
      );
  }

  forgotPassword(email: string): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(resetData: { token: string; newPassword: string }): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/reset-password`, resetData);
  }

  getGymId(): number | null {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.gym_id) {
          return payload.gym_id;
        }
      } catch (error) {
        console.error('Error getting gym ID from token:', error);
      }
    }
    
    
    return null;
  }

  getMemberId(): string | null {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.member_id || payload.id) {
          return payload.member_id || payload.id;
        }
      } catch (error) {
        console.error('Error getting member ID from token:', error);
      }
    }
    
    
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
