package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.User;
import com.saas.gymManagement.models.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkoutPlanRepository extends JpaRepository<WorkoutPlan, Long> {
    long countByGymId(Integer gymId);
    
    // Methods used by WorkoutPlanServiceImpl
    List<WorkoutPlan> findByCoach(User coach);
    List<WorkoutPlan> findByGym_Id(Integer gymId);
}