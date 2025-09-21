import { Component, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-message-modal',
  templateUrl: './message-modal.component.html',
  styleUrls: ['./message-modal.component.scss']
})
export class MessageModalComponent {
  @Input() isOpen = false;
  @Input() member: any = null;
  @Output() close = new EventEmitter<void>();
  
  messageContent = '';
  isSending = false;

  constructor(private http: HttpClient) {}

  onSendMessage() {
    if (!this.messageContent.trim() || !this.member || this.isSending) {
      return;
    }

    this.isSending = true;
    
    // Send notification via API to the member (keeping original working method)
    const notificationData = {
      receiverId: this.member.id,
      content: this.messageContent.trim(),
      senderName: '' // Backend will determine the actual role
    };

    // Get JWT token from localStorage
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.post('http://localhost:8080/api/v1/notifications/send', notificationData, { 
      headers,
      responseType: 'text' // Expect plain text response, not JSON
    })
      .subscribe({
        next: (response) => {
          this.messageContent = '';
          this.isSending = false;
          this.close.emit();
        },
        error: (error) => {
          console.error('Failed to send notification:', error);
          this.isSending = false;
        }
      });
  }

  onClose() {
    this.messageContent = '';
    this.close.emit();
  }

  private getCurrentUserRole(): string {
    const token = localStorage.getItem('token');
    if (!token) return 'Staff';
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles && payload.roles.length > 0 ? payload.roles[0] : 'Staff';
    } catch (e) {
      return 'Staff';
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSendMessage();
    }
  }
}
