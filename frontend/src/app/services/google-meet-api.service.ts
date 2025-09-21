import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface GoogleMeetInfo {
  meetingUrl: string;
  meetingTitle: string;
  meetingId: string;
  startTime?: string;
  endTime?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMeetApiService {
  private isGapiLoaded = false;
  private isSignedIn = false;
  private accessToken: string | null = null;

  constructor() {
    this.initializeGapi();
  }

  /**
   * Initialize Google Identity Services
   */
  private async initializeGapi(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isGapiLoaded) {
        resolve();
        return;
      }

      // Wait for Google Identity Services to load
      const checkGoogleLoaded = () => {
        if ((window as any).google && (window as any).google.accounts) {
          this.isGapiLoaded = true;
          resolve();
        } else {
          setTimeout(checkGoogleLoaded, 100);
        }
      };

      checkGoogleLoaded();
    });
  }

  /**
   * Sign in with Google using modern Google Identity Services
   */
  async signIn(): Promise<boolean> {
    try {
      await this.initializeGapi();
      
      return new Promise((resolve, reject) => {
        // Use modern Google Identity Services
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: environment.googleMeet.clientId,
          scope: 'https://www.googleapis.com/auth/calendar',
          callback: (response: any) => {
            this.isSignedIn = true;
            this.accessToken = response.access_token;
            resolve(true);
          },
          error_callback: (error: any) => {
            reject(error);
          },
          ux_mode: 'popup',
          select_account: true
        });

        // Request access token with fallback to redirect mode
        try {
          tokenClient.requestAccessToken();
        } catch (popupError) {
          // Fallback to redirect mode if popup is blocked
          const redirectClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: environment.googleMeet.clientId,
            scope: 'https://www.googleapis.com/auth/calendar',
            callback: (response: any) => {
              this.isSignedIn = true;
              this.accessToken = response.access_token;
              resolve(true);
            },
            error_callback: (error: any) => {
              reject(error);
            },
            ux_mode: 'redirect'
          });
          redirectClient.requestAccessToken();
        }
      });
    } catch (error: any) {
      // Handle OAuth errors
      if (error.error === 'popup_closed_by_user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.error === 'access_denied') {
        throw new Error('Access denied. Please make sure you are added as a test user in Google Cloud Console.');
      } else if (error.status === 403) {
        throw new Error('OAuth consent screen not configured. Please add your email as a test user in Google Cloud Console.');
      } else if (error.error === 'idpiframe_initialization_failed') {
        throw new Error('OAuth consent screen not configured. Please configure OAuth consent screen in Google Cloud Console and add your email as a test user.');
      } else {
        throw new Error(`Sign-in failed: ${error.error || error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (this.isSignedIn) {
      this.isSignedIn = false;
      this.accessToken = null;
    }
  }

  /**
   * Check if user is signed in
   */
  isUserSignedIn(): boolean {
    return this.isSignedIn;
  }

  /**
   * Create a Google Meet meeting
   */
  async createMeeting(title: string, startTime?: Date, endTime?: Date): Promise<GoogleMeetInfo> {
    try {
      if (!this.isSignedIn || !this.accessToken) {
        const signedIn = await this.signIn();
        if (!signedIn) {
          throw new Error('Failed to sign in to Google');
        }
      }

      // Set default times if not provided
      const now = new Date();
      const start = startTime || now;
      const end = endTime || new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later

      // Create calendar event with Google Meet
      const event = {
        summary: title,
        description: 'Meeting created via Gym Management System',
        start: {
          dateTime: start.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        conferenceData: {
          createRequest: {
            requestId: `gym-meeting-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        },
        attendees: [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
      };

      // Use fetch API with access token
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const meeting = await response.json();
      const meetUrl = meeting.conferenceData?.entryPoints?.[0]?.uri;

      if (!meetUrl) {
        throw new Error('Failed to create Google Meet link');
      }

      return {
        meetingUrl: meetUrl,
        meetingTitle: title,
        meetingId: meeting.id,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      };

    } catch (error) {
      throw error;
    }
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