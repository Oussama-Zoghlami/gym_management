import { Injectable } from '@angular/core';
import { WebSocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketTestService {

  constructor(private webSocketService: WebSocketService) {}

  /**
   * Test WebSocket connection and functionality
   */
  testWebSocketConnection(): void {
    console.log('🧪 Testing WebSocket connection...');
    
    // Test connection status
    this.webSocketService.getConnectionStatusObservable().subscribe(connected => {
      console.log('🔌 WebSocket connection status:', connected ? '✅ Connected' : '❌ Disconnected');
    });

    // Test message subscription
    this.webSocketService.getMessages().subscribe(message => {
      if (message) {
        console.log('📨 Test: Received message via WebSocket:', message);
      }
    });

    // Test typing indicators
    this.webSocketService.getTypingIndicators().subscribe(typing => {
      if (typing) {
        console.log('⌨️ Test: Received typing indicator:', typing);
      }
    });

    // Test read status updates
    this.webSocketService.getReadStatusUpdates().subscribe(readUpdate => {
      if (readUpdate) {
        console.log('👁️ Test: Received read status update:', readUpdate);
      }
    });

    console.log('🧪 WebSocket test setup complete. Check console for real-time updates.');
  }

  /**
   * Test sending a message via WebSocket
   */
  testSendMessage(receiverId: number, content: string): void {
    console.log(`📤 Test: Sending message to user ${receiverId}: "${content}"`);
    this.webSocketService.sendMessage(receiverId, content);
  }

  /**
   * Test typing indicator
   */
  testTypingIndicator(receiverId: number, isTyping: boolean): void {
    console.log(`⌨️ Test: Sending typing indicator to user ${receiverId}: ${isTyping ? 'typing' : 'not typing'}`);
    this.webSocketService.sendTypingIndicator(receiverId, isTyping);
  }
}
