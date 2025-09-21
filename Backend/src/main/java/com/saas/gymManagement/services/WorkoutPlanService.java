package com.saas.gymManagement.services;

import com.saas.gymManagement.dto.WorkoutPlanRequest;
import com.saas.gymManagement.dto.WorkoutPlanResponse;
import com.saas.gymManagement.dto.WorkoutAssignmentResponse;
import com.saas.gymManagement.models.User;

import java.util.List;

public interface WorkoutPlanService {
    
    WorkoutPlanResponse createWorkoutPlan(Integer coachId, WorkoutPlanRequest request);
    
    List<WorkoutPlanResponse> getWorkoutPlansByCoach(Integer coachId);
    
    List<WorkoutPlanResponse> getWorkoutPlansByGym(Integer gymId);
    
    WorkoutPlanResponse getWorkoutPlanById(Long id);
    
    WorkoutPlanResponse updateWorkoutPlan(Integer coachId, Long id, WorkoutPlanRequest request);
    
    void deleteWorkoutPlan(Integer coachId, Long id);
    
    WorkoutAssignmentResponse assignWorkoutPlanToMember(Integer coachId, Long workoutPlanId, Integer memberId, String notes);
    
    List<WorkoutAssignmentResponse> getAssignmentsByCoach(Integer coachId);
    
    List<WorkoutAssignmentResponse> getAssignmentsByMember(Integer memberId);
    
    WorkoutAssignmentResponse updateAssignmentStatus(Long assignmentId, String status, String notes);
    
    List<User> getSubscribedMembersByCoach(Integer coachId);
}
