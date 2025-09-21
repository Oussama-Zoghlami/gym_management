import { Component } from '@angular/core';
import { CoachService } from '../../services/coach.service';
import { CoachDto } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  coachGymCode: string = '';
  coaches: CoachDto[] = [];

  constructor(private authService: AuthService, private coachService: CoachService) {}

  logout(): void {
    this.authService.logout();
  }

  // RouterLink is used directly in the template for navigation
  loadCoachesByCode(): void {
    const code = (this.coachGymCode || '').trim();
    if (!code) {
      this.coaches = [];
      return;
    }
    this.coachService.getCoachesByGymCode(code).subscribe({
      next: (list) => this.coaches = list || [],
      error: () => this.coaches = []
    });
  }
}
