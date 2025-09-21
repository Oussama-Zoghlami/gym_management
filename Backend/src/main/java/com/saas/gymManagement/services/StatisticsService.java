package com.saas.gymManagement.services;

import com.saas.gymManagement.dto.GymStatistics;
import com.saas.gymManagement.dto.OverallStatistics;
import com.saas.gymManagement.dto.TopGymStats;
import com.saas.gymManagement.models.*;
import com.saas.gymManagement.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final GymRepository gymRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutAssignmentRepository workoutAssignmentRepository;
    private final GymRatingRepository gymRatingRepository;

    public OverallStatistics getOverallStatistics() {
        OverallStatistics stats = new OverallStatistics();
        
        // Total counts
        stats.setTotalGyms(gymRepository.count());
        stats.setTotalUsers(userRepository.count());
        stats.setTotalCoaches(userRepository.countByRole(Role.Coach));
        stats.setTotalMembers(userRepository.countByRole(Role.Member));
        stats.setTotalAdmins(userRepository.countByRole(Role.Admin));
        
        // Subscription statistics
        long activeSubscriptions = subscriptionRepository.countByStatus(SubscriptionStatus.ACTIVE);
        stats.setActiveSubscriptions(activeSubscriptions);
        
        // Calculate total revenue from active subscriptions
        List<Subscription> activeSubs = subscriptionRepository.findByStatus(SubscriptionStatus.ACTIVE);
        BigDecimal totalRevenue = activeSubs.stream()
            .map(Subscription::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalRevenue(totalRevenue);
        
        // Workout plan statistics
        stats.setTotalWorkoutPlans(workoutPlanRepository.count());
        stats.setCompletedWorkouts(workoutAssignmentRepository.countByStatus(AssignmentStatus.COMPLETED));
        
        // Recent activity (last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minus(30, ChronoUnit.DAYS);
        stats.setNewUsersLast30Days(userRepository.countByRegistrationDateAfter(thirtyDaysAgo));
        stats.setNewGymsLast30Days(gymRepository.countByCreatedAtAfter(thirtyDaysAgo));
        
        return stats;
    }

    public List<TopGymStats> getTopGymsBySubscriptions() {
        return gymRepository.findAll().stream()
            .map(gym -> {
                TopGymStats stats = new TopGymStats();
                stats.setGymId(gym.getId());
                stats.setGymName(gym.getName());
                stats.setGymCode(gym.getCode());
                
                // Count active subscriptions for this gym
                long subscriptionCount = subscriptionRepository.countByGymIdAndStatus(gym.getId(), SubscriptionStatus.ACTIVE);
                stats.setSubscriptionCount(subscriptionCount);
                
                // Calculate revenue for this gym
                List<Subscription> gymSubscriptions = subscriptionRepository.findByGymIdAndStatus(gym.getId(), SubscriptionStatus.ACTIVE);
                BigDecimal gymRevenue = gymSubscriptions.stream()
                    .map(Subscription::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                stats.setRevenue(gymRevenue);
                
                // Count coaches for this gym
                long coachCount = userRepository.countByGymIdAndRole(gym.getId(), Role.Coach);
                stats.setCoachCount(coachCount);
                
                // Count workout plans for this gym
                long workoutPlanCount = workoutPlanRepository.countByGymId(gym.getId());
                stats.setWorkoutPlanCount(workoutPlanCount);
                
                // Count completed workouts for this gym
                long completedWorkouts = workoutAssignmentRepository.countCompletedWorkoutsByGymId(gym.getId());
                stats.setCompletedWorkouts(completedWorkouts);
                
                // Get average rating
                Double avgRating = gymRatingRepository.getAverageRatingByGymId(gym.getId());
                stats.setAverageRating(avgRating != null ? avgRating : 0.0);
                
                return stats;
            })
            .sorted((a, b) -> Long.compare(b.getSubscriptionCount(), a.getSubscriptionCount()))
            .limit(10)
            .collect(Collectors.toList());
    }

    public List<TopGymStats> getTopGymsByRevenue() {
        return getTopGymsBySubscriptions().stream()
            .sorted((a, b) -> b.getRevenue().compareTo(a.getRevenue()))
            .limit(10)
            .collect(Collectors.toList());
    }

    public List<TopGymStats> getTopGymsByCoaches() {
        return getTopGymsBySubscriptions().stream()
            .sorted((a, b) -> Long.compare(b.getCoachCount(), a.getCoachCount()))
            .limit(10)
            .collect(Collectors.toList());
    }

    public List<TopGymStats> getTopGymsByWorkoutPlans() {
        return getTopGymsBySubscriptions().stream()
            .sorted((a, b) -> Long.compare(b.getWorkoutPlanCount(), a.getWorkoutPlanCount()))
            .limit(10)
            .collect(Collectors.toList());
    }

    public List<TopGymStats> getTopGymsByCompletedWorkouts() {
        return getTopGymsBySubscriptions().stream()
            .sorted((a, b) -> Long.compare(b.getCompletedWorkouts(), a.getCompletedWorkouts()))
            .limit(10)
            .collect(Collectors.toList());
    }

    public List<TopGymStats> getTopGymsByRating() {
        return getTopGymsBySubscriptions().stream()
            .filter(gym -> gym.getAverageRating() > 0)
            .sorted((a, b) -> Double.compare(b.getAverageRating(), a.getAverageRating()))
            .limit(10)
            .collect(Collectors.toList());
    }

    public GymStatistics getGymStatistics(Integer gymId) {
        GymStatistics stats = new GymStatistics();
        
        // Basic gym info
        gymRepository.findById(gymId).ifPresent(gym -> {
            stats.setGymId(gym.getId());
            stats.setGymName(gym.getName());
            stats.setGymCode(gym.getCode());
        });
        
        // User counts - use active subscribers instead of all members
        stats.setActiveSubscribers(subscriptionRepository.countByGymIdAndStatus(gymId, SubscriptionStatus.ACTIVE));
        stats.setTotalCoaches(userRepository.countByGymIdAndRole(gymId, Role.Coach));
        
        // Subscription statistics
        stats.setActiveSubscriptions(subscriptionRepository.countByGymIdAndStatus(gymId, SubscriptionStatus.ACTIVE));
        stats.setTotalSubscriptions(subscriptionRepository.countByGymId(gymId));
        
        // Revenue calculation
        List<Subscription> gymSubscriptions = subscriptionRepository.findByGymIdAndStatus(gymId, SubscriptionStatus.ACTIVE);
        BigDecimal totalRevenue = gymSubscriptions.stream()
            .map(Subscription::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.setTotalRevenue(totalRevenue);
        
        // Workout statistics
        stats.setTotalWorkoutPlans(workoutPlanRepository.countByGymId(gymId));
        stats.setCompletedWorkouts(workoutAssignmentRepository.countCompletedWorkoutsByGymId(gymId));
        stats.setPendingWorkouts(workoutAssignmentRepository.countByStatus(AssignmentStatus.ASSIGNED));
        
        // Rating
        Double avgRating = gymRatingRepository.getAverageRatingByGymId(gymId);
        stats.setAverageRating(avgRating != null ? avgRating : 0.0);
        Long ratingCount = gymRatingRepository.getCountByGymId(gymId);
        stats.setRatingCount(ratingCount != null ? ratingCount : 0L);
        
        return stats;
    }
}
