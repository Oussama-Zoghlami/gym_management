import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private apiUrl = 'http://localhost:8080/api/v1/coach';
  private adminApi = 'http://localhost:8080/api/v1/admin/gym';
  constructor(private http: HttpClient) {}

  getMyGym(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/gym`);
  }

  getMySchedule(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schedule`);
  }

  getCoachesByGymCode(code: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.adminApi}/code/${code}/coaches`);
  }
}


