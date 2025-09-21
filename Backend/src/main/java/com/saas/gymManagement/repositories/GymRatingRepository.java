package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.GymRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GymRatingRepository extends JpaRepository<GymRating, Long> {
    
    List<GymRating> findByGymId(Integer gymId);
    
    Optional<GymRating> findByGymIdAndUserId(Integer gymId, Integer userId);
    
    @Query("SELECT AVG(r.rating) FROM GymRating r WHERE r.gym.id = :gymId")
    Double getAverageRatingByGymId(@Param("gymId") Integer gymId);
    
    @Query("SELECT COUNT(r) FROM GymRating r WHERE r.gym.id = :gymId")
    Long getCountByGymId(@Param("gymId") Integer gymId);
}
