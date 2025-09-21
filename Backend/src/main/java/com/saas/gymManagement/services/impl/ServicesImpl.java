package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.services.Services;
import com.saas.gymManagement.services.FacialRecognitionService;
import com.saas.gymManagement.services.impl.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServicesImpl implements Services {


    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FacialRecognitionService facialRecognitionService;


    @Override
    public void approveUser(Integer userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Fallback: infer role if not provided
        if (role == null) {
            boolean hasCin = user.getCin() != null && !user.getCin().trim().isEmpty();
            role = hasCin ? Role.Admin : Role.Member;
        }

        // Update user role and set confirmed to true
        user.setRole(role);
        user.setConfirmed(true);
        userRepository.save(user);

        // Send email with login credentials
        emailService.sendLoginCredentialsEmail(
                user.getEmail(),
                user.getFirstname(),
                user.getEmail(),
                user.getRole().name()
        );
    }
    @Override
    public void approveAdmin(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Set confirmed to true
        user.setConfirmed(true);
        userRepository.save(user);

        // Send email with login credentials
        emailService.sendLoginCredentialsEmail(
                user.getEmail(),
                user.getFirstname(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Override
    public void rejectUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Send rejection email
        emailService.sendRejectionEmail(
                user.getEmail(),
                user.getFirstname()
        );

        // Delete the user from facial recognition service first
        facialRecognitionService.deleteMemberByEmail(user.getEmail());

        // Delete the user from database
        userRepository.delete(user);
    }

    @Override
    public void deleteUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Prevent deletion of SuperAdmin
        if (user.getRole().equals(Role.SuperAdmin)) {
            throw new RuntimeException("Cannot delete SuperAdmin user");
        }

        // Delete the user from facial recognition service first
        facialRecognitionService.deleteMemberByEmail(user.getEmail());

        // Delete the user from database
        userRepository.delete(user);
    }

    @Override
    public List<User> getPendingUsers() {
        // Get all unconfirmed users except SuperAdmin
        return userRepository.findByConfirmed(false)
                .stream()
                .filter(user -> !user.getRole().equals(Role.SuperAdmin))
                .collect(Collectors.toList());
    }

    @Override
    public List<User> getAllUsers() {
        // Get all users except SuperAdmin with gym and subscription data
        List<User> users = userRepository.findAllWithGymData();
        
        // For each admin user, fetch the gyms they created
        for (User user : users) {
            if (user.getRole() == Role.Admin) {
                List<Gym> createdGyms = userRepository.findGymsCreatedByAdmin(user.getId());
                user.setCreatedGyms(createdGyms);
            }
        }
        
        return users;
    }

    @Override
    public void cleanupFacialRecognitionData() {
        // Get all active user emails from database
        List<String> activeEmails = userRepository.findAll()
                .stream()
                .map(User::getEmail)
                .collect(Collectors.toList());
        
        // Clean up facial recognition data
        facialRecognitionService.cleanupDeletedUsers(activeEmails);
    }

}
