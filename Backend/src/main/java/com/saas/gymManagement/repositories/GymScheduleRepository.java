package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.models.GymSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GymScheduleRepository extends JpaRepository<GymSchedule, Long> {
    List<GymSchedule> findByGym_IdOrderByIdAsc(Integer gymId);
    void deleteByGym_Id(Integer gymId);
    void deleteByIdAndGym_Id(Long id, Integer gymId);
}


