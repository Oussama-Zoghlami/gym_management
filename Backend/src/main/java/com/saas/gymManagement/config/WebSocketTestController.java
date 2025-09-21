package com.saas.gymManagement.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test")
public class WebSocketTestController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Test endpoint to verify WebSocket configuration
     */
    @GetMapping("/websocket")
    public String testWebSocket() {
        try {
            // Send a test message to all connected clients
            messagingTemplate.convertAndSend("/topic/test", "WebSocket is working!");
            return "WebSocket test message sent successfully!";
        } catch (Exception e) {
            return "WebSocket test failed: " + e.getMessage();
        }
    }
}
