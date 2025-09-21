import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { environment } from '../../environments/environment';
import { MessageResponse } from './message.service';

// Ensure global is available for @stomp/stompjs
declare const global: any;
if (typeof global === 'undefined') {
  (window as any).global = window;
}

export interface TypingResponse {
  userId: number;
  userName: string;
  typing: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private connected = false;
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<MessageResponse | null>(null);
  private notificationSubject = new BehaviorSubject<any>(null);
  private typingSubject = new BehaviorSubject<TypingResponse | null>(null);
  private readStatusSubject = new BehaviorSubject<MessageResponse | null>(null);
  private retryCount = 0;
  private maxRetries = 5;

  constructor() {
    // Make service accessible from browser console for debugging
    if (typeof window !== 'undefined') {
      (window as any).webSocketService = this;
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.connected) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    console.log('🔑 WebSocket connection attempt with token length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');

    // Create SockJS connection - WebSocket endpoint is at root level, not under /api/v1
    // Use localhost for better compatibility
    const socket = new SockJS(`http://localhost:8080/ws`);
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str: string) => {
        // Enable debug logging to troubleshoot WebSocket issues
        console.log('STOMP Debug:', str);
      },
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      // Add heartbeat configuration
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      // Add connection timeout
      connectionTimeout: 5000,
      onConnect: (frame: any) => {
        console.log('✅ Connected to WebSocket:', frame);
        console.log('✅ Connection headers sent:', frame.headers);
        this.connected = true;
        this.connectionSubject.next(true);
        this.resetRetryCount(); // Reset retry count on successful connection
        this.setupSubscriptions();
      },
      onStompError: (frame: any) => {
        console.error('❌ WebSocket STOMP error:', frame);
        console.error('❌ STOMP error details:', JSON.stringify(frame, null, 2));
        this.connected = false;
        this.connectionSubject.next(false);
        this.retryConnection();
      },
      onWebSocketError: (error: any) => {
        console.error('❌ WebSocket connection error:', error);
        console.error('❌ WebSocket error details:', JSON.stringify(error, null, 2));
        this.connected = false;
        this.connectionSubject.next(false);
        this.retryConnection();
      }
    });

    // Activate the client
    this.stompClient.activate();
    
    // Add timeout to detect hanging connections
    setTimeout(() => {
      if (!this.connected) {
        console.error('❌ WebSocket connection timeout after 5 seconds');
        console.error('❌ Connection URL:', `http://localhost:8080/ws`);
        console.error('❌ Token length:', token ? token.length : 0);
        this.connected = false;
        this.connectionSubject.next(false);
        // Retry connection
        this.retryConnection();
      }
    }, 5000);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.stompClient && this.connected) {
      this.stompClient.deactivate().then(() => {
        console.log('Disconnected from WebSocket');
        this.connected = false;
        this.connectionSubject.next(false);
      });
    }
  }

  /**
   * Setup message subscriptions
   */
  private setupSubscriptions(): void {
    if (!this.stompClient || !this.connected) {
      console.log('❌ Cannot setup subscriptions - WebSocket not connected');
      return;
    }

    // Subscribe to user-specific message queue
    const currentUserId = this.getCurrentUserId();
    console.log('🔍 Setting up subscriptions for user ID:', currentUserId);
    console.log('🔍 Current user ID type:', typeof currentUserId);
    
    if (currentUserId && this.stompClient) {
      const messageDestination = `/queue/messages/${currentUserId}`;
      console.log('📡 Subscribing to message destination:', messageDestination);
      console.log('📡 Current user ID for subscription:', currentUserId);
      
      const subscription = this.stompClient.subscribe(messageDestination, (message: IMessage) => {
        console.log('📨 Raw message received:', message);
        console.log('📨 Message body:', message.body);
        console.log('📨 Message destination was:', messageDestination);
        console.log('📨 Message received by user ID:', currentUserId);
        
        try {
          const messageData: MessageResponse = JSON.parse(message.body);
          console.log('📨 Parsed real-time message:', messageData);
          console.log('📨 Message sender ID:', messageData.senderId);
          console.log('📨 Message receiver ID:', messageData.receiverId);
          console.log('📨 Current user ID:', currentUserId);
          console.log('📨 Broadcasting message to subscribers...');
          this.messageSubject.next(messageData);
        } catch (e) {
          console.error('❌ Error parsing message:', e);
          console.error('❌ Raw message body:', message.body);
        }
      });
      
      console.log('📡 Message subscription created:', subscription);
      console.log('📡 Subscription active for user:', currentUserId);

      // Subscribe to typing indicators
      const typingSubscription = this.stompClient.subscribe(`/queue/typing/${currentUserId}`, (message: IMessage) => {
        console.log('📝 Typing indicator received:', message.body);
        try {
          const typingData: TypingResponse = JSON.parse(message.body);
          console.log('📝 Parsed typing indicator:', typingData);
          this.typingSubject.next(typingData);
        } catch (e) {
          console.error('❌ Error parsing typing indicator:', e);
        }
      });
      
      console.log('📝 Typing subscription created:', typingSubscription);

      // Subscribe to read status updates
      const readSubscription = this.stompClient.subscribe(`/queue/read/${currentUserId}`, (message: IMessage) => {
        console.log('👁️ Read status received:', message.body);
        try {
          const readData: MessageResponse = JSON.parse(message.body);
          console.log('👁️ Parsed read status:', readData);
          this.readStatusSubject.next(readData);
        } catch (e) {
          console.error('❌ Error parsing read status:', e);
        }
      });
      
      console.log('👁️ Read status subscription created:', readSubscription);

      // Subscribe to notifications
      const notificationDestination = `/queue/notifications/${currentUserId}`;
      console.log('📢 Subscribing to notification destination:', notificationDestination);
      console.log('📢 Current user ID for notification subscription:', currentUserId);
      console.log('📢 STOMP client state:', this.stompClient ? 'active' : 'inactive');
      
      const notificationSubscription = this.stompClient.subscribe(notificationDestination, (message: IMessage) => {
        try {
          const notificationData = JSON.parse(message.body);
          
          // Debug: Check if this notification is for the current user
          console.log('WebSocket received notification:', {
            destination: message.headers['destination'],
            currentUserId: currentUserId,
            notificationReceiverId: notificationData.receiverId,
            content: notificationData.content
          });
          
          // Only emit the notification if it's intended for the current user
          if (!notificationData.receiverId || notificationData.receiverId === currentUserId) {
            this.notificationSubject.next(notificationData);
          } else {
            console.log('WebSocket: Ignoring notification not intended for current user');
          }
        } catch (e) {
          console.error('Error parsing notification:', e);
        }
      });
      
      console.log('📢 Notification subscription created:', notificationSubscription);
      console.log('📢 Subscription created successfully for destination:', notificationDestination);

      // Subscribe to test messages
      const testSubscription = this.stompClient.subscribe('/queue/test', (message: IMessage) => {
        console.log('🧪 Test message received:', message.body);
      });
      
      console.log('🧪 Test subscription created:', testSubscription);
    } else {
      console.error('❌ Cannot setup subscriptions - no valid user ID or STOMP client');
      console.error('❌ Current user ID:', currentUserId);
      console.error('❌ STOMP client exists:', !!this.stompClient);
    }
  }

  /**
   * Send a message via WebSocket
   */
  sendMessage(receiverId: number, content: string): void {
    if (!this.stompClient || !this.connected) {
      console.error('WebSocket not connected');
      console.error('STOMP client exists:', !!this.stompClient);
      console.error('Connected status:', this.connected);
      console.error('Attempting to reconnect...');
      
      // Try to reconnect
      this.connect();
      
      // Show user-friendly error
      alert('Connection lost. Please try again in a moment.');
      return;
    }

    const message = {
      receiverId: receiverId,
      content: content
    };

    console.log('📤 Sending message:', message);
    this.stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message)
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(receiverId: number, isTyping: boolean): void {
    if (!this.stompClient || !this.connected) {
      return;
    }

    const typingMessage = {
      receiverId: receiverId,
      typing: isTyping
    };

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(typingMessage)
    });
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: number): void {
    if (!this.stompClient || !this.connected) {
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.markRead',
      body: JSON.stringify(messageId)
    });
  }

  /**
   * Get connection status observable
   */
  getConnectionStatusObservable(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  /**
   * Get incoming messages observable
   */
  getMessages(): Observable<MessageResponse | null> {
    return this.messageSubject.asObservable();
  }

  /**
   * Get incoming notifications observable
   */
  getNotifications(): Observable<any> {
    return this.notificationSubject.asObservable();
  }

  /**
   * Get typing indicators observable
   */
  getTypingIndicators(): Observable<TypingResponse | null> {
    return this.typingSubject.asObservable();
  }

  /**
   * Get read status updates observable
   */
  getReadStatusUpdates(): Observable<MessageResponse | null> {
    return this.readStatusSubject.asObservable();
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get connection status with detailed info
   */
  getConnectionStatus(): { connected: boolean; stompClient: boolean; details: string } {
    const status = {
      connected: this.connected,
      stompClient: !!this.stompClient,
      details: ''
    };

    if (!this.stompClient) {
      status.details = 'STOMP client not initialized';
    } else if (!this.connected) {
      status.details = 'STOMP client exists but not connected';
    } else {
      status.details = 'Connected and ready';
    }

    return status;
  }

  /**
   * Retry connection with exponential backoff
   */
  private retryConnection(): void {
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Max retry attempts reached. WebSocket connection failed.');
      return;
    }

    this.retryCount++;
    const delay = Math.pow(2, this.retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    
    console.log(`🔄 Retrying WebSocket connection (attempt ${this.retryCount}/${this.maxRetries}) in ${delay/1000}s...`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Reset retry count on successful connection
   */
  private resetRetryCount(): void {
    this.retryCount = 0;
  }

  /**
   * Test connection manually (for debugging)
   */
  testConnection(): void {
    console.log('🧪 Testing WebSocket connection...');
    console.log('🧪 Current status:', this.getConnectionStatus());
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('🧪 No token found in localStorage');
      return;
    }
    
    console.log('🧪 Token found, length:', token.length);
    console.log('🧪 Token preview:', token.substring(0, 20) + '...');
    
    // Check current user ID
    const currentUserId = this.getCurrentUserId();
    console.log('🧪 Current user ID from token:', currentUserId);
    
    // Try to connect
    this.connect();
  }

  /**
   * Test WebSocket endpoint accessibility (without authentication)
   */
  testEndpointAccessibility(): void {
    console.log('🧪 Testing WebSocket endpoint accessibility...');
    
    // Try to create a simple SockJS connection without authentication
    const testSocket = new SockJS('http://localhost:8080/ws');
    const testClient = new Client({
      webSocketFactory: () => testSocket,
      debug: (str: string) => {
        console.log('🧪 Test STOMP Debug:', str);
      },
      onConnect: (frame: any) => {
        console.log('🧪 Test connection successful:', frame);
        testClient.deactivate();
      },
      onStompError: (frame: any) => {
        console.log('🧪 Test STOMP error:', frame);
        console.log('🧪 This is expected without authentication');
      },
      onWebSocketError: (error: any) => {
        console.log('🧪 Test WebSocket error:', error);
      }
    });
    
    testClient.activate();
    
    // Clean up after 5 seconds
    setTimeout(() => {
      if (testClient) {
        testClient.deactivate();
      }
    }, 5000);
  }

  /**
   * Get current user ID from JWT token
   */
  public getCurrentUserId(): number | null {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('DEBUG: JWT payload for user ID:', payload);
      
      // Try different possible fields for user ID (prefer numeric IDs)
      let userId = payload.userId || payload.id || payload.user_id || null;
      
      // If we got an email instead of ID, try to find the numeric ID
      if (!userId && payload.sub) {
        // If sub is an email, we need to get the numeric ID from elsewhere
        if (payload.sub.includes('@')) {
          console.log('DEBUG: sub is an email, looking for numeric ID in other fields');
          // Try other fields that might contain the numeric ID
          userId = payload.userId || payload.id || payload.user_id || null;
        } else {
          // If sub is not an email, try to parse it as a number
          const subAsNumber = parseInt(payload.sub);
          if (!isNaN(subAsNumber)) {
            userId = subAsNumber;
          }
        }
      }
      
      // If still null, try to get from user info in localStorage
      if (!userId) {
        const userInfo = localStorage.getItem('user');
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo);
            userId = user.id || user.userId || user.user_id;
            console.log('DEBUG: Got userId from localStorage user:', userId);
          } catch (e) {
            console.error('Error parsing user from localStorage:', e);
          }
        }
      }
      
      console.log('DEBUG: Final userId from token:', userId);
      return userId;
    } catch (e) {
      console.error('Error parsing JWT token:', e);
      return null;
    }
  }

  /**
   * Test WebSocket endpoint accessibility
   */
}
