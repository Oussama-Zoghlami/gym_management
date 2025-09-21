package com.saas.gymManagement.repositories;

import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    List<User> findByRole(@Param("role") Role role);
    Optional<User> findByEmail(String email);
    List<User> findByConfirmed(boolean confirmed);
    List<User> findByGym_Id(Integer gymId);
    List<User> findBySubscribedGym_Id(Integer gymId);
    Optional<User> findByResetPasswordToken(String resetPasswordToken);
    
    // Statistics methods
    long countByRole(Role role);
    long countByGymIdAndRole(Integer gymId, Role role);
    long countByRegistrationDateAfter(LocalDateTime date);
    
    // Fetch users with gym and subscription data
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.gym LEFT JOIN FETCH u.subscribedGym WHERE u.role != 'SuperAdmin'")
    List<User> findAllWithGymData();
    
    // Fetch gyms created by a specific admin
    @Query("SELECT g FROM Gym g WHERE g.adminId = :adminId")
    List<com.saas.gymManagement.models.Gym> findGymsCreatedByAdmin(@Param("adminId") Integer adminId);
}
