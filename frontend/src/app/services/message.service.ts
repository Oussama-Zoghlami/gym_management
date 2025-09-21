import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MessageRequest {
  receiverId: number;
  content: string;
}

export interface MessageResponse {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  timestamp: string;
  isRead: boolean; // Backend sends 'isRead', not 'read'
}

export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:8080/api/v1/messages';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Send a new message
   */
  sendMessage(messageRequest: MessageRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.apiUrl, messageRequest, {
      headers: this.getHeaders()
    });
  }


  /**
   * Get conversation between current user and another user
   */
  getConversation(otherUserId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/conversation/${otherUserId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Mark a message as read
   */
  markAsRead(messageId: number): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(`${this.apiUrl}/${messageId}/read`, {}, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get unread message count for current user
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get all users that the current user has conversations with
   */
  getConversationPartners(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/conversation-partners`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get all users in the same gym (potential conversation partners)
   */
  getGymUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/gym-users`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Delete conversation with another user
   * - Member deletion: Only hides for member, coach still sees it
   * - Coach deletion: Hides for both users (complete deletion)
   */
  deleteConversation(otherUserId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/conversation/${otherUserId}`, {
      headers: this.getHeaders()
    });
  }
}
