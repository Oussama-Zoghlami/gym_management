package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.MessageResponse;
import com.saas.gymManagement.models.Message;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.repositories.MessageRepository;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.services.MessageService;
import com.saas.gymManagement.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class WebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessageRepository messageRepository;




    /**
     * Handle incoming messages from WebSocket clients
     * This method receives messages sent to "/app/chat.sendMessage"
     */
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload WebSocketMessageRequest messageRequest, Principal principal) {
        System.out.println("🚀 WebSocket sendMessage method called!");
        System.out.println("🚀 Message request: " + messageRequest);
        System.out.println("🚀 Principal: " + (principal != null ? principal.getName() : "null"));
        System.out.println("🚀 Raw message content: " + messageRequest.getContent());
        System.out.println("🚀 Receiver ID: " + messageRequest.getReceiverId());
        try {
            System.out.println("DEBUG: WebSocket sendMessage called with receiverId: " + messageRequest.getReceiverId());
            System.out.println("DEBUG: Principal: " + (principal != null ? principal.getName() : "null"));
            
            // Debug SecurityContext
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            System.out.println("DEBUG: SecurityContext authentication: " + (auth != null ? auth.getName() : "null"));
            System.out.println("DEBUG: SecurityContext principal type: " + (auth != null && auth.getPrincipal() != null ? auth.getPrincipal().getClass().getSimpleName() : "null"));
            
            // Get current user from Principal instead of relying on SecurityContext
            User currentUser = null;
            if (principal != null) {
                currentUser = userService.findByEmail(principal.getName());
                System.out.println("DEBUG: Found current user from Principal: " + (currentUser != null ? currentUser.getId() : "null"));
            }
            
            // Fallback: try to get user from SecurityContext if Principal fails
            if (currentUser == null) {
                System.out.println("DEBUG: Principal failed, trying SecurityContext...");
                if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
                    currentUser = userService.findByEmail(userDetails.getUsername());
                    System.out.println("DEBUG: Found current user from SecurityContext: " + (currentUser != null ? currentUser.getId() : "null"));
                }
            }
            
            if (currentUser == null) {
                System.out.println("DEBUG: No current user found, cannot send message");
                return;
            }
            
            // Create proper MessageRequest with sender ID
            com.saas.gymManagement.dto.MessageRequest properRequest = new com.saas.gymManagement.dto.MessageRequest();
            properRequest.setReceiverId(messageRequest.getReceiverId());
            properRequest.setContent(messageRequest.getContent());
            
            // Manually create MessageResponse instead of using the service
            User receiver = userRepository.findById(messageRequest.getReceiverId()).orElse(null);
            if (receiver == null) {
                System.out.println("DEBUG: Receiver not found with ID: " + messageRequest.getReceiverId());
                return;
            }
            
            // Get the gym for the current user (required for Message entity)
            // Use the same logic as MessageServiceImpl to handle both assigned and subscribed gyms
            com.saas.gymManagement.models.Gym userGym = getGymForUser(currentUser);
            System.out.println("DEBUG: Current user gym: " + (userGym != null ? userGym.getId() + " (" + userGym.getName() + ")" : "null"));
            
            // If user has no gym association, cannot save message
            if (userGym == null) {
                System.out.println("DEBUG: Current user has no gym association (neither assigned nor subscribed), cannot save message");
                return;
            }
            
            // Save message to database
            Message message = new Message();
            message.setSender(currentUser);
            message.setReceiver(receiver);
            message.setContent(messageRequest.getContent());
            message.setTimestamp(java.time.LocalDateTime.now());
            message.setRead(false);
            message.setGym(userGym); // Set the required gym field
            
            System.out.println("DEBUG: About to save message to database:");
            System.out.println("DEBUG: - Sender ID: " + currentUser.getId());
            System.out.println("DEBUG: - Receiver ID: " + receiver.getId());
            System.out.println("DEBUG: - Content: " + messageRequest.getContent());
            System.out.println("DEBUG: - Gym ID: " + userGym.getId());
            System.out.println("DEBUG: - Timestamp: " + message.getTimestamp());
            
            Message savedMessage;
            try {
                savedMessage = messageRepository.save(message);
                System.out.println("DEBUG: ✅ Message saved to database successfully!");
                System.out.println("DEBUG: ✅ Saved message ID: " + savedMessage.getId());
                System.out.println("DEBUG: ✅ Saved message timestamp: " + savedMessage.getTimestamp());
            } catch (Exception e) {
                System.out.println("DEBUG: ❌ Error saving message to database: " + e.getMessage());
                System.out.println("DEBUG: ❌ Exception type: " + e.getClass().getSimpleName());
                e.printStackTrace();
                return;
            }
            
            // Create message response manually
            MessageResponse messageResponse = new MessageResponse();
            messageResponse.setId(savedMessage.getId());
            messageResponse.setSenderId(currentUser.getId());
            messageResponse.setReceiverId(messageRequest.getReceiverId());
            messageResponse.setContent(messageRequest.getContent());
            messageResponse.setTimestamp(savedMessage.getTimestamp());
            messageResponse.setSenderName(currentUser.getFirstname() + " " + currentUser.getLastname());
            messageResponse.setReceiverName(receiver.getFirstname() + " " + receiver.getLastname());
            messageResponse.setRead(false);
            
            System.out.println("DEBUG: MessageResponse created: " + messageResponse.getId() + " from " + messageResponse.getSenderId() + " to " + messageResponse.getReceiverId());
            
            // Send the message to the specific receiver
            String receiverDestination = "/queue/messages/" + messageRequest.getReceiverId();
            System.out.println("DEBUG: Sending message to receiver destination: " + receiverDestination);
            System.out.println("DEBUG: Message content: " + messageResponse.getContent());
            System.out.println("DEBUG: Message sender: " + messageResponse.getSenderId() + " (" + messageResponse.getSenderName() + ")");
            System.out.println("DEBUG: Message receiver: " + messageResponse.getReceiverId() + " (" + messageResponse.getReceiverName() + ")");
            
            // Send to receiver
            try {
                messagingTemplate.convertAndSend(receiverDestination, messageResponse);
                System.out.println("DEBUG: ✅ Message sent to receiver destination: " + receiverDestination);
                System.out.println("DEBUG: ✅ Message content sent: " + messageResponse.getContent());
                System.out.println("DEBUG: ✅ Message ID sent: " + messageResponse.getId());
            } catch (Exception e) {
                System.out.println("DEBUG: ❌ Error sending message to receiver: " + e.getMessage());
                e.printStackTrace();
            }
            
            // Also send to sender for confirmation (only if sender and receiver are different)
            if (!messageResponse.getSenderId().equals(messageResponse.getReceiverId())) {
                String senderDestination = "/queue/messages/" + messageResponse.getSenderId();
                System.out.println("DEBUG: Sending message to sender destination: " + senderDestination);
                try {
                    messagingTemplate.convertAndSend(senderDestination, messageResponse);
                    System.out.println("DEBUG: ✅ Message sent to sender destination: " + senderDestination);
                } catch (Exception e) {
                    System.out.println("DEBUG: ❌ Error sending message to sender: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("DEBUG: Skipping sender confirmation (same user)");
            }
            
        } catch (Exception e) {
            System.out.println("DEBUG: Error sending message via WebSocket: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle user joining a conversation
     * This method receives messages sent to "/app/chat.addUser"
     */
    @MessageMapping("/chat.addUser")
    public void addUser(@Payload String userId, SimpMessageHeaderAccessor headerAccessor) {
        // Add user to the session
        headerAccessor.getSessionAttributes().put("userId", userId);
        
        // Notify that user joined
        messagingTemplate.convertAndSend("/topic/public", 
            "User " + userId + " joined the chat");
        
        System.out.println("DEBUG: User " + userId + " joined the chat");
    }

    /**
     * Handle typing indicators
     * This method receives messages sent to "/app/chat.typing"
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingMessage typingMessage, Principal principal) {
        try {
            System.out.println("DEBUG: WebSocket typing indicator from user to: " + typingMessage.getReceiverId());
            
            // Get current user from security context (same as MessageService)
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
                User currentUser = userService.findByEmail(userDetails.getUsername());
                
                if (currentUser != null) {
                    // Send typing indicator to the conversation partner
                    String destination = "/queue/typing/" + typingMessage.getReceiverId();
                    TypingResponse typingResponse = new TypingResponse(
                        currentUser.getId(), 
                        currentUser.getFirstname() + " " + currentUser.getLastname(),
                        typingMessage.isTyping()
                    );
                    messagingTemplate.convertAndSend(destination, typingResponse);
                    System.out.println("DEBUG: Typing indicator sent to: " + destination);
                }
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Error handling typing indicator: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Handle message read status updates
     * This method receives messages sent to "/app/chat.markRead"
     */
    @MessageMapping("/chat.markRead")
    public void markMessageAsRead(@Payload Long messageId, Principal principal) {
        try {
            System.out.println("DEBUG: WebSocket markMessageAsRead called for messageId: " + messageId);
            System.out.println("DEBUG: Principal: " + (principal != null ? principal.getName() : "null"));
            
            // Get current user from Principal instead of relying on SecurityContext
            User currentUser = null;
            if (principal != null) {
                currentUser = userService.findByEmail(principal.getName());
                System.out.println("DEBUG: Found current user from Principal: " + (currentUser != null ? currentUser.getId() : "null"));
            }
            
            if (currentUser == null) {
                System.out.println("DEBUG: No current user found, cannot mark message as read");
                return;
            }
            
            // Manually mark message as read instead of using the service
            Message message = messageRepository.findById(messageId).orElse(null);
            if (message == null) {
                System.out.println("DEBUG: Message not found with ID: " + messageId);
                return;
            }
            
            // Check if current user is the receiver
            if (!message.getReceiver().getId().equals(currentUser.getId())) {
                System.out.println("DEBUG: Current user is not the receiver of this message");
                return;
            }
            
            // Mark as read
            message.setRead(true);
            messageRepository.save(message);
            System.out.println("DEBUG: Message marked as read successfully");
            
            // Create message response
            MessageResponse messageResponse = new MessageResponse();
            messageResponse.setId(message.getId());
            messageResponse.setSenderId(message.getSender().getId());
            messageResponse.setReceiverId(message.getReceiver().getId());
            messageResponse.setContent(message.getContent());
            messageResponse.setTimestamp(message.getTimestamp());
            messageResponse.setSenderName(message.getSender().getFirstname() + " " + message.getSender().getLastname());
            messageResponse.setReceiverName(message.getReceiver().getFirstname() + " " + message.getReceiver().getLastname());
            messageResponse.setRead(true);
            
            // Notify the sender that their message was read
            String senderDestination = "/queue/read/" + messageResponse.getSenderId();
            messagingTemplate.convertAndSend(senderDestination, messageResponse);
            System.out.println("DEBUG: Read status sent to sender: " + senderDestination);
            
        } catch (Exception e) {
            System.out.println("DEBUG: Error marking message as read: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Get the appropriate gym for a user - either assigned gym or subscribed gym
     * This method replicates the logic from MessageServiceImpl
     */
    private com.saas.gymManagement.models.Gym getGymForUser(User user) {
        System.out.println("DEBUG: getGymForUser called for user " + user.getId() + " (" + user.getRole() + ")");
        
        // For coaches and admins, use assigned gym
        if (user.getGym() != null) {
            System.out.println("DEBUG: User has assigned gym: " + user.getGym().getId());
            return user.getGym();
        }
        
        // For members, use subscribed gym
        if (user.getSubscribedGym() != null) {
            System.out.println("DEBUG: User has subscribed gym: " + user.getSubscribedGym().getId());
            return user.getSubscribedGym();
        }
        
        System.out.println("DEBUG: User has no gym association (neither assigned nor subscribed)");
        return null;
    }

    // Inner classes for WebSocket message types
    public static class WebSocketMessageRequest {
        private Integer receiverId;
        private String content;

        // Getters and setters
        public Integer getReceiverId() { return receiverId; }
        public void setReceiverId(Integer receiverId) { this.receiverId = receiverId; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public static class TypingMessage {
        private Integer receiverId;
        private boolean typing;

        // Getters and setters
        public Integer getReceiverId() { return receiverId; }
        public void setReceiverId(Integer receiverId) { this.receiverId = receiverId; }
        public boolean isTyping() { return typing; }
        public void setTyping(boolean typing) { this.typing = typing; }
    }

    public static class TypingResponse {
        private Integer userId;
        private String userName;
        private boolean typing;

        public TypingResponse(Integer userId, String userName, boolean typing) {
            this.userId = userId;
            this.userName = userName;
            this.typing = typing;
        }

        // Getters and setters
        public Integer getUserId() { return userId; }
        public void setUserId(Integer userId) { this.userId = userId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public boolean isTyping() { return typing; }
        public void setTyping(boolean typing) { this.typing = typing; }
    }

}
