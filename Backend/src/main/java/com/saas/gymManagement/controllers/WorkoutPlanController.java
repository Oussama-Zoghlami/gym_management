package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.WorkoutPlanRequest;
import com.saas.gymManagement.dto.WorkoutPlanResponse;
import com.saas.gymManagement.dto.WorkoutAssignmentResponse;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.services.WorkoutPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workout-plans")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class WorkoutPlanController {
    
    private final WorkoutPlanService workoutPlanService;
    
    private Integer getCurrentUserId(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return user.getId();
    }
    
    // Coach endpoints
    @PreAuthorize("hasAuthority('Coach')")
    @PostMapping
    public ResponseEntity<WorkoutPlanResponse> createWorkoutPlan(
            @RequestBody WorkoutPlanRequest request,
            Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        WorkoutPlanResponse response = workoutPlanService.createWorkoutPlan(coachId, request);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @GetMapping("/my-plans")
    public ResponseEntity<List<WorkoutPlanResponse>> getMyWorkoutPlans(Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        List<WorkoutPlanResponse> plans = workoutPlanService.getWorkoutPlansByCoach(coachId);
        return ResponseEntity.ok(plans);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @GetMapping("/assignments")
    public ResponseEntity<List<WorkoutAssignmentResponse>> getMyAssignments(Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        List<WorkoutAssignmentResponse> assignments = workoutPlanService.getAssignmentsByCoach(coachId);
        return ResponseEntity.ok(assignments);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @PostMapping("/{workoutPlanId}/assign")
    public ResponseEntity<WorkoutAssignmentResponse> assignWorkoutPlan(
            @PathVariable Long workoutPlanId,
            @RequestParam Integer memberId,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        WorkoutAssignmentResponse response = workoutPlanService.assignWorkoutPlanToMember(coachId, workoutPlanId, memberId, notes);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @PutMapping("/assignments/{assignmentId}/status")
    public ResponseEntity<WorkoutAssignmentResponse> updateAssignmentStatus(
            @PathVariable Long assignmentId,
            @RequestParam String status,
            @RequestParam(required = false) String notes,
            Authentication authentication) {
        WorkoutAssignmentResponse response = workoutPlanService.updateAssignmentStatus(assignmentId, status, notes);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @GetMapping("/subscribed-members")
    public ResponseEntity<List<User>> getSubscribedMembers(Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        List<User> members = workoutPlanService.getSubscribedMembersByCoach(coachId);
        return ResponseEntity.ok(members);
    }
    
    // Member endpoints
    @PreAuthorize("hasAuthority('Member')")
    @GetMapping("/my-assignments")
    public ResponseEntity<List<WorkoutAssignmentResponse>> getMyWorkoutAssignments(Authentication authentication) {
        Integer memberId = getCurrentUserId(authentication);
        List<WorkoutAssignmentResponse> assignments = workoutPlanService.getAssignmentsByMember(memberId);
        return ResponseEntity.ok(assignments);
    }
    
    @PreAuthorize("hasAuthority('Member')")
    @PutMapping("/assignments/{assignmentId}/complete")
    public ResponseEntity<WorkoutAssignmentResponse> completeWorkout(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        WorkoutAssignmentResponse response = workoutPlanService.updateAssignmentStatus(assignmentId, "COMPLETED", null);
        return ResponseEntity.ok(response);
    }
    
    // General endpoints
    @PreAuthorize("hasAuthority('Coach') or hasAuthority('Member')")
    @GetMapping("/{id}")
    public ResponseEntity<WorkoutPlanResponse> getWorkoutPlan(@PathVariable Long id) {
        WorkoutPlanResponse plan = workoutPlanService.getWorkoutPlanById(id);
        return ResponseEntity.ok(plan);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @PutMapping("/{id}")
    public ResponseEntity<WorkoutPlanResponse> updateWorkoutPlan(
            @PathVariable Long id,
            @RequestBody WorkoutPlanRequest request,
            Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        WorkoutPlanResponse response = workoutPlanService.updateWorkoutPlan(coachId, id, request);
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasAuthority('Coach')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkoutPlan(
            @PathVariable Long id,
            Authentication authentication) {
        Integer coachId = getCurrentUserId(authentication);
        workoutPlanService.deleteWorkoutPlan(coachId, id);
        return ResponseEntity.noContent().build();
    }
}
