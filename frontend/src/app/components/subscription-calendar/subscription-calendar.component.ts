import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../../services/subscription.service';
import { Subscription } from 'rxjs';

export interface CalendarEvent {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string;
  gymName: string;
  plan: string;
  color: string;
}

@Component({
  selector: 'app-subscription-calendar',
  templateUrl: './subscription-calendar.component.html',
  styleUrls: ['./subscription-calendar.component.scss']
})
export class SubscriptionCalendarComponent implements OnInit {
  subscriptions: any[] = [];
  calendarEvents: CalendarEvent[] = [];
  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  isLoading = true;

  // Calendar display
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadSubscriptionHistory();
  }

  loadSubscriptionHistory(): void {
    this.subscriptionService.getSubscriptionHistory().subscribe({
      next: (subscriptions) => {
        this.subscriptions = subscriptions;
        this.processSubscriptionsToEvents();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading subscription history:', error);
        this.isLoading = false;
      }
    });
  }

  processSubscriptionsToEvents(): void {
    this.calendarEvents = this.subscriptions.map(sub => {
      const startDate = new Date(sub.startDate);
      const endDate = sub.endDate ? new Date(sub.endDate) : new Date(startDate.getTime() + (sub.plan === 'MONTHLY' ? 30 : 365) * 24 * 60 * 60 * 1000);
      
      let color = '#4CAF50'; // Green for active
      if (sub.status === 'CANCELED') {
        color = '#f44336'; // Red for canceled
      } else if (sub.status === 'EXPIRED') {
        color = '#ff9800'; // Orange for expired
      }

      return {
        id: sub.id,
        title: `${sub.gym?.name || 'Unknown Gym'} - ${sub.plan}`,
        startDate: startDate,
        endDate: endDate,
        status: sub.status,
        gymName: sub.gym?.name || 'Unknown Gym',
        plan: sub.plan,
        color: color
      };
    });
  }

  getDaysInMonth(): number[] {
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  Array = Array; // Make Array available in template

  getFirstDayOfMonth(): number {
    return new Date(this.currentYear, this.currentMonth, 1).getDay();
  }

  getEventsForDay(day: number): CalendarEvent[] {
    const date = new Date(this.currentYear, this.currentMonth, day);
    return this.calendarEvents.filter(event => {
      const eventStart = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
      const eventEnd = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate());
      const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      return currentDate >= eventStart && currentDate <= eventEnd;
    });
  }

  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() && 
           this.currentMonth === today.getMonth() && 
           this.currentYear === today.getFullYear();
  }

  isEventStart(day: number, event: CalendarEvent): boolean {
    const eventStart = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
    const currentDate = new Date(this.currentYear, this.currentMonth, day);
    return eventStart.getTime() === currentDate.getTime();
  }

  isEventEnd(day: number, event: CalendarEvent): boolean {
    const eventEnd = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate());
    const currentDate = new Date(this.currentYear, this.currentMonth, day);
    return eventEnd.getTime() === currentDate.getTime();
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  goToToday(): void {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
  }

  getMonthYearString(): string {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  getEventTooltip(event: CalendarEvent): string {
    const startDate = event.startDate.toLocaleDateString();
    const endDate = event.endDate.toLocaleDateString();
    return `${event.gymName} - ${event.plan}\n${event.status}\n${startDate} to ${endDate}`;
  }
}
