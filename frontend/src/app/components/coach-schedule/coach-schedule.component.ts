import { Component, OnInit } from '@angular/core';
import { CoachService } from '../../services/coach.service';

@Component({
  selector: 'app-coach-schedule',
  templateUrl: './coach-schedule.component.html',
  styleUrls: ['./coach-schedule.component.scss']
})
export class CoachScheduleComponent implements OnInit {
  schedules: Array<{ id: number; dayOfWeek: string; openTime: string; closeTime: string; note?: string }>=[];
  loading = true;

  constructor(private coachService: CoachService) {}

  ngOnInit(): void {
    this.coachService.getMySchedule().subscribe({
      next: (rows) => { this.schedules = rows || []; this.loading = false; },
      error: () => { this.schedules = []; this.loading = false; }
    });
  }
}


