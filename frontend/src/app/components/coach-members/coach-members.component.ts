import { Component, OnInit } from '@angular/core';
import { UserService, SubscribedMember } from '../../services/user.service';

@Component({
  selector: 'app-coach-members',
  templateUrl: './coach-members.component.html',
  styleUrls: ['./coach-members.component.scss']
})
export class CoachMembersComponent implements OnInit {
  gymMembers: SubscribedMember[] = [];
  isLoading = true;
  error: string | null = null;
  showEmailModal = false;
  selectedMember: SubscribedMember | null = null;
  showMemberDetailsModal = false;
  selectedMemberForDetails: SubscribedMember | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadGymMembers();
  }

  loadGymMembers(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getGymMembers().subscribe({
      next: (members) => {
        this.gymMembers = members;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load gym members';
        this.isLoading = false;
        console.error('Error loading gym members:', err);
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getGymBadgeClass(gymCode: string): string {
    // Generate a consistent color based on gym code
    const colors = ['badge-primary', 'badge-secondary', 'badge-success', 'badge-warning', 'badge-info'];
    const hash = gymCode.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  }

  getRecentMembers(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.gymMembers.filter(member => {
      const subscriptionDate = new Date(member.subscriptionDate);
      return subscriptionDate >= oneMonthAgo;
    }).length;
  }

  openEmailModal(member: SubscribedMember) {
    this.selectedMember = member;
    this.showEmailModal = true;
  }

  closeEmailModal() {
    this.showEmailModal = false;
    this.selectedMember = null;
  }

  openMemberDetailsModal(member: SubscribedMember) {
    this.selectedMemberForDetails = member;
    this.showMemberDetailsModal = true;
  }

  closeMemberDetailsModal() {
    this.showMemberDetailsModal = false;
    this.selectedMemberForDetails = null;
  }
}
