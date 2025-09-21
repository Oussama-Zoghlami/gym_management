import { Component, OnInit } from '@angular/core';
import { WorkoutPlanService, WorkoutAssignmentResponse } from '../../services/workout-plan.service';

@Component({
  selector: 'app-member-workout-plans',
  templateUrl: './member-workout-plans.component.html',
  styleUrls: ['./member-workout-plans.component.scss']
})
export class MemberWorkoutPlansComponent implements OnInit {
  workoutAssignments: WorkoutAssignmentResponse[] = [];
  isLoading = false;
  error: string | null = null;
  selectedWorkout: WorkoutAssignmentResponse | null = null;
  showWorkoutDetails = false;

  constructor(private workoutPlanService: WorkoutPlanService) { }

  ngOnInit(): void {
    this.loadWorkoutAssignments();
  }

  loadWorkoutAssignments(): void {
    this.isLoading = true;
    this.error = null;

    this.workoutPlanService.getMyWorkoutAssignments().subscribe({
      next: (assignments) => {
        this.workoutAssignments = assignments;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load workout plans';
        this.isLoading = false;
        console.error('Error loading workout assignments:', err);
      }
    });
  }

  viewWorkoutDetails(assignment: WorkoutAssignmentResponse): void {
    this.selectedWorkout = assignment;
    this.showWorkoutDetails = true;
  }

  closeWorkoutDetails(): void {
    this.showWorkoutDetails = false;
    this.selectedWorkout = null;
  }

  completeWorkout(assignmentId: number): void {
    this.workoutPlanService.completeWorkout(assignmentId).subscribe({
      next: () => {
        this.loadWorkoutAssignments();
        this.closeWorkoutDetails();
      },
      error: (err) => {
        this.error = 'Failed to mark workout as completed';
        console.error('Error completing workout:', err);
      }
    });
  }

  getDifficultyBadgeClass(difficulty: string): string {
    switch (difficulty) {
      case 'BEGINNER': return 'badge-beginner';
      case 'INTERMEDIATE': return 'badge-intermediate';
      case 'ADVANCED': return 'badge-advanced';
      case 'EXPERT': return 'badge-expert';
      default: return 'badge-beginner';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'ASSIGNED': return 'badge-assigned';
      case 'IN_PROGRESS': return 'badge-progress';
      case 'COMPLETED': return 'badge-completed';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-assigned';
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }

  getTotalExercises(assignment: WorkoutAssignmentResponse): number {
    return assignment.workoutPlan.exercises.length;
  }

  getTotalSets(assignment: WorkoutAssignmentResponse): number {
    return assignment.workoutPlan.exercises.reduce((total, exercise) => total + exercise.sets, 0);
  }

  getTotalReps(assignment: WorkoutAssignmentResponse): number {
    return assignment.workoutPlan.exercises.reduce((total, exercise) => total + (exercise.sets * exercise.reps), 0);
  }
}
