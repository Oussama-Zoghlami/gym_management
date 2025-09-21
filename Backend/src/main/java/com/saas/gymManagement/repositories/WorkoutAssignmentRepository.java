package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.AssignmentStatus;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.models.WorkoutAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkoutAssignmentRepository extends JpaRepository<WorkoutAssignment, Long> {
    long countByStatus(AssignmentStatus status);
    
    @Query("SELECT COUNT(wa) FROM WorkoutAssignment wa " +
           "JOIN wa.workoutPlan wp " +
           "WHERE wp.gym.id = :gymId AND wa.status = 'COMPLETED'")
    long countCompletedWorkoutsByGymId(@Param("gymId") Integer gymId);
    
    // Methods used by WorkoutPlanServiceImpl
    Optional<WorkoutAssignment> findByWorkoutPlan_IdAndMember_Id(Long workoutPlanId, Integer memberId);
    
    @Query("SELECT wa FROM WorkoutAssignment wa WHERE wa.coach = :coach AND wa.status IN ('ASSIGNED', 'IN_PROGRESS')")
    List<WorkoutAssignment> findActiveAssignmentsByCoach(@Param("coach") User coach);
    
    @Query("SELECT wa FROM WorkoutAssignment wa WHERE wa.member = :member AND wa.status IN ('ASSIGNED', 'IN_PROGRESS')")
    List<WorkoutAssignment> findActiveAssignmentsByMember(@Param("member") User member);
}