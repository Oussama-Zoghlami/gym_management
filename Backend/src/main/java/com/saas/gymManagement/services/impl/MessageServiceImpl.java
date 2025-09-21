package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.dto.MessageRequest;
import com.saas.gymManagement.dto.MessageResponse;
import com.saas.gymManagement.models.Message;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.repositories.MessageRepository;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.repositories.ConversationDeletionRepository;
import com.saas.gymManagement.models.ConversationDeletion;
import com.saas.gymManagement.services.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationDeletionRepository conversationDeletionRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            Optional<User> user = userRepository.findByEmail(userDetails.getUsername());
            return user.orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(MessageRequest messageRequest) {
        System.out.println("DEBUG: sendMessage called with receiverId: " + messageRequest.getReceiverId());
        System.out.println("DEBUG: sendMessage content: " + messageRequest.getContent());
        
        try {
            User sender = getCurrentUser();
            System.out.println("DEBUG: Sender: " + sender.getId() + " (" + sender.getRole() + ")");
            
            User receiver = userRepository.findById(messageRequest.getReceiverId())
                    .orElseThrow(() -> new RuntimeException("Receiver not found with ID: " + messageRequest.getReceiverId()));
            System.out.println("DEBUG: Receiver: " + receiver.getId() + " (" + receiver.getRole() + ")");

            // Get the gym for messaging - could be assigned gym or subscribed gym
            Gym gym = getGymForUser(sender);
            if (gym == null) {
                System.out.println("DEBUG: Sender is not associated with any gym");
                throw new RuntimeException("Sender is not associated with any gym");
            }
            System.out.println("DEBUG: Sender's gym: " + gym.getId());
            
            // Validate that receiver is also associated with the same gym
            Gym receiverGym = getGymForUser(receiver);
            if (receiverGym == null) {
                System.out.println("DEBUG: Receiver is not associated with any gym");
                throw new RuntimeException("Receiver is not associated with any gym");
            }
            System.out.println("DEBUG: Receiver's gym: " + receiverGym.getId());
            
            if (!receiverGym.getId().equals(gym.getId())) {
                System.out.println("DEBUG: Users are in different gyms - sender: " + gym.getId() + ", receiver: " + receiverGym.getId());
                throw new RuntimeException("Cannot send message to user in different gym");
            }

            // Check if sender had previously deleted this conversation and restore it
            Optional<ConversationDeletion> deletion = conversationDeletionRepository
                    .findByUserAndOtherUser(gym.getId(), sender.getId(), receiver.getId());
            
            if (deletion.isPresent()) {
                System.out.println("DEBUG: Sender had deleted this conversation, but is trying to send a message - restoring conversation");
                conversationDeletionRepository.delete(deletion.get());
                System.out.println("DEBUG: Conversation deletion record removed, conversation restored");
            }

            Message message = new Message();
            message.setSender(sender);
            message.setReceiver(receiver);
            message.setContent(messageRequest.getContent());
            message.setGym(gym);
            message.setRead(false);

            System.out.println("DEBUG: Attempting to save message...");
            Message savedMessage = messageRepository.save(message);
            System.out.println("DEBUG: Message saved successfully with ID: " + savedMessage.getId());
            
            MessageResponse response = convertToMessageResponse(savedMessage);
            System.out.println("DEBUG: MessageResponse created successfully");
            return response;
        } catch (Exception e) {
            System.out.println("DEBUG: Error in sendMessage: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to send message: " + e.getMessage());
        }
    }


    @Override
    public List<MessageResponse> getConversation(Integer otherUserId) {
        System.out.println("DEBUG: getConversation called with otherUserId: " + otherUserId);
        
        try {
            User currentUser = getCurrentUser();
            System.out.println("DEBUG: Current user: " + currentUser.getId() + " (" + currentUser.getRole() + ")");
            
            Gym gym = getGymForUser(currentUser);
            if (gym == null) {
                System.out.println("DEBUG: Current user is not associated with any gym");
                throw new RuntimeException("User is not associated with any gym");
            }
            System.out.println("DEBUG: Current user's gym: " + gym.getId());

            // Get other user to check their gym too
            User otherUser = userRepository.findById(otherUserId)
                    .orElseThrow(() -> new RuntimeException("Other user not found with ID: " + otherUserId));
            System.out.println("DEBUG: Other user: " + otherUser.getId() + " (" + otherUser.getRole() + ")");
            
            Gym otherUserGym = getGymForUser(otherUser);
            if (otherUserGym != null) {
                System.out.println("DEBUG: Other user's gym: " + otherUserGym.getId());
            } else {
                System.out.println("DEBUG: Other user has no gym association");
            }

            // Check if current user has deleted this conversation
            Optional<ConversationDeletion> deletion = conversationDeletionRepository
                    .findByUserAndOtherUser(gym.getId(), currentUser.getId(), otherUserId);
            
            if (deletion.isPresent()) {
                System.out.println("DEBUG: Conversation deleted by current user, returning empty list");
                return new ArrayList<>();
            }

            System.out.println("DEBUG: Searching for messages in gym " + gym.getId() + " between users " + currentUser.getId() + " and " + otherUserId);
            List<Message> messages = messageRepository.findConversationBetweenUsers(
                    currentUser.getId(), otherUserId, gym.getId());
            
            System.out.println("DEBUG: Found " + messages.size() + " messages in conversation");
            for (Message msg : messages) {
                System.out.println("DEBUG: Message ID " + msg.getId() + ": from " + msg.getSender().getId() + 
                                 " to " + msg.getReceiver().getId() + " in gym " + msg.getGym().getId() + 
                                 " - '" + msg.getContent().substring(0, Math.min(50, msg.getContent().length())) + "'");
            }
            
            List<MessageResponse> responses = messages.stream()
                    .map(this::convertToMessageResponse)
                    .collect(Collectors.toList());
            
            System.out.println("DEBUG: Returning " + responses.size() + " message responses");
            return responses;
            
        } catch (Exception e) {
            System.out.println("DEBUG: Error in getConversation: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get conversation: " + e.getMessage());
        }
    }

    @Override
    public MessageResponse markMessageAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        User currentUser = getCurrentUser();
        
        // Only allow the receiver to mark message as read
        if (!message.getReceiver().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only mark your own received messages as read");
        }

        message.setRead(true);
        Message savedMessage = messageRepository.save(message);
        return convertToMessageResponse(savedMessage);
    }

    @Override
    public Long getUnreadMessageCount() {
        User currentUser = getCurrentUser();
        Gym gym = getGymForUser(currentUser);
        
        if (gym == null) {
            return 0L;
        }

        return messageRepository.countUnreadMessagesForUser(currentUser);
    }

    @Override
    public List<User> getConversationPartners() {
        System.out.println("DEBUG: getConversationPartners called");
        
        try {
            User currentUser = getCurrentUser();
            System.out.println("DEBUG: Current user: " + currentUser.getId() + " (" + currentUser.getRole() + ")");
            
            Gym gym = getGymForUser(currentUser);
            if (gym == null) {
                System.out.println("DEBUG: Current user is not associated with any gym");
                throw new RuntimeException("User is not associated with any gym");
            }
            System.out.println("DEBUG: User's gym: " + gym.getId());

            List<User> allPartners = messageRepository.findConversationPartners(gym.getId(), currentUser.getId());
            System.out.println("DEBUG: Found " + allPartners.size() + " conversation partners before filtering");
            
            // Filter out partners where current user has deleted the conversation
            List<User> filteredPartners = new ArrayList<>();
            for (User partner : allPartners) {
                try {
                    Optional<ConversationDeletion> deletion = conversationDeletionRepository
                            .findByUserAndOtherUser(gym.getId(), currentUser.getId(), partner.getId());
                    
                    if (deletion.isEmpty()) {
                        filteredPartners.add(partner);
                        System.out.println("DEBUG: Including partner: " + partner.getId() + " (not deleted)");
                    } else {
                        System.out.println("DEBUG: Excluding partner: " + partner.getId() + " (deleted by current user)");
                    }
                } catch (Exception e) {
                    System.out.println("DEBUG: Error checking deletion status for partner " + partner.getId() + ": " + e.getMessage());
                    // In case of error, include the partner (fail-safe approach)
                    filteredPartners.add(partner);
                }
            }
            
            System.out.println("DEBUG: Returning " + filteredPartners.size() + " conversation partners after filtering");
            return filteredPartners;
            
        } catch (Exception e) {
            System.out.println("DEBUG: Error in getConversationPartners: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to get conversation partners: " + e.getMessage());
        }
    }

    @Override
    public List<User> getGymUsers() {
        User currentUser = getCurrentUser();
        Gym gym = getGymForUser(currentUser);
        
        if (gym == null) {
            throw new RuntimeException("User is not associated with any gym");
        }

        List<User> availableUsers = new ArrayList<>();

        // If current user is a MEMBER, show only coaches and admins of the gym
        if (currentUser.getRole() == Role.Member || currentUser.getRole() == Role.User) {
            // Get coaches and admins assigned to this gym
            List<User> gymStaff = userRepository.findByGym_Id(gym.getId());
            availableUsers.addAll(gymStaff.stream()
                .filter(user -> user.getRole() == Role.Coach || user.getRole() == Role.Admin)
                .collect(Collectors.toList()));
        } else {
            // If current user is COACH or ADMIN, show all gym users (coaches, admins, and subscribed members)
            List<User> gymUsers = userRepository.findByGym_Id(gym.getId());
            List<User> subscribedMembers = userRepository.findBySubscribedGym_Id(gym.getId());
            
            availableUsers.addAll(gymUsers);
            availableUsers.addAll(subscribedMembers);
        }
        
        // Remove current user and duplicates
        availableUsers.removeIf(user -> user.getId().equals(currentUser.getId()));
        return availableUsers.stream().distinct().collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void restoreConversation(Integer otherUserId) {
        System.out.println("DEBUG: restoreConversation called with otherUserId: " + otherUserId);
        
        // Input validation
        if (otherUserId == null || otherUserId <= 0) {
            System.out.println("DEBUG: Invalid otherUserId parameter: " + otherUserId);
            throw new RuntimeException("Invalid user ID provided");
        }
        
        User currentUser = getCurrentUser();
        System.out.println("DEBUG: Current user: " + currentUser.getId() + " (" + currentUser.getRole() + ")");
        
        Gym gym = getGymForUser(currentUser);
        if (gym == null) {
            System.out.println("DEBUG: Current user is not associated with any gym");
            throw new RuntimeException("User is not associated with any gym");
        }
        System.out.println("DEBUG: User's gym: " + gym.getId());

        // Check if deletion record exists and remove it
        Optional<ConversationDeletion> deletion = conversationDeletionRepository
                .findByUserAndOtherUser(gym.getId(), currentUser.getId(), otherUserId);
        
        if (deletion.isPresent()) {
            System.out.println("DEBUG: Found deletion record, removing it to restore conversation");
            conversationDeletionRepository.delete(deletion.get());
            System.out.println("DEBUG: Conversation restored successfully");
        } else {
            System.out.println("DEBUG: No deletion record found, conversation is already visible");
        }
    }

    @Override
    @Transactional
    public void deleteConversation(Integer otherUserId) {
        System.out.println("DEBUG: deleteConversation called with otherUserId: " + otherUserId);
        
        // Input validation
        if (otherUserId == null || otherUserId <= 0) {
            System.out.println("DEBUG: Invalid otherUserId parameter: " + otherUserId);
            throw new RuntimeException("Invalid user ID provided");
        }
        
        User currentUser = getCurrentUser();
        System.out.println("DEBUG: Current user: " + currentUser.getId() + " (" + currentUser.getRole() + ")");
        
        Gym gym = getGymForUser(currentUser);
        if (gym == null) {
            System.out.println("DEBUG: Current user is not associated with any gym");
            throw new RuntimeException("User is not associated with any gym");
        }
        System.out.println("DEBUG: User's gym: " + gym.getId());

        // Validate that the other user exists
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> {
                    System.out.println("DEBUG: Other user not found with ID: " + otherUserId);
                    return new RuntimeException("User with ID " + otherUserId + " not found");
                });
        System.out.println("DEBUG: Other user found: " + otherUser.getId() + " (" + otherUser.getRole() + ")");

        // Validate that both users are in the same gym context
        Gym otherUserGym = getGymForUser(otherUser);
        if (otherUserGym == null || !otherUserGym.getId().equals(gym.getId())) {
            System.out.println("DEBUG: Users are not in the same gym. Current user gym: " + gym.getId() + 
                             ", Other user gym: " + (otherUserGym != null ? otherUserGym.getId() : "null"));
            throw new RuntimeException("Cannot delete conversation with user from different gym");
        }

        // Prevent self-deletion
        if (currentUser.getId().equals(otherUserId)) {
            System.out.println("DEBUG: User trying to delete conversation with themselves");
            throw new RuntimeException("Cannot delete conversation with yourself");
        }

        try {
            // Check user role to determine deletion behavior
            if (currentUser.getRole() == Role.Member || currentUser.getRole() == Role.User) {
                System.out.println("DEBUG: Member deletion - hiding conversation for member only");
                
                // Check if deletion record already exists
                Optional<ConversationDeletion> existingDeletion = conversationDeletionRepository
                        .findByUserAndOtherUser(gym.getId(), currentUser.getId(), otherUserId);
                
                if (existingDeletion.isPresent()) {
                    System.out.println("DEBUG: Conversation already deleted by this member");
                    return; // Already deleted by this user
                }
                
                // Member deletion: Only hide conversation for the member
                ConversationDeletion deletion = new ConversationDeletion();
                deletion.setUser(currentUser);
                deletion.setOtherUser(otherUser);
                deletion.setGym(gym);
                
                conversationDeletionRepository.save(deletion);
                System.out.println("DEBUG: Member deletion record saved successfully");
                
            } else {
                System.out.println("DEBUG: Coach/Admin deletion - hiding conversation for both users");
                
                // Coach/Admin deletion: Hide conversation for both users (complete deletion)
                // First, clear any existing deletion records between these users
                conversationDeletionRepository.deleteAllBetweenUsers(gym.getId(), currentUser.getId(), otherUserId);
                
                // Add deletion records for both users
                ConversationDeletion deletion1 = new ConversationDeletion();
                deletion1.setUser(currentUser);
                deletion1.setOtherUser(otherUser);
                deletion1.setGym(gym);
                
                ConversationDeletion deletion2 = new ConversationDeletion();
                deletion2.setUser(otherUser);
                deletion2.setOtherUser(currentUser);
                deletion2.setGym(gym);
                
                conversationDeletionRepository.save(deletion1);
                conversationDeletionRepository.save(deletion2);
                System.out.println("DEBUG: Coach deletion records saved successfully for both users");
            }
        } catch (Exception e) {
            System.out.println("DEBUG: Database error during conversation deletion: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete conversation: " + e.getMessage());
        }
    }

    private MessageResponse convertToMessageResponse(Message message) {
        MessageResponse response = new MessageResponse();
        response.setId(message.getId());
        response.setSenderId(message.getSender().getId());
        response.setSenderName(message.getSender().getFirstname() + " " + message.getSender().getLastname());
        response.setReceiverId(message.getReceiver().getId());
        response.setReceiverName(message.getReceiver().getFirstname() + " " + message.getReceiver().getLastname());
        response.setContent(message.getContent());
        response.setTimestamp(message.getTimestamp());
        response.setRead(message.isRead());
        return response;
    }

    @Override
    public List<String> getDebugInfo() {
        List<String> debugInfo = new ArrayList<>();
        
        try {
            // Get all messages from database
            List<Message> allMessages = messageRepository.findAll();
            debugInfo.add("=== ALL MESSAGES IN DATABASE ===");
            debugInfo.add("Total messages: " + allMessages.size());
            
            for (Message msg : allMessages) {
                String info = String.format("ID: %d | From: %d (%s) | To: %d (%s) | Gym: %d | Content: '%.50s' | Time: %s",
                    msg.getId(),
                    msg.getSender().getId(), msg.getSender().getRole(),
                    msg.getReceiver().getId(), msg.getReceiver().getRole(),
                    msg.getGym().getId(),
                    msg.getContent(),
                    msg.getTimestamp()
                );
                debugInfo.add(info);
            }
            
            // Get all users with their gym associations
            debugInfo.add("=== USER GYM ASSOCIATIONS ===");
            List<User> allUsers = userRepository.findAll();
            for (User user : allUsers) {
                String gymInfo = "None";
                if (user.getGym() != null) {
                    gymInfo = "Assigned: " + user.getGym().getId();
                } else if (user.getSubscribedGym() != null) {
                    gymInfo = "Subscribed: " + user.getSubscribedGym().getId();
                }
                
                String userInfo = String.format("User ID: %d | Role: %s | Name: %s %s | Gym: %s",
                    user.getId(),
                    user.getRole(),
                    user.getFirstname(), user.getLastname(),
                    gymInfo
                );
                debugInfo.add(userInfo);
            }
            
        } catch (Exception e) {
            debugInfo.add("ERROR getting debug info: " + e.getMessage());
        }
        
        return debugInfo;
    }

    /**
     * Get the appropriate gym for a user - either assigned gym or subscribed gym
     */
    private Gym getGymForUser(User user) {
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
}
