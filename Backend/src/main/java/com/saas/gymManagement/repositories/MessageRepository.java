package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.Message;
import com.saas.gymManagement.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Find messages between two users
    @Query("SELECT m FROM Message m WHERE " +
           "((m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1)) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    // Find messages between two users with pagination
    @Query("SELECT m FROM Message m WHERE " +
           "((m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1)) " +
           "ORDER BY m.timestamp DESC")
    Page<Message> findMessagesBetweenUsers(@Param("user1") User user1, @Param("user2") User user2, Pageable pageable);
    
    // Find unread messages for a user
    @Query("SELECT m FROM Message m WHERE m.receiver = :receiver AND m.read = false ORDER BY m.timestamp DESC")
    List<Message> findUnreadMessagesForUser(@Param("receiver") User receiver);
    
    // Count unread messages for a user
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver = :receiver AND m.read = false")
    Long countUnreadMessagesForUser(@Param("receiver") User receiver);
    
    // Find messages sent by a user
    @Query("SELECT m FROM Message m WHERE m.sender = :sender ORDER BY m.timestamp DESC")
    List<Message> findMessagesSentByUser(@Param("sender") User sender);
    
    // Find messages received by a user
    @Query("SELECT m FROM Message m WHERE m.receiver = :receiver ORDER BY m.timestamp DESC")
    List<Message> findMessagesReceivedByUser(@Param("receiver") User receiver);
    
    // Find recent conversations for a user (latest message from each conversation)
    @Query("SELECT m FROM Message m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM Message m2 WHERE " +
           "(m2.sender = :user OR m2.receiver = :user) " +
           "GROUP BY CASE WHEN m2.sender = :user THEN m2.receiver ELSE m2.sender END" +
           ") ORDER BY m.timestamp DESC")
    List<Message> findRecentConversationsForUser(@Param("user") User user);
    
    // Find conversation between users with gym context
    @Query("SELECT m FROM Message m WHERE " +
           "((m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1)) " +
           "AND m.gym.id = :gymId " +
           "ORDER BY m.timestamp ASC")
    List<Message> findConversationBetweenUsers(@Param("userId1") Integer userId1, @Param("userId2") Integer userId2, @Param("gymId") Integer gymId);
    
    // Count unread messages between users
    @Query("SELECT COUNT(m) FROM Message m WHERE " +
           "m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.read = false")
    Long countUnreadMessages(@Param("senderId") Integer senderId, @Param("receiverId") Integer receiverId);
    
    // Find conversation partners for a user
    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver ELSE m.sender END " +
           "FROM Message m WHERE (m.sender.id = :userId OR m.receiver.id = :userId) " +
           "AND m.gym.id = :gymId")
    List<User> findConversationPartners(@Param("userId") Integer userId, @Param("gymId") Integer gymId);
}
