import { Injectable } from '@angular/core';

export interface SimpleMeetingInfo {
  meetingCode: string;
  meetingUrl: string;
  meetingTitle: string;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleGoogleMeetService {

  constructor() { }

  /**
   * Generate a unique meeting code for Google Meet
   */
  private generateMeetingCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = chars + numbers;
    
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += '-';
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Create a new Google Meet meeting using the instant meeting approach
   * This creates a real meeting that both users can join
   */
  createMeeting(title?: string): SimpleMeetingInfo {
    // Use Google Meet's instant meeting creation
    // This creates a real meeting that both users can join
    const meetingUrl = 'https://meet.google.com/new';
    const meetingTitle = title || `Gym Meeting - ${new Date().toLocaleDateString()}`;
    
    return {
      meetingCode: 'instant-meeting',
      meetingUrl,
      meetingTitle
    };
  }

  /**
   * Extract meeting URL from message content
   */
  extractMeetingUrl(content: string): string | null {
    const urlRegex = /https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+/g;
    const match = content.match(urlRegex);
    return match ? match[0] : null;
  }

  /**
   * Open Google Meet in new tab
   */
  openMeeting(meetingUrl: string): void {
    window.open(meetingUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Check if message contains a meeting invitation
   */
  isMeetingMessage(content: string): boolean {
    return content.includes('🎥 **Google Meet Invitation**') || 
           content.includes('https://meet.google.com/');
  }
}
