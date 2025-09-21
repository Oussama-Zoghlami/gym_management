package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.ConversationDeletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface ConversationDeletionRepository extends JpaRepository<ConversationDeletion, Long> {

    /**
     * Check if a user has deleted a conversation with another user
     */
    @Query("SELECT cd FROM ConversationDeletion cd WHERE cd.gym.id = :gymId AND " +
           "cd.user.id = :userId AND cd.otherUser.id = :otherUserId")
    Optional<ConversationDeletion> findByUserAndOtherUser(@Param("gymId") Integer gymId,
                                                          @Param("userId") Integer userId,
                                                          @Param("otherUserId") Integer otherUserId);

    /**
     * Delete conversation deletion record (restore conversation for user)
     */
    void deleteByGym_IdAndUser_IdAndOtherUser_Id(Integer gymId, Integer userId, Integer otherUserId);
    
    /**
     * Delete all conversation deletions between two users (when coach deletes - full deletion)
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM ConversationDeletion cd WHERE cd.gym.id = :gymId AND " +
           "((cd.user.id = :user1Id AND cd.otherUser.id = :user2Id) OR " +
           "(cd.user.id = :user2Id AND cd.otherUser.id = :user1Id))")
    void deleteAllBetweenUsers(@Param("gymId") Integer gymId,
                               @Param("user1Id") Integer user1Id,
                               @Param("user2Id") Integer user2Id);
}
