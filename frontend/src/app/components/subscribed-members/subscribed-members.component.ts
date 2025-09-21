import { Component, OnInit } from '@angular/core';
import { UserService, SubscribedMember } from '../../services/user.service';

@Component({
  selector: 'app-subscribed-members',
  templateUrl: './subscribed-members.component.html',
  styleUrls: ['./subscribed-members.component.scss']
})
export class SubscribedMembersComponent implements OnInit {
  subscribedMembers: SubscribedMember[] = [];
  isLoading = true;
  error: string | null = null;
  showEmailModal = false;
  selectedMember: SubscribedMember | null = null;
  showMemberDetailsModal = false;
  selectedMemberForDetails: SubscribedMember | null = null;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadSubscribedMembers();
  }

  loadSubscribedMembers(): void {
    this.isLoading = true;
    this.error = null;
    
    this.userService.getSubscribedMembers().subscribe({
      next: (members) => {
        this.subscribedMembers = members;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load subscribed members';
        this.isLoading = false;
        console.error('Error loading subscribed members:', err);
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

  getUniqueGyms(): string[] {
    const gymCodes = this.subscribedMembers.map(member => member.gymCode);
    return [...new Set(gymCodes)];
  }

  getRecentMembers(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.subscribedMembers.filter(member => {
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
