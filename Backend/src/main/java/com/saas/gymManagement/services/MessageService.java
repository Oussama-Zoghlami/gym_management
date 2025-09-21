package com.saas.gymManagement.services;

import com.saas.gymManagement.dto.MessageRequest;
import com.saas.gymManagement.dto.MessageResponse;
import com.saas.gymManagement.models.Message;

import java.util.List;

public interface MessageService {
    
    /**
     * Send a message from authenticated user to another user
     */
    MessageResponse sendMessage(MessageRequest messageRequest);
    
    /**
     * Get conversation between current user and another user (private conversations only)
     */
    List<MessageResponse> getConversation(Integer otherUserId);
    
    /**
     * Mark a message as read
     */
    MessageResponse markMessageAsRead(Long messageId);
    
    /**
     * Get unread message count for current user
     */
    Long getUnreadMessageCount();
    
    /**
     * Get all users that the current user has conversations with
     */
    List<com.saas.gymManagement.models.User> getConversationPartners();
    
    /**
     * Get all users in the same gym as the current user
     */
    List<com.saas.gymManagement.models.User> getGymUsers();
    
    /**
     * Delete conversation between current user and another user
     * - If member deletes: only member can't see it, coach still sees it
     * - If coach deletes: both member and coach can't see it (fully deleted)
     */
    void deleteConversation(Integer otherUserId);
    
    /**
     * Restore a previously deleted conversation for the current user
     */
    void restoreConversation(Integer otherUserId);
    
    /**
     * DEBUG METHOD - Get debug information about messages
     * REMOVE IN PRODUCTION
     */
    List<String> getDebugInfo();
}
