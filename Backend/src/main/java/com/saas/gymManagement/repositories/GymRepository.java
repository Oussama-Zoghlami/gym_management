package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.Gym;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface GymRepository extends JpaRepository<Gym, Integer> {
    @EntityGraph(attributePaths = {"photos"})
    Optional<Gym> findByAdminId(Integer adminId);
    @EntityGraph(attributePaths = {"photos"})
    Optional<Gym> findTopByOrderByIdDesc();
    @EntityGraph(attributePaths = {"photos"})
    Optional<Gym> findByAdminIdAndNameIgnoreCase(Integer adminId, String name);
    @EntityGraph(attributePaths = {"photos"})
    Optional<Gym> findByAdminIdAndCode(Integer adminId, String code);

    @EntityGraph(attributePaths = {"photos"})
    java.util.List<Gym> findAllByAdminId(Integer adminId);

    @Override
    @EntityGraph(attributePaths = {"photos"})
    java.util.List<Gym> findAll();
    
    // Statistics methods
    long countByCreatedAtAfter(LocalDateTime date);
}


