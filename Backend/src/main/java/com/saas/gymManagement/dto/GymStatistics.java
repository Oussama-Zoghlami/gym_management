package com.saas.gymManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GymStatistics {
    private Integer gymId;
    private String gymName;
    private String gymCode;
    private long activeSubscribers;
    private long totalCoaches;
    private long activeSubscriptions;
    private long totalSubscriptions;
    private BigDecimal totalRevenue;
    private long totalWorkoutPlans;
    private long completedWorkouts;
    private long pendingWorkouts;
    private double averageRating;
    private long ratingCount;
}
