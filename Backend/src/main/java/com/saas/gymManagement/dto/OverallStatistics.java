package com.saas.gymManagement.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Overall platform statistics")
public class OverallStatistics {
    @Schema(description = "Total number of gyms in the system", example = "25")
    private long totalGyms;
    
    @Schema(description = "Total number of users across all roles", example = "150")
    private long totalUsers;
    
    @Schema(description = "Total number of coaches", example = "45")
    private long totalCoaches;
    
    @Schema(description = "Total number of members", example = "100")
    private long totalMembers;
    
    @Schema(description = "Total number of admins", example = "5")
    private long totalAdmins;
    
    @Schema(description = "Number of active subscriptions", example = "80")
    private long activeSubscriptions;
    
    @Schema(description = "Total revenue from all active subscriptions", example = "3200.00")
    private BigDecimal totalRevenue;
    
    @Schema(description = "Total number of workout plans created", example = "200")
    private long totalWorkoutPlans;
    
    @Schema(description = "Total number of completed workouts", example = "1500")
    private long completedWorkouts;
    
    @Schema(description = "Number of new users registered in the last 30 days", example = "15")
    private long newUsersLast30Days;
    
    @Schema(description = "Number of new gyms created in the last 30 days", example = "3")
    private long newGymsLast30Days;
}
