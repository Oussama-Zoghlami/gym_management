package com.saas.gymManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopGymStats {
    private Integer gymId;
    private String gymName;
    private String gymCode;
    private long subscriptionCount;
    private BigDecimal revenue;
    private long coachCount;
    private long workoutPlanCount;
    private long completedWorkouts;
    private double averageRating;
}
