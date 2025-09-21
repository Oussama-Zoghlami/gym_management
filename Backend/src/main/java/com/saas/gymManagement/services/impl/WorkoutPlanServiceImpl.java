package com.saas.gymManagement.services.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.saas.gymManagement.dto.WorkoutPlanRequest;
import com.saas.gymManagement.dto.WorkoutPlanResponse;
import com.saas.gymManagement.dto.WorkoutAssignmentResponse;
import com.saas.gymManagement.models.*;
import com.saas.gymManagement.repositories.WorkoutPlanRepository;
import com.saas.gymManagement.repositories.WorkoutAssignmentRepository;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.services.WorkoutPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkoutPlanServiceImpl implements WorkoutPlanService {
    
    private final WorkoutPlanRepository workoutPlanRepository;
    private final WorkoutAssignmentRepository workoutAssignmentRepository;
    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional
    public WorkoutPlanResponse createWorkoutPlan(Integer coachId, WorkoutPlanRequest request) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        Gym gym = coach.getGym();
        if (gym == null) {
            throw new RuntimeException("Coach is not assigned to any gym");
        }
        
        WorkoutPlan workoutPlan = new WorkoutPlan();
        workoutPlan.setTitle(request.getTitle());
        workoutPlan.setDescription(request.getDescription());
        workoutPlan.setDuration(request.getDuration());
        workoutPlan.setDifficultyLevel(request.getDifficultyLevel());
        workoutPlan.setCoach(coach);
        workoutPlan.setGym(gym);
        
        // Convert exercises to JSON
        try {
            workoutPlan.setExercises(objectMapper.writeValueAsString(request.getExercises()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing exercises", e);
        }
        
        WorkoutPlan savedPlan = workoutPlanRepository.save(workoutPlan);
        
        // If memberId is provided, assign the workout plan to the member
        if (request.getMemberId() != null) {
            assignWorkoutPlanToMember(coachId, savedPlan.getId(), request.getMemberId(), null);
        }
        
        return mapToResponse(savedPlan);
    }
    
    @Override
    public List<WorkoutPlanResponse> getWorkoutPlansByCoach(Integer coachId) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        List<WorkoutPlan> plans = workoutPlanRepository.findByCoach(coach);
        return plans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Override
    public List<WorkoutPlanResponse> getWorkoutPlansByGym(Integer gymId) {
        List<WorkoutPlan> plans = workoutPlanRepository.findByGym_Id(gymId);
        return plans.stream().map(this::mapToResponse).collect(Collectors.toList());
    }
    
    @Override
    public WorkoutPlanResponse getWorkoutPlanById(Long id) {
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));
        return mapToResponse(plan);
    }
    
    @Override
    @Transactional
    public WorkoutPlanResponse updateWorkoutPlan(Integer coachId, Long id, WorkoutPlanRequest request) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));
        
        // Check if the coach owns this workout plan
        if (!plan.getCoach().getId().equals(coachId)) {
            throw new RuntimeException("You can only update your own workout plans");
        }
        
        plan.setTitle(request.getTitle());
        plan.setDescription(request.getDescription());
        plan.setDuration(request.getDuration());
        plan.setDifficultyLevel(request.getDifficultyLevel());
        
        try {
            plan.setExercises(objectMapper.writeValueAsString(request.getExercises()));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error serializing exercises", e);
        }
        
        WorkoutPlan updatedPlan = workoutPlanRepository.save(plan);
        return mapToResponse(updatedPlan);
    }
    
    @Override
    @Transactional
    public void deleteWorkoutPlan(Integer coachId, Long id) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        WorkoutPlan plan = workoutPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));
        
        // Check if the coach owns this workout plan
        if (!plan.getCoach().getId().equals(coachId)) {
            throw new RuntimeException("You can only delete your own workout plans");
        }
        
        // Delete the workout plan - assignments will be automatically deleted due to CASCADE constraint
        workoutPlanRepository.delete(plan);
    }
    
    @Override
    @Transactional
    public WorkoutAssignmentResponse assignWorkoutPlanToMember(Integer coachId, Long workoutPlanId, Integer memberId, String notes) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        WorkoutPlan workoutPlan = workoutPlanRepository.findById(workoutPlanId)
                .orElseThrow(() -> new RuntimeException("Workout plan not found"));
        
        // Check if member is subscribed to the coach's gym
        if (member.getSubscribedGym() == null || !member.getSubscribedGym().getId().equals(coach.getGym().getId())) {
            throw new RuntimeException("Member is not subscribed to the coach's gym");
        }
        
        // Check if assignment already exists
        workoutAssignmentRepository.findByWorkoutPlan_IdAndMember_Id(workoutPlanId, memberId)
                .ifPresent(assignment -> {
                    throw new RuntimeException("Workout plan is already assigned to this member");
                });
        
        WorkoutAssignment assignment = new WorkoutAssignment();
        assignment.setWorkoutPlan(workoutPlan);
        assignment.setMember(member);
        assignment.setCoach(coach);
        assignment.setStatus(AssignmentStatus.ASSIGNED);
        assignment.setNotes(notes);
        
        WorkoutAssignment savedAssignment = workoutAssignmentRepository.save(assignment);
        return mapAssignmentToResponse(savedAssignment);
    }
    
    @Override
    public List<WorkoutAssignmentResponse> getAssignmentsByCoach(Integer coachId) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        List<WorkoutAssignment> assignments = workoutAssignmentRepository.findActiveAssignmentsByCoach(coach);
        return assignments.stream().map(this::mapAssignmentToResponse).collect(Collectors.toList());
    }
    
    @Override
    public List<WorkoutAssignmentResponse> getAssignmentsByMember(Integer memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        
        List<WorkoutAssignment> assignments = workoutAssignmentRepository.findActiveAssignmentsByMember(member);
        return assignments.stream().map(this::mapAssignmentToResponse).collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public WorkoutAssignmentResponse updateAssignmentStatus(Long assignmentId, String status, String notes) {
        WorkoutAssignment assignment = workoutAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        assignment.setStatus(AssignmentStatus.valueOf(status.toUpperCase()));
        if (notes != null) {
            assignment.setNotes(notes);
        }
        
        if (AssignmentStatus.valueOf(status.toUpperCase()) == AssignmentStatus.COMPLETED) {
            assignment.setCompletedAt(java.time.LocalDateTime.now());
        }
        
        WorkoutAssignment updatedAssignment = workoutAssignmentRepository.save(assignment);
        return mapAssignmentToResponse(updatedAssignment);
    }
    
    @Override
    public List<User> getSubscribedMembersByCoach(Integer coachId) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new RuntimeException("Coach not found"));
        
        if (coach.getGym() == null) {
            throw new RuntimeException("Coach is not assigned to any gym");
        }
        
        return userRepository.findBySubscribedGym_Id(coach.getGym().getId());
    }
    
    private WorkoutPlanResponse mapToResponse(WorkoutPlan plan) {
        WorkoutPlanResponse response = new WorkoutPlanResponse();
        response.setId(plan.getId());
        response.setTitle(plan.getTitle());
        response.setDescription(plan.getDescription());
        response.setDuration(plan.getDuration());
        response.setDifficultyLevel(plan.getDifficultyLevel());
        response.setCoachName(plan.getCoach().getFirstname() + " " + plan.getCoach().getLastname());
        response.setGymName(plan.getGym().getName());
        response.setCreatedAt(plan.getCreatedAt());
        response.setUpdatedAt(plan.getUpdatedAt());
        
        // Parse exercises from JSON
        try {
            List<WorkoutPlanRequest.ExerciseDto> exercises = objectMapper.readValue(
                    plan.getExercises(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, WorkoutPlanRequest.ExerciseDto.class)
            );
            response.setExercises(exercises.stream().map(ex -> {
                WorkoutPlanResponse.ExerciseDto responseEx = new WorkoutPlanResponse.ExerciseDto();
                responseEx.setName(ex.getName());
                responseEx.setDescription(ex.getDescription());
                responseEx.setSets(ex.getSets());
                responseEx.setReps(ex.getReps());
                responseEx.setDuration(ex.getDuration());
                responseEx.setRestTime(ex.getRestTime());
                responseEx.setInstructions(ex.getInstructions());
                return responseEx;
            }).collect(Collectors.toList()));
        } catch (JsonProcessingException e) {
            // Handle error - set empty list
            response.setExercises(List.of());
        }
        
        return response;
    }
    
    private WorkoutAssignmentResponse mapAssignmentToResponse(WorkoutAssignment assignment) {
        WorkoutAssignmentResponse response = new WorkoutAssignmentResponse();
        response.setId(assignment.getId());
        response.setWorkoutPlan(mapToResponse(assignment.getWorkoutPlan()));
        response.setMemberName(assignment.getMember().getFirstname() + " " + assignment.getMember().getLastname());
        response.setMemberEmail(assignment.getMember().getEmail());
        response.setCoachName(assignment.getCoach().getFirstname() + " " + assignment.getCoach().getLastname());
        response.setStatus(assignment.getStatus());
        response.setNotes(assignment.getNotes());
        response.setAssignedAt(assignment.getAssignedAt());
        response.setCompletedAt(assignment.getCompletedAt());
        return response;
    }
}
