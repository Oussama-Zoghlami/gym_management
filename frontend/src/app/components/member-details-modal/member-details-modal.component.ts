import { Component, Input, Output, EventEmitter } from '@angular/core';
import { SubscribedMember } from '../../services/user.service';

@Component({
  selector: 'app-member-details-modal',
  templateUrl: './member-details-modal.component.html',
  styleUrls: ['./member-details-modal.component.scss']
})
export class MemberDetailsModalComponent {
  @Input() isOpen = false;
  @Input() member: SubscribedMember | null = null;
  @Output() close = new EventEmitter<void>();

  constructor() { }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  getMemberInitials(member: SubscribedMember): string {
    return `${member.firstname.charAt(0)}${member.lastname.charAt(0)}`.toUpperCase();
  }

  getMembershipDuration(subscriptionDate: string): string {
    const subscription = new Date(subscriptionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - subscription.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      let result = `${years} year${years !== 1 ? 's' : ''}`;
      if (remainingMonths > 0) {
        result += `, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
      }
      return result;
    }
  }

  contactMember(): void {
    if (this.member) {
      // This could trigger a message modal or redirect to messaging
      console.log('Contact member:', this.member.email);
      // For now, just close the modal
      this.onClose();
    }
  }
}
