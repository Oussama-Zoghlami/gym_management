package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.Subscription;
import com.saas.gymManagement.models.SubscriptionStatus;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.models.Gym;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    
    Optional<Subscription> findByUserAndGymAndStatus(User user, Gym gym, SubscriptionStatus status);
    
    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
    
    List<Subscription> findByUserAndStatus(User user, SubscriptionStatus status);
    
    @Query("SELECT s FROM Subscription s WHERE s.user = :user AND s.status = 'ACTIVE'")
    Optional<Subscription> findActiveSubscriptionByUser(@Param("user") User user);
    
    List<Subscription> findByUserOrderByCreatedAtDesc(User user);
    
    boolean existsByUserAndGymAndStatus(User user, Gym gym, SubscriptionStatus status);
    
    // Statistics methods
    long countByStatus(SubscriptionStatus status);
    long countByGymIdAndStatus(Integer gymId, SubscriptionStatus status);
    long countByGymId(Integer gymId);
    List<Subscription> findByStatus(SubscriptionStatus status);
    List<Subscription> findByGymIdAndStatus(Integer gymId, SubscriptionStatus status);
}
