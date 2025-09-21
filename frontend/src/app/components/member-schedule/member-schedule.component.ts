import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ScheduleService, GymScheduleDto } from '../../services/schedule.service';
import { RatingService } from '../../services/rating.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-member-schedule',
  templateUrl: './member-schedule.component.html',
  styleUrls: ['./member-schedule.component.scss']
})
export class MemberScheduleComponent implements OnInit {
  gymId: number | null = null;
  gym: any = null;
  schedules: GymScheduleDto[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private scheduleService: ScheduleService,
    private ratingService: RatingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.gymId = +params['gymId'];
      if (this.gymId) {
        this.loadGymSchedule();
        this.loadGymDetails();
      }
    });
  }

  loadGymDetails(): void {
    this.ratingService.getAllGymsForMember().subscribe({
      next: (gyms) => {
        this.gym = gyms.find(g => g.id === this.gymId);
      },
      error: (error) => {
        console.error('Error loading gym details:', error);
      }
    });
  }

  loadGymSchedule(): void {
    if (!this.gymId) return;

    this.scheduleService.getGymSchedule(this.gymId).subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading gym schedule:', error);
        this.error = 'Failed to load gym schedule';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/member/my-gym']);
  }

  logout(): void {
    this.authService.logout();
  }

  getDayName(dayOfWeek: string): string {
    const days = {
      'MONDAY': 'Monday',
      'TUESDAY': 'Tuesday', 
      'WEDNESDAY': 'Wednesday',
      'THURSDAY': 'Thursday',
      'FRIDAY': 'Friday',
      'SATURDAY': 'Saturday',
      'SUNDAY': 'Sunday'
    };
    return days[dayOfWeek as keyof typeof days] || dayOfWeek;
  }

  formatTime(time: string): string {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getScheduleByDay(dayOfWeek: string): GymScheduleDto[] {
    return this.schedules.filter(schedule => schedule.dayOfWeek === dayOfWeek);
  }

  getDaysOfWeek(): string[] {
    return ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  }
}
