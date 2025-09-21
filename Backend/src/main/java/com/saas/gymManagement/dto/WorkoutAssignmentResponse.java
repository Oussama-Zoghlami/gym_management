package com.saas.gymManagement.dto;

import com.saas.gymManagement.models.AssignmentStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class WorkoutAssignmentResponse {
    private Long id;
    private WorkoutPlanResponse workoutPlan;
    private String memberName;
    private String memberEmail;
    private String coachName;
    private AssignmentStatus status;
    private String notes;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
}
