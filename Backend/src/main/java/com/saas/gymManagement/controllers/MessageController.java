package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.MessageRequest;
import com.saas.gymManagement.dto.MessageResponse;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.services.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/messages")
@CrossOrigin(origins = "http://localhost:4200")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Send a new message
     */
    @PostMapping
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<MessageResponse> sendMessage(@RequestBody MessageRequest messageRequest) {
        System.out.println("DEBUG: POST /messages endpoint called");
        System.out.println("DEBUG: Request - receiverId: " + messageRequest.getReceiverId() + 
                         ", content length: " + (messageRequest.getContent() != null ? messageRequest.getContent().length() : 0));
        
        // Input validation
        if (messageRequest.getReceiverId() == null || messageRequest.getReceiverId() <= 0) {
            System.out.println("DEBUG: Invalid receiverId: " + messageRequest.getReceiverId());
            return ResponseEntity.badRequest().build();
        }
        
        if (messageRequest.getContent() == null || messageRequest.getContent().trim().isEmpty()) {
            System.out.println("DEBUG: Empty or null message content");
            return ResponseEntity.badRequest().build();
        }
        
        try {
            MessageResponse response = messageService.sendMessage(messageRequest);
            System.out.println("DEBUG: Message sent successfully with ID: " + response.getId());
            
            // Send real-time notification via WebSocket
            String receiverDestination = "/queue/messages/" + messageRequest.getReceiverId();
            messagingTemplate.convertAndSend(receiverDestination, response);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            System.out.println("DEBUG: RuntimeException in sendMessage: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build(); // 404 for business logic errors (user not found, etc.)
        } catch (Exception e) {
            System.out.println("DEBUG: Unexpected exception in sendMessage: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build(); // 500 for server errors
        }
    }


    /**
     * Get conversation between current user and another user
     */
    @GetMapping("/conversation/{otherUserId}")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<List<MessageResponse>> getConversation(@PathVariable Integer otherUserId) {
        try {
            List<MessageResponse> messages = messageService.getConversation(otherUserId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Mark a message as read
     */
    @PutMapping("/{messageId}/read")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<MessageResponse> markAsRead(@PathVariable Long messageId) {
        try {
            MessageResponse response = messageService.markMessageAsRead(messageId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get unread message count for current user
     */
    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<Long> getUnreadCount() {
        try {
            Long count = messageService.getUnreadMessageCount();
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get all users that the current user has conversations with
     */
    @GetMapping("/conversation-partners")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<List<User>> getConversationPartners() {
        System.out.println("DEBUG: GET /conversation-partners endpoint called");
        
        try {
            List<User> partners = messageService.getConversationPartners();
            System.out.println("DEBUG: Successfully retrieved " + partners.size() + " conversation partners");
            return ResponseEntity.ok(partners);
        } catch (RuntimeException e) {
            System.out.println("DEBUG: RuntimeException in getConversationPartners: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build(); // 404 for business logic errors
        } catch (Exception e) {
            System.out.println("DEBUG: Unexpected exception in getConversationPartners: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build(); // 500 for server errors
        }
    }

    /**
     * Get all users in the same gym (potential conversation partners)
     */
    @GetMapping("/gym-users")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<List<User>> getGymUsers() {
        try {
            List<User> gymUsers = messageService.getGymUsers();
            return ResponseEntity.ok(gymUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete conversation with another user
     * - Member deletion: Only hides for member, coach still sees it
     * - Coach deletion: Hides for both users (complete deletion)
     */
    @DeleteMapping("/conversation/{otherUserId}")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<Void> deleteConversation(@PathVariable Integer otherUserId) {
        // Input validation
        if (otherUserId == null || otherUserId <= 0) {
            System.out.println("DEBUG: Invalid otherUserId: " + otherUserId);
            return ResponseEntity.badRequest().build();
        }
        
        System.out.println("DEBUG: Attempting to delete conversation with user ID: " + otherUserId);
        
        try {
            messageService.deleteConversation(otherUserId);
            System.out.println("DEBUG: Conversation deleted successfully with user ID: " + otherUserId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            System.out.println("DEBUG: RuntimeException during deletion: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build(); // 404 if user/conversation not found
        } catch (Exception e) {
            System.out.println("DEBUG: Unexpected exception during deletion: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build(); // 500 for server errors
        }
    }
    
    /**
     * Restore a previously deleted conversation
     */
    @PostMapping("/conversation/{otherUserId}/restore")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin') or hasAuthority('Member')")
    public ResponseEntity<Void> restoreConversation(@PathVariable Integer otherUserId) {
        // Input validation
        if (otherUserId == null || otherUserId <= 0) {
            System.out.println("DEBUG: Invalid otherUserId: " + otherUserId);
            return ResponseEntity.badRequest().build();
        }
        
        System.out.println("DEBUG: Attempting to restore conversation with user ID: " + otherUserId);
        
        try {
            messageService.restoreConversation(otherUserId);
            System.out.println("DEBUG: Conversation restored successfully with user ID: " + otherUserId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            System.out.println("DEBUG: RuntimeException during restoration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.notFound().build(); // 404 if user/conversation not found
        } catch (Exception e) {
            System.out.println("DEBUG: Unexpected exception during restoration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build(); // 500 for server errors
        }
    }
    
    /**
     * DEBUG ENDPOINT - Get all messages in database for debugging
     * REMOVE IN PRODUCTION
     */
    @GetMapping("/debug/all")
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Admin')")
    public ResponseEntity<List<String>> getAllMessagesDebug() {
        try {
            List<String> debugInfo = messageService.getDebugInfo();
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            System.out.println("DEBUG: Error getting debug info: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
