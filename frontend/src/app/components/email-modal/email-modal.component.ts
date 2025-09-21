import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { SubscribedMember } from '../../services/user.service';

@Component({
  selector: 'app-email-modal',
  templateUrl: './email-modal.component.html',
  styleUrls: ['./email-modal.component.scss']
})
export class EmailModalComponent {
  @Input() isOpen = false;
  @Input() member: SubscribedMember | null = null;
  @Output() close = new EventEmitter<void>();

  emailContent = '';
  isSending = false;

  constructor(private http: HttpClient) {}

  onSendEmail() {
    if (!this.emailContent.trim() || !this.member || this.isSending) {
      return;
    }

    this.isSending = true;
    
    const emailData = {
      memberEmail: this.member.email,
      memberName: `${this.member.firstname} ${this.member.lastname}`,
      content: this.emailContent.trim(),
      subject: 'Message from Gym Staff'
    };

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post('http://localhost:8080/api/v1/email/send-to-member', emailData, { 
      headers,
      responseType: 'text'
    })
      .subscribe({
        next: (response) => {
          this.emailContent = '';
          this.isSending = false;
          this.close.emit();
        },
        error: (error) => {
          console.error('Failed to send email:', error);
          this.isSending = false;
        }
      });
  }

  onClose() {
    this.emailContent = '';
    this.close.emit();
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendEmail();
    }
  }

  getMemberInitials(member: SubscribedMember): string {
    return `${member.firstname.charAt(0)}${member.lastname.charAt(0)}`.toUpperCase();
  }
}
