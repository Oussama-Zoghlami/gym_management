import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CoachService } from '../../services/coach.service';
import { MessageService } from '../../services/message.service';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.scss']
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
  gym: any | null = null;
  showMessaging: boolean = false;
  unreadCount: number = 0;
  private unreadCountSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService, 
    private coachService: CoachService, 
    private messageService: MessageService,
    private router: Router
  ) {}

  logout(): void {
    this.authService.logout();
  }

  ngOnInit(): void {
    this.coachService.getMyGym().subscribe({
      next: (g) => this.gym = g,
      error: () => this.gym = null
    });
    
    // Load initial unread count
    this.loadUnreadCount();
    
    // Set up periodic checking for new messages every 30 seconds
    this.unreadCountSubscription = interval(30000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  ngOnDestroy(): void {
    if (this.unreadCountSubscription) {
      this.unreadCountSubscription.unsubscribe();
    }
  }

  go(path: string): void {
    this.router.navigateByUrl(path);
  }

  toggleMessaging(): void {
    this.showMessaging = !this.showMessaging;
    // Refresh unread count when closing messaging
    if (!this.showMessaging) {
      this.loadUnreadCount();
    }
  }

  private loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

}
