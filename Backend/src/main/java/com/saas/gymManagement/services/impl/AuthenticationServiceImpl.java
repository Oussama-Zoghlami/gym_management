package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.dto.*;
import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.services.AuthenticationService;
import com.saas.gymManagement.services.JWTService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceImpl implements AuthenticationService {
    @Autowired
    private  UserRepository userRepo;
    @Autowired
    private  GymRepository gymRepo;
    @Autowired
    private  PasswordEncoder passwordEncoder;
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private JWTService jwtService;
    @Autowired
    private EmailService emailService;

    @Override
    public User signup(SignUpRequest request) {
        User user = new User();
        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // Default member role for normal signup
        user.setRole(Role.Member);
        user.setConfirmed(false);
        return userRepo.save(user);
    }
    @Override
    public User signupAdmin(SignUpRequestAdmin requestAdmin) {
        User user = new User();
        user.setFirstname(requestAdmin.getFirstname());
        user.setLastname(requestAdmin.getLastname());
        user.setEmail(requestAdmin.getEmail());
        user.setPassword(passwordEncoder.encode(requestAdmin.getPassword()));
        user.setCin(requestAdmin.getCin()); // Set CIN for Admin
        user.setRole(Role.Admin);
        user.setConfirmed(false);
        return userRepo.save(user);
    }

    @Override
    public JwtAuthenticationResponse signin(SignInRequest signinRequest) {
        // Authenticate the user
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(signinRequest.getEmail(), signinRequest.getPassword())
        );

        // Find the user
        var user = userRepo.findByEmail(signinRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        // Check if the user is confirmed
        if (!user.isConfirmed()) {
            throw new IllegalArgumentException("Your account is not yet approved. Please contact the SuperAdmin.");
        }

        // Generate tokens
        var jwt = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(new HashMap<>(), user);

        // Build the response
        JwtAuthenticationResponse jwtAuthenticationResponse = new JwtAuthenticationResponse();
        jwtAuthenticationResponse.setToken(jwt);
        jwtAuthenticationResponse.setRefreshToken(refreshToken);
        jwtAuthenticationResponse.setRole(user.getRole().name());

        return jwtAuthenticationResponse;
    }

    @Override
    public JwtAuthenticationResponse signinFacial(FacialSignInRequest facialRequest) {
        // Find the user by email from facial recognition
        var user = userRepo.findByEmail(facialRequest.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found for facial recognition"));

        // Check if the user is confirmed
        if (!user.isConfirmed()) {
            throw new IllegalArgumentException("Your account is not yet approved. Please contact the SuperAdmin.");
        }
        
        // Update user's subscribedGym if it doesn't match the facial recognition gym_id
        if (user.getSubscribedGym() == null || !user.getSubscribedGym().getId().equals(facialRequest.getGymId())) {
            // Find the gym by ID and update user's subscription
            var gym = gymRepo.findById(facialRequest.getGymId())
                .orElseThrow(() -> new IllegalArgumentException("Gym not found with ID: " + facialRequest.getGymId()));
            
            user.setSubscribedGym(gym);
            userRepo.save(user);
        }

        // Generate tokens (same as regular signin but without password authentication)
        var jwt = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(new HashMap<>(), user);

        // Build the response
        JwtAuthenticationResponse jwtAuthenticationResponse = new JwtAuthenticationResponse();
        jwtAuthenticationResponse.setToken(jwt);
        jwtAuthenticationResponse.setRefreshToken(refreshToken);
        jwtAuthenticationResponse.setRole(user.getRole().name());

        return jwtAuthenticationResponse;
    }

    @Override
    public JwtAuthenticationResponse refreshToken(RefreshTokenRequest refreshTokenRequest){
        String userEmail =jwtService.extractUserName(refreshTokenRequest.getToken());
        User user =userRepo.findByEmail(userEmail).orElseThrow();
        if(jwtService.isTokenValid(refreshTokenRequest.getToken(), user)){
            var jwt = jwtService.generateToken(user);

            JwtAuthenticationResponse jwtAuthenticationResponse = new JwtAuthenticationResponse();


            jwtAuthenticationResponse.setToken(jwt);
            jwtAuthenticationResponse.setRefreshToken(refreshTokenRequest.getToken());
            return jwtAuthenticationResponse;
        }
        return null;
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found with email: " + request.getEmail()));

        // Generate reset token
        String resetToken = UUID.randomUUID().toString();
        user.setResetPasswordToken(resetToken);
        user.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1)); // Token expires in 1 hour
        userRepo.save(user);

        // Send email with reset link
        String resetLink = "http://localhost:4200/reset-password?token=" + resetToken;
        
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstname(), resetLink);
    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepo.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        // Check if token is expired
        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Reset token has expired");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepo.save(user);
    }


}
