import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkoutPlanService {
  private apiUrl = 'http://localhost:8080/api/v1/workout-plans';

  constructor(private http: HttpClient) { }

  // Coach endpoints
  createWorkoutPlan(workoutPlan: WorkoutPlanRequest): Observable<WorkoutPlanResponse> {
    return this.http.post<WorkoutPlanResponse>(`${this.apiUrl}`, workoutPlan);
  }

  getMyWorkoutPlans(): Observable<WorkoutPlanResponse[]> {
    return this.http.get<WorkoutPlanResponse[]>(`${this.apiUrl}/my-plans`);
  }

  getMyAssignments(): Observable<WorkoutAssignmentResponse[]> {
    return this.http.get<WorkoutAssignmentResponse[]>(`${this.apiUrl}/assignments`);
  }

  assignWorkoutPlan(workoutPlanId: number, memberId: number, notes?: string): Observable<WorkoutAssignmentResponse> {
    const params: any = { memberId };
    if (notes) {
      params.notes = notes;
    }
    return this.http.post<WorkoutAssignmentResponse>(`${this.apiUrl}/${workoutPlanId}/assign`, null, { params });
  }

  updateAssignmentStatus(assignmentId: number, status: string, notes?: string): Observable<WorkoutAssignmentResponse> {
    const params: any = { status };
    if (notes) {
      params.notes = notes;
    }
    return this.http.put<WorkoutAssignmentResponse>(`${this.apiUrl}/assignments/${assignmentId}/status`, null, { params });
  }

  getSubscribedMembers(): Observable<SubscribedMember[]> {
    return this.http.get<SubscribedMember[]>(`${this.apiUrl}/subscribed-members`);
  }

  // Member endpoints
  getMyWorkoutAssignments(): Observable<WorkoutAssignmentResponse[]> {
    return this.http.get<WorkoutAssignmentResponse[]>(`${this.apiUrl}/my-assignments`);
  }

  completeWorkout(assignmentId: number): Observable<WorkoutAssignmentResponse> {
    return this.http.put<WorkoutAssignmentResponse>(`${this.apiUrl}/assignments/${assignmentId}/complete`, null);
  }

  // General endpoints
  getWorkoutPlan(id: number): Observable<WorkoutPlanResponse> {
    return this.http.get<WorkoutPlanResponse>(`${this.apiUrl}/${id}`);
  }

  updateWorkoutPlan(id: number, workoutPlan: WorkoutPlanRequest): Observable<WorkoutPlanResponse> {
    return this.http.put<WorkoutPlanResponse>(`${this.apiUrl}/${id}`, workoutPlan);
  }

  deleteWorkoutPlan(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

export interface WorkoutPlanRequest {
  title: string;
  description: string;
  exercises: ExerciseDto[];
  duration: number;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  memberId?: number;
}

export interface ExerciseDto {
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration: number;
  restTime: string;
  instructions: string;
}

export interface WorkoutPlanResponse {
  id: number;
  title: string;
  description: string;
  exercises: ExerciseDto[];
  duration: number;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  coachName: string;
  gymName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutAssignmentResponse {
  id: number;
  workoutPlan: WorkoutPlanResponse;
  memberName: string;
  memberEmail: string;
  coachName: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  assignedAt: string;
  completedAt?: string;
}

export interface SubscribedMember {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
}
