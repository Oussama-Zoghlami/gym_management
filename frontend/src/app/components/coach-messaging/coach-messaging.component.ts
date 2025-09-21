import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService, MessageRequest, MessageResponse, User } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';
import { GoogleMeetApiService, GoogleMeetInfo } from '../../services/google-meet-api.service';
import { environment } from '../../../environments/environment';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-coach-messaging',
  templateUrl: './coach-messaging.component.html',
  styleUrls: ['./coach-messaging.component.scss']
})
export class CoachMessagingComponent implements OnInit, OnDestroy {
  messages: MessageResponse[] = [];
  conversationPartners: User[] = [];
  gymUsers: User[] = [];
  selectedPartnerId: number | null = null;
  selectedPartnerName: string = '';
  newMessage: string = '';
  unreadCount: number = 0;
  isLoading: boolean = false;
  currentUserId: number | null = null;
  isCoach: boolean = false;
  unreadCounts: { [userId: number]: number } = {}; // Track unread messages per user
  unreadMessages: { [userId: number]: MessageResponse[] } = {}; // Track actual unread messages per user
  
  private refreshSubscription: Subscription | null = null;
  private webSocketSubscriptions: Subscription[] = [];
  private typingTimeout: any;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    public webSocketService: WebSocketService,
    public googleMeetApiService: GoogleMeetApiService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.getCurrentUserId();
    this.checkUserRole();
    this.initializeWebSocket();
    this.setupScrollListener();
    // Google Meet initialization removed - using simple approach
    // Reduce polling frequency since we have WebSocket
    this.startReducedPolling();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.cleanupWebSocket();
  }

  private getCurrentUserId(): void {
    // Extract user ID from JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Try different possible fields for user ID (prefer numeric IDs)
        this.currentUserId = payload.userId || payload.id || payload.user_id || null;
        
        // If we got an email instead of ID, try to find the numeric ID
        if (!this.currentUserId && payload.sub) {
          // If sub is an email, we need to get the numeric ID from elsewhere
          if (payload.sub.includes('@')) {
            // Try other fields that might contain the numeric ID
            this.currentUserId = payload.userId || payload.id || payload.user_id || null;
          } else {
            // If sub is not an email, try to parse it as a number
            const subAsNumber = parseInt(payload.sub);
            if (!isNaN(subAsNumber)) {
              this.currentUserId = subAsNumber;
            }
          }
        }
        
        // If still null, try to get from user info in localStorage
        if (!this.currentUserId) {
          const userInfo = localStorage.getItem('user');
          if (userInfo) {
            try {
              const user = JSON.parse(userInfo);
              this.currentUserId = user.id || user.userId || user.user_id;
              console.log('DEBUG: Got currentUserId from localStorage user:', this.currentUserId);
            } catch (e) {
              console.error('Error parsing user from localStorage:', e);
            }
          }
        }
        
        // If still null, try to get from auth service
        if (!this.currentUserId) {
          try {
            this.authService.currentUser$.subscribe(user => {
              if (user && user.id) {
                this.currentUserId = user.id;
                console.log('DEBUG: Got currentUserId from auth service:', this.currentUserId);
              }
            });
          } catch (e) {
            console.error('Error getting user from auth service:', e);
          }
        }
        
        console.log('DEBUG: Final currentUserId:', this.currentUserId);
        console.log('DEBUG: currentUserId type:', typeof this.currentUserId);
        
        // Remove manual override - use actual user ID from token
        if (!this.currentUserId || typeof this.currentUserId === 'string') {
          console.log('DEBUG: No valid user ID found in token, trying to get from user info');
          // Try to get from user info in localStorage
          const userInfo = localStorage.getItem('user');
          if (userInfo) {
            try {
              const user = JSON.parse(userInfo);
              this.currentUserId = user.id || user.userId || user.user_id;
              console.log('DEBUG: Got currentUserId from localStorage user:', this.currentUserId);
            } catch (e) {
              console.error('Error parsing user from localStorage:', e);
            }
          }
        }
      } catch (e) {
        console.error('Error parsing JWT token:', e);
      }
    } else {
      console.log('DEBUG: No token found in localStorage');
    }
  }

  private checkUserRole(): void {
    const role = localStorage.getItem('role');
    this.isCoach = role === 'COACH' || role === 'Coach' || role === 'ADMIN' || role === 'Admin';
  }

  // Google Meet initialization removed - using simple approach

  private loadInitialData(): void {
    this.loadGymUsers();
    this.loadConversationPartners();
    this.loadUnreadCount();
  }

  private loadConversationPartners(): void {
    this.messageService.getConversationPartners().subscribe({
      next: (partners) => {
        this.conversationPartners = partners;
        // Initialize unread counts and messages for all partners
        partners.forEach(partner => {
          if (!this.unreadCounts[partner.id]) {
            this.unreadCounts[partner.id] = 0;
          }
          if (!this.unreadMessages[partner.id]) {
            this.unreadMessages[partner.id] = [];
          }
        });
      },
      error: (error) => {
        console.error('Error loading conversation partners:', error);
      }
    });
  }

  private loadGymUsers(): void {
    this.messageService.getGymUsers().subscribe({
      next: (users) => {
        this.gymUsers = users;
      },
      error: (error) => {
        console.error('Error loading gym users:', error);
      }
    });
  }

  private loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }


  selectPartner(partner: User): void {
    this.selectedPartnerId = partner.id;
    this.selectedPartnerName = `${partner.firstname} ${partner.lastname}`;
    
    // Clear unread count and messages for this partner
    this.unreadCounts[partner.id] = 0;
    this.unreadMessages[partner.id] = [];
    
    this.loadConversation(partner.id);
  }

  private loadConversation(partnerId: number): void {
    this.isLoading = true;
    this.messageService.getConversation(partnerId).subscribe({
      next: (messages) => {
        // Sort messages in ascending order (oldest first) for proper chat display
        this.messages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        this.isLoading = false;
        // Mark messages as read
        this.markMessagesAsRead(messages);
        // Scroll to bottom to show latest messages
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Error loading conversation:', error);
        this.isLoading = false;
      }
    });
  }

  private markMessagesAsRead(messages: MessageResponse[]): void {
    const unreadMessages = messages.filter(m => !m.isRead && m.receiverId === this.currentUserId);
    unreadMessages.forEach(message => {
      // Try WebSocket first, fallback to REST API
      if (this.webSocketService.isConnected()) {
        this.webSocketService.markMessageAsRead(message.id);
      } else {
        this.messageService.markAsRead(message.id).subscribe({
          next: () => {
            // Update local message as read
            const index = this.messages.findIndex(m => m.id === message.id);
            if (index !== -1) {
              this.messages[index].isRead = true;
            }
          },
          error: (error) => {
            console.error('Error marking message as read:', error);
          }
        });
      }
    });

    // Clear unread count and messages for the current conversation
    if (this.selectedPartnerId) {
      this.unreadCounts[this.selectedPartnerId] = 0;
      this.unreadMessages[this.selectedPartnerId] = [];
    }
  }

  handleKeyDown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    
    // Send typing indicator
    if (this.selectedPartnerId && this.webSocketService.isConnected()) {
      this.webSocketService.sendTypingIndicator(this.selectedPartnerId, true);
      
      // Clear previous timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
      
      // Set timeout to stop typing indicator after 2 seconds of inactivity
      this.typingTimeout = setTimeout(() => {
        this.webSocketService.sendTypingIndicator(this.selectedPartnerId!, false);
      }, 2000);
    }
    
    // Only handle Enter key
    if (keyboardEvent.key === 'Enter') {
      if (!keyboardEvent.shiftKey) {
        // Enter without Shift - send message and prevent default
        event.preventDefault();
        this.sendMessage();
        
        // Stop typing indicator when sending message
        if (this.selectedPartnerId && this.webSocketService.isConnected()) {
          this.webSocketService.sendTypingIndicator(this.selectedPartnerId, false);
        }
      }
      // If Shift+Enter, allow default behavior (new line)
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedPartnerId) {
      return;
    }

    const messageContent = this.newMessage.trim();
    this.newMessage = '';

    // Use WebSocket only - no fallback
    if (this.webSocketService.isConnected() && this.selectedPartnerId) {
      this.webSocketService.sendMessage(this.selectedPartnerId, messageContent);
      
      // Get current user name from localStorage
      let currentUserName = 'You';
      const userInfo = localStorage.getItem('user');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          currentUserName = user.firstName && user.lastName ? 
            `${user.firstName} ${user.lastName}` : 
            (user.name || user.firstName || 'You');
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }

      // Add message optimistically (will be updated when WebSocket confirms)
      const optimisticMessage: MessageResponse = {
        id: Date.now(), // Temporary ID
        senderId: this.currentUserId!,
        receiverId: this.selectedPartnerId,
        content: messageContent,
        timestamp: new Date().toISOString(),
        senderName: currentUserName,
        receiverName: this.selectedPartnerName,
        isRead: false
      };
      this.messages.push(optimisticMessage);
      setTimeout(() => this.scrollToBottom(), 100);
      
    } else {
      console.error('DEBUG: WebSocket not connected! Cannot send message.');
      alert('WebSocket not connected. Please refresh the page and try again.');
    }
  }

  private scrollToTop(): void {
    try {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.scrollTop = 0;
      }
    } catch (err) {
      console.error('Error scrolling to top:', err);
    }
  }

  private scrollToBottom(): void {
    try {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        // Use requestAnimationFrame for better timing
        requestAnimationFrame(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        });
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private isNearBottom(): boolean {
    try {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        const threshold = 100; // pixels from bottom
        return messagesContainer.scrollTop + messagesContainer.clientHeight >= 
               messagesContainer.scrollHeight - threshold;
      }
    } catch (err) {
      console.error('Error checking scroll position:', err);
    }
    return true; // Default to true if we can't determine
  }

  private scrollToBottomIfNearBottom(): void {
    if (this.isNearBottom()) {
      this.scrollToBottom();
    }
  }

  private setupScrollListener(): void {
    // Add scroll listener to track user scroll behavior
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.addEventListener('scroll', () => {
          // This can be used for future enhancements like showing "new messages" indicator
        });
      }
    }, 1000);
  }

  private initializeWebSocket(): void {
    // Connect to WebSocket
    console.log('DEBUG: Initializing WebSocket connection...');
    this.webSocketService.connect();
    
    // Check connection status multiple times
    setTimeout(() => {
      console.log('DEBUG: WebSocket connected (1s):', this.webSocketService.isConnected());
    }, 1000);
    
    setTimeout(() => {
      console.log('DEBUG: WebSocket connected (3s):', this.webSocketService.isConnected());
      if (!this.webSocketService.isConnected()) {
        console.log('DEBUG: WebSocket still not connected after 3 seconds');
        console.log('DEBUG: Token exists:', !!localStorage.getItem('token'));
        console.log('DEBUG: API URL:', environment.apiUrl);
      }
    }, 3000);
    
    setTimeout(() => {
      console.log('DEBUG: WebSocket connected (5s):', this.webSocketService.isConnected());
    }, 5000);
    

    // Subscribe to WebSocket messages
    this.webSocketSubscriptions.push(
      this.webSocketService.getMessages().subscribe(message => {
        console.log('DEBUG: Received WebSocket message:', message);
        if (message) {
          // Add new message to current conversation if it's from/to the selected partner
          if (this.selectedPartnerId && (message.senderId === this.selectedPartnerId || message.receiverId === this.selectedPartnerId)) {
            console.log('DEBUG: Adding message to current conversation');
            
            // Check if this is a confirmation of a message we sent optimistically
            const optimisticIndex = this.messages.findIndex(m => 
              m.senderId === message.senderId && 
              m.content === message.content && 
              m.id !== message.id
            );
            
            if (optimisticIndex !== -1) {
              // Replace optimistic message with real one
              this.messages[optimisticIndex] = message;
              console.log('DEBUG: Replaced optimistic message with real message');
            } else {
              // Add new message to the end
              this.messages.push(message);
            }
            
            // Always scroll to bottom when receiving new messages
            setTimeout(() => this.scrollToBottom(), 100);
          }
          
          // Update unread counts and messages for the sender
          if (message.senderId !== this.currentUserId) {
            const senderId = message.senderId;
            
            // Initialize arrays if they don't exist
            if (!this.unreadMessages[senderId]) {
              this.unreadMessages[senderId] = [];
            }
            
            // Add the message to unread messages for this sender
            this.unreadMessages[senderId].push(message);
            
            // Update count
            this.unreadCounts[senderId] = this.unreadMessages[senderId].length;
          }
          
          // Update unread count
          this.loadUnreadCount();
        }
      })
    );

    // Subscribe to typing indicators
    this.webSocketSubscriptions.push(
      this.webSocketService.getTypingIndicators().subscribe(typing => {
        if (typing && typing.userId === this.selectedPartnerId) {
          // Handle typing indicator display
          console.log(`${typing.userName} is ${typing.typing ? 'typing' : 'not typing'}`);
        }
      })
    );

    // Subscribe to read status updates
    this.webSocketSubscriptions.push(
      this.webSocketService.getReadStatusUpdates().subscribe(readUpdate => {
        if (readUpdate) {
        // Update message read status in the current conversation
        const messageIndex = this.messages.findIndex(m => m.id === readUpdate.id);
        if (messageIndex !== -1) {
          this.messages[messageIndex].isRead = readUpdate.isRead;
        }
        }
      })
    );
  }

  private cleanupWebSocket(): void {
    // Unsubscribe from all WebSocket subscriptions
    this.webSocketSubscriptions.forEach(sub => sub.unsubscribe());
    this.webSocketSubscriptions = [];
    
    // Disconnect WebSocket
    this.webSocketService.disconnect();
  }

  private startReducedPolling(): void {
    // Minimal polling - only for unread count, no message polling
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  private startAutoRefresh(): void {
    // Keep the old method for backward compatibility
    this.startReducedPolling();
  }

  private stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }


  deleteConversation(): void {
    if (!this.selectedPartnerId) {
      return;
    }

    const partnerName = this.selectedPartnerName;
    const confirmMessage = this.isCoach 
      ? `Are you sure you want to delete this conversation with ${partnerName}? This will hide it for both you and ${partnerName}.`
      : `Are you sure you want to delete this conversation with ${partnerName}? This will hide it for you only.`;
      
    if (confirm(confirmMessage)) {
      this.messageService.deleteConversation(this.selectedPartnerId).subscribe({
        next: () => {
          // Clear the current conversation
          this.selectedPartnerId = null;
          this.selectedPartnerName = '';
          this.messages = [];
          
          // Refresh the conversation partners list
          this.loadConversationPartners();
          
          alert('Conversation deleted successfully.');
        },
        error: (error) => {
          console.error('Error deleting conversation:', error);
          alert('Failed to delete conversation. Please try again.');
        }
      });
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  isMyMessage(message: MessageResponse): boolean {
    return message.senderId === this.currentUserId;
  }

  getDisplaySenderName(message: MessageResponse): string {
    return this.isMyMessage(message) ? 'You' : message.senderName;
  }

  hasConversation(userId: number): boolean {
    return this.conversationPartners.some(partner => partner.id === userId);
  }

  /**
   * Get unread message count for a specific user
   */
  getUnreadCountForUser(userId: number): number {
    return this.unreadCounts[userId] || 0;
  }

  /**
   * Get total unread message count across all conversations
   */
  getTotalUnreadCount(): number {
    return Object.values(this.unreadCounts).reduce((total, count) => total + count, 0);
  }

  /**
   * Get the latest unread message from a specific user
   */
  getLatestUnreadMessage(userId: number): MessageResponse | null {
    const messages = this.unreadMessages[userId];
    if (messages && messages.length > 0) {
      // Return the most recent message (last in array)
      return messages[messages.length - 1];
    }
    return null;
  }

  /**
   * Get sender name for unread messages
   */
  getUnreadSenderName(userId: number): string {
    const latestMessage = this.getLatestUnreadMessage(userId);
    if (latestMessage) {
      return latestMessage.senderName;
    }
    return '';
  }

  /**
   * Get preview of latest unread message
   */
  getUnreadMessagePreview(userId: number): string {
    const latestMessage = this.getLatestUnreadMessage(userId);
    if (latestMessage) {
      // Truncate long messages
      const content = latestMessage.content;
      return content.length > 30 ? content.substring(0, 30) + '...' : content;
    }
    return '';
  }

  /**
   * Check if a message contains a Google Meet link
   */
  isMeetingMessage(content: string): boolean {
    return this.googleMeetApiService.isMeetingMessage(content);
  }


  /**
   * Join a Google Meet from message
   */
  joinMeeting(messageContent: string): void {
    const meetingUrl = this.googleMeetApiService.extractMeetingUrl(messageContent);
    
    if (meetingUrl) {
      this.googleMeetApiService.openMeeting(meetingUrl);
    } else {
      console.error('No meeting URL found in message');
      alert('Invalid meeting link');
    }
  }

  /**
   * Copy meeting link to clipboard
   */
  copyMeetingLink(messageContent: string): void {
    const meetingUrl = this.googleMeetApiService.extractMeetingUrl(messageContent);
    
    if (meetingUrl) {
      navigator.clipboard.writeText(meetingUrl).then(() => {
        // Show success feedback
        const button = event?.target as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = 'Copied!';
          button.style.backgroundColor = '#4CAF50';
          setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
          }, 2000);
        }
      }).catch(err => {
        console.error('Failed to copy meeting link:', err);
        alert('Failed to copy link. Please copy manually from the message.');
      });
    } else {
      alert('No meeting link found in this message.');
    }
  }

  /**
   * Create a Google Meet meeting using OAuth API
   */
  async createDirectMeeting(): Promise<void> {
    if (!this.selectedPartnerId || !this.isCoach) {
      return;
    }

    // Get current user name
    let currentUserName = 'Coach';
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        currentUserName = user.firstName && user.lastName ? 
          `${user.firstName} ${user.lastName}` : 
          (user.name || user.firstName || 'Coach');
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }

    try {
      // Show loading message
      console.log('Creating Google Meet meeting...');
      
      // Create meeting using Google Calendar API
      const meeting = await this.googleMeetApiService.createMeeting(
        `Meeting with ${this.selectedPartnerName}`
      );
      
      // Create meeting message with the actual link
      const meetingMessage = `🎥 **Google Meet Invitation**\n\n` +
        `📋 Meeting: ${meeting.meetingTitle}\n` +
        `🔗 Link: ${meeting.meetingUrl}\n` +
        `🆔 Meeting ID: ${meeting.meetingId}\n` +
        `⏰ Join anytime\n\n` +
        `👤 Invited by: ${currentUserName}\n\n` +
        `💡 Click the link to join the meeting!\n` +
        `🔓 Both you and ${this.selectedPartnerName} can use this SAME link.`;

      // Send meeting message via WebSocket
      if (this.webSocketService.isConnected() && this.selectedPartnerId) {
        this.webSocketService.sendMessage(this.selectedPartnerId, meetingMessage);
        
        // Add message optimistically
        const optimisticMessage: MessageResponse = {
          id: Date.now(),
          senderId: this.currentUserId!,
          receiverId: this.selectedPartnerId,
          content: meetingMessage,
          timestamp: new Date().toISOString(),
          senderName: currentUserName,
          receiverName: this.selectedPartnerName,
          isRead: false
        };
        this.messages.push(optimisticMessage);
        setTimeout(() => this.scrollToBottom(), 100);
        
        // Open Google Meet for the coach with the same link
        this.googleMeetApiService.openMeeting(meeting.meetingUrl);
        
        // Show success message
        console.log('Meeting created and shared successfully!');
        alert('Meeting created successfully! Both users can now join using the same link.');
      } else {
        console.error('WebSocket not connected! Cannot send meeting invitation.');
        alert('WebSocket not connected. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      alert('Failed to create Google Meet. Please make sure you are signed in to Google and try again.');
    }
  }

}
