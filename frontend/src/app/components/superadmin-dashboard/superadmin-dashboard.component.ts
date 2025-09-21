import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { PendingUser } from '../../models/user.model';
import { Subscription, interval } from 'rxjs';

interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-superadmin-dashboard',
  templateUrl: './superadmin-dashboard.component.html',
  styleUrls: ['./superadmin-dashboard.component.scss']
})
export class SuperadminDashboardComponent implements OnInit, OnDestroy {
  pendingUsers: PendingUser[] = [];
  approvedUsersToday: PendingUser[] = [];
  notifications: Notification[] = [];
  unreadCount = 0;
  showNotifications = false;
  isLoading = true;
  selectedUser: PendingUser | null = null;
  showUserDetails = false;
  activeList: 'pending_all' | 'pending_admins' | 'pending_members' | 'approved_today' = 'pending_all';
  stats = {
    totalPending: 0,
    pendingAdmins: 0,
    pendingMembers: 0,
    approvedToday: 0
  };
  
  private subscriptions = new Subscription();
  private pollInterval = 30000; // Poll every 30 seconds

  gyms: any[] = [];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPendingUsers();
    this.loadGyms();
    this.subscribeToNotifications();
    this.setupPolling();
    this.loadStats();
    this.loadApprovedTodayList();
  }
  loadGyms(): void {
    this.userService.getAllGyms().subscribe({
      next: (gyms) => {
        this.gyms = Array.isArray(gyms) ? gyms : [];
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadPendingUsers(): void {
    this.isLoading = true;
    this.userService.getPendingUsers().subscribe({
      next: (users) => {
        // Map defensively and avoid throwing UI errors
        this.pendingUsers = Array.isArray(users) ? users : [];
        this.updateStats();
        this.isLoading = false;
        // Check for new users and add notifications
        this.checkForNewUsers(this.pendingUsers);
      },
      error: (error) => {
        console.error('Error loading pending users:', error);
        this.isLoading = false;
        // Show error only for real HTTP failures (only for SuperAdmin)
        this.addNotification('error', 'Failed to load pending users');
      }
    });
  }

  setActiveList(type: 'pending_all' | 'pending_admins' | 'pending_members' | 'approved_today'): void {
    this.activeList = type;
    if (type === 'approved_today') {
      this.loadApprovedTodayList();
    }
  }

  get filteredPendingUsers(): PendingUser[] {
    if (this.activeList === 'pending_admins') {
      return this.pendingUsers.filter(u => !!u.cin);
    }
    if (this.activeList === 'pending_members') {
      return this.pendingUsers.filter(u => !u.cin);
    }
    return this.pendingUsers;
  }

  private approvedStorageKey(): string {
    const today = new Date().toDateString();
    return `approved_users_${today}`;
  }

  loadApprovedTodayList(): void {
    try {
      const raw = localStorage.getItem(this.approvedStorageKey());
      this.approvedUsersToday = raw ? JSON.parse(raw) : [];
    } catch {
      this.approvedUsersToday = [];
    }
  }

  subscribeToNotifications(): void {
    // Initialize with empty notifications
    this.notifications = [];
    this.unreadCount = 0;
  }

  private addNotification(type: string, message: string): void {
    const notification: Notification = {
      id: Date.now(),
      type: type,
      message: message,
      timestamp: new Date(),
      read: false
    };
    this.notifications.unshift(notification);
    this.unreadCount++;
  }

  private notifyNewUserRegistration(userName: string): void {
    this.addNotification('info', `New user registration: ${userName}`);
  }

  private notifyUserApproval(userName: string): void {
    this.addNotification('success', `User approved: ${userName}`);
  }

  private notifyUserRejection(userName: string): void {
    this.addNotification('warning', `User rejected: ${userName}`);
  }

  private markAllAsRead(): void {
    this.notifications.forEach(notification => notification.read = true);
    this.unreadCount = 0;
  }


  setupPolling(): void {
    // Poll for new pending users
    const pollSub = interval(this.pollInterval).subscribe(() => {
      this.loadPendingUsers();
    });
    
    this.subscriptions.add(pollSub);
  }

  checkForNewUsers(users: PendingUser[]): void {
    const lastCheckKey = 'lastUserCheck';
    const lastCheck = localStorage.getItem(lastCheckKey);
    const currentTime = new Date().toISOString();
    const lastCheckDate = lastCheck ? new Date(lastCheck) : null;
    
    if (lastCheckDate && !isNaN(lastCheckDate.getTime())) {
      const newUsers = users.filter(user => {
        if (!user || !user.registrationDate) return false;
        const reg = new Date(user.registrationDate as any);
        return !isNaN(reg.getTime()) && reg > lastCheckDate;
      });
      
      newUsers.forEach(user => {
        const userType = user.cin ? 'Admin' : 'Member';
        this.notifyNewUserRegistration(`${user.firstname} ${user.lastname}`);
      });
    }
    
    localStorage.setItem(lastCheckKey, currentTime);
  }

  updateStats(): void {
    this.stats.totalPending = this.pendingUsers.length;
    this.stats.pendingAdmins = this.pendingUsers.filter(u => u.cin).length;
    this.stats.pendingMembers = this.pendingUsers.filter(u => !u.cin).length;
  }

  loadStats(): void {
    // Load today's approved count from localStorage or API
    const today = new Date().toDateString();
    const approvedKey = `approved_${today}`;
    this.stats.approvedToday = parseInt(localStorage.getItem(approvedKey) || '0');
  }

  viewUserDetails(user: PendingUser): void {
    this.selectedUser = user;
    this.showUserDetails = true;
  }

  closeUserDetails(): void {
    this.showUserDetails = false;
    this.selectedUser = null;
  }

  approveUser(user: PendingUser): void {
    if (confirm(`Approve ${user.firstname} ${user.lastname}?`)) {
      this.userService.approveUser(user.id).subscribe({
        next: () => {
          // Remove user from pending list
          this.pendingUsers = this.pendingUsers.filter(u => u.id !== user.id);
          
          // Update stats
          this.updateStats();
          const today = new Date().toDateString();
          const approvedKey = `approved_${today}`;
          const currentCount = parseInt(localStorage.getItem(approvedKey) || '0');
          localStorage.setItem(approvedKey, (currentCount + 1).toString());
          this.stats.approvedToday = currentCount + 1;

          // Persist approved user list for today
          const listKey = this.approvedStorageKey();
          const raw = localStorage.getItem(listKey);
          const list: PendingUser[] = raw ? JSON.parse(raw) : [];
          const entry: PendingUser = {
            id: user.id!,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            cin: user.cin,
            role: user.cin ? 'Admin' : 'Member',
            registrationDate: user.registrationDate as any
          };
          list.unshift(entry);
          localStorage.setItem(listKey, JSON.stringify(list));
          if (this.activeList === 'approved_today') {
            this.approvedUsersToday = list;
          }
          
          // Add success notification (only for SuperAdmin)
          this.notifyUserApproval(`${user.firstname} ${user.lastname}`);
          
          this.closeUserDetails();
        },
        error: (error) => {
          this.addNotification('error', `Failed to approve user: ${error.error?.message || 'Unknown error'}`);
        }
      });
    }
  }

  rejectUser(user: PendingUser): void {
    if (confirm(`Reject ${user.firstname} ${user.lastname}'s registration?`)) {
      this.userService.rejectUser(user.id).subscribe({
        next: () => {
          // Remove user from pending list
          this.pendingUsers = this.pendingUsers.filter(u => u.id !== user.id);
          
          // Update stats
          this.updateStats();
          
          // Add notification (only for SuperAdmin)
          this.notifyUserRejection(`${user.firstname} ${user.lastname}`);
          
          this.closeUserDetails();
        },
        error: (error) => {
          this.addNotification('error', `Failed to reject user: ${error.error?.message || 'Unknown error'}`);
        }
      });
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.markAllAsRead();
    }
  }

  clearNotifications(): void {
    if (confirm('Clear all notifications?')) {
      this.notifications = [];
      this.unreadCount = 0;
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getUserTypeIcon(user: PendingUser): string {
    return user.cin ? 'admin_panel_settings' : 'person';
  }

  getUserTypeClass(user: PendingUser): string {
    return user.cin ? 'admin' : 'member';
  }

  getTimeAgo(date: Date | undefined): string {
    if (!date) return 'Unknown';
    const registrationDate = new Date(date as any);
    if (isNaN(registrationDate.getTime())) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - registrationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }
}
