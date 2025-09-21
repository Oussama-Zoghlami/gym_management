import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { WorkoutPlanService, WorkoutPlanRequest, WorkoutPlanResponse, WorkoutAssignmentResponse, SubscribedMember } from '../../services/workout-plan.service';

@Component({
  selector: 'app-coach-workout-plans',
  templateUrl: './coach-workout-plans.component.html',
  styleUrls: ['./coach-workout-plans.component.scss']
})
export class CoachWorkoutPlansComponent implements OnInit {
  workoutPlans: WorkoutPlanResponse[] = [];
  assignments: WorkoutAssignmentResponse[] = [];
  subscribedMembers: SubscribedMember[] = [];
  isLoading = false;
  showCreateForm = false;
  showAssignForm = false;
  selectedWorkoutPlan: WorkoutPlanResponse | null = null;
  error: string | null = null;

  workoutPlanForm: FormGroup;
  assignForm: FormGroup;

  difficultyLevels = [
    { value: 'BEGINNER', label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED', label: 'Advanced' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  constructor(
    private workoutPlanService: WorkoutPlanService,
    private fb: FormBuilder
  ) {
    this.workoutPlanForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1)]],
      difficultyLevel: ['BEGINNER', Validators.required],
      exercises: this.fb.array([])
    });

    this.assignForm = this.fb.group({
      workoutPlanId: ['', Validators.required],
      memberId: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.error = null;

    // Load workout plans and assignments in parallel
    Promise.all([
      this.workoutPlanService.getMyWorkoutPlans().toPromise(),
      this.workoutPlanService.getMyAssignments().toPromise(),
      this.workoutPlanService.getSubscribedMembers().toPromise()
    ]).then(([plans, assignments, members]) => {
      this.workoutPlans = plans || [];
      this.assignments = assignments || [];
      this.subscribedMembers = members || [];
      this.isLoading = false;
    }).catch(err => {
      this.error = 'Failed to load data';
      this.isLoading = false;
      console.error('Error loading data:', err);
    });
  }

  get exercises(): FormArray {
    return this.workoutPlanForm.get('exercises') as FormArray;
  }

  addExercise(): void {
    const exerciseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      sets: ['', [Validators.required, Validators.min(1)]],
      reps: ['', [Validators.required, Validators.min(1)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      restTime: ['', Validators.required],
      instructions: ['']
    });
    this.exercises.push(exerciseForm);
  }

  removeExercise(index: number): void {
    this.exercises.removeAt(index);
  }

  createWorkoutPlan(): void {
    if (this.workoutPlanForm.valid) {
      const formValue = this.workoutPlanForm.value;
      const request: WorkoutPlanRequest = {
        title: formValue.title,
        description: formValue.description,
        duration: formValue.duration,
        difficultyLevel: formValue.difficultyLevel,
        exercises: formValue.exercises
      };

      this.workoutPlanService.createWorkoutPlan(request).subscribe({
        next: () => {
          this.showCreateForm = false;
          this.workoutPlanForm.reset();
          this.exercises.clear();
          this.loadData();
        },
        error: (err) => {
          this.error = 'Failed to create workout plan';
          console.error('Error creating workout plan:', err);
        }
      });
    }
  }

  assignWorkoutPlan(): void {
    if (this.assignForm.valid) {
      const formValue = this.assignForm.value;
      this.workoutPlanService.assignWorkoutPlan(
        formValue.workoutPlanId,
        formValue.memberId,
        formValue.notes
      ).subscribe({
        next: () => {
          this.showAssignForm = false;
          this.assignForm.reset();
          this.loadData();
        },
        error: (err) => {
          this.error = 'Failed to assign workout plan';
          console.error('Error assigning workout plan:', err);
        }
      });
    }
  }

  updateAssignmentStatus(assignmentId: number, status: string): void {
    this.workoutPlanService.updateAssignmentStatus(assignmentId, status).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => {
        this.error = 'Failed to update assignment status';
        console.error('Error updating assignment status:', err);
      }
    });
  }

  deleteWorkoutPlan(id: number): void {
    if (confirm('Are you sure you want to delete this workout plan?')) {
      this.workoutPlanService.deleteWorkoutPlan(id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          this.error = 'Failed to delete workout plan';
          console.error('Error deleting workout plan:', err);
        }
      });
    }
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.addExercise(); // Add at least one exercise
  }

  openAssignForm(workoutPlan?: WorkoutPlanResponse): void {
    this.showAssignForm = true;
    if (workoutPlan) {
      this.assignForm.patchValue({ workoutPlanId: workoutPlan.id });
    }
  }

  closeForms(): void {
    this.showCreateForm = false;
    this.showAssignForm = false;
    this.workoutPlanForm.reset();
    this.assignForm.reset();
    this.exercises.clear();
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
}
