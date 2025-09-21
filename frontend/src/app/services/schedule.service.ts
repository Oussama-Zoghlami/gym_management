import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GymScheduleDto {
  id?: number;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  note?: string;
}

export interface GymScheduleItem {
  id?: number;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private baseUrl = 'http://localhost:8080/api/v1';

  constructor(private http: HttpClient) {}

  // Member endpoints
  getGymSchedule(gymId: number): Observable<GymScheduleDto[]> {
    return this.http.get<GymScheduleDto[]>(`${this.baseUrl}/member/gym/${gymId}/schedule`);
  }

  // Admin endpoints
  getMySchedule(): Observable<GymScheduleItem[]> {
    return this.http.get<GymScheduleItem[]>(`${this.baseUrl}/admin/gym/schedule`);
  }

  getSchedulesForGym(gymId: number): Observable<GymScheduleItem[]> {
    return this.http.get<GymScheduleItem[]>(`${this.baseUrl}/admin/gym/${gymId}/schedules`);
  }

  getSchedulesForGymCode(code: string): Observable<GymScheduleItem[]> {
    return this.http.get<GymScheduleItem[]>(`${this.baseUrl}/admin/gym/code/${code}/schedules`);
  }

  getMyGymId(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/admin/gym/my-gym-id`);
  }

  replaceSchedulesForGym(gymId: number, schedules: GymScheduleItem[]): Observable<GymScheduleItem[]> {
    return this.http.put<GymScheduleItem[]>(`${this.baseUrl}/admin/gym/${gymId}/schedules`, schedules);
  }

  addSchedulesForGymCode(code: string, schedules: GymScheduleItem[]): Observable<GymScheduleItem[]> {
    return this.http.post<GymScheduleItem[]>(`${this.baseUrl}/admin/gym/code/${code}/schedules`, schedules);
  }

  deleteScheduleForGymCode(code: string, scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/gym/code/${code}/schedules/${scheduleId}`);
  }

  deleteSchedule(gymId: number, scheduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/gym/${gymId}/schedules/${scheduleId}`);
  }
}