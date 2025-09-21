package com.saas.gymManagement.controllers;

import com.saas.gymManagement.models.Role;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.dto.GymResponse;
import com.saas.gymManagement.dto.GymPhotoResponse;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.repositories.GymRatingRepository;
import com.saas.gymManagement.services.Services;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/superAdmin")
@RequiredArgsConstructor
@Tag(name = "Super Admin", description = "Super admin operations for managing users and gyms")
@SecurityRequirement(name = "Bearer Authentication")
public class SuperAdminController {

    @Autowired
    private Services services;

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymRatingRepository gymRatingRepository;

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @PostMapping("/{userId}/approve")
    public ResponseEntity<Void> approveUser(@PathVariable Integer userId, @RequestParam(required = false) Role role) {
        services.approveUser(userId, role);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @PostMapping("/approveAdmin/{userId}")
    public ResponseEntity<Void> approveAdmin(@PathVariable Integer userId) {
        services.approveAdmin(userId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping(value = "/pending-users", produces = "application/json")
    public ResponseEntity<List<User>> getPendingUsers() {
        List<User> users = services.getPendingUsers();
        return ResponseEntity.ok(users == null ? java.util.Collections.emptyList() : users);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @PostMapping("/{userId}/reject")
    public ResponseEntity<Void> rejectUser(@PathVariable Integer userId) {
        services.rejectUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/users")
    @Operation(summary = "Get all users", 
               description = "Retrieves a list of all users in the system with their details, roles, and gym assignments")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved all users"),
        @ApiResponse(responseCode = "403", description = "Access denied - SuperAdmin role required"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token")
    })
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = services.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @DeleteMapping("/users/{userId}")
    @Operation(summary = "Delete user", 
               description = "Deletes a user from the system. This action cannot be undone.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "User deleted successfully"),
        @ApiResponse(responseCode = "404", description = "User not found"),
        @ApiResponse(responseCode = "403", description = "Access denied - SuperAdmin role required"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token")
    })
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        services.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/gyms")
    @Operation(summary = "Get all gyms", 
               description = "Retrieves a list of all gyms in the system with their details and ratings")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved all gyms"),
        @ApiResponse(responseCode = "403", description = "Access denied - SuperAdmin role required"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token")
    })
    public ResponseEntity<List<GymResponse>> getAllGyms() {
        List<GymResponse> list = gymRepository.findAll().stream().map(g -> {
            GymResponse r = new GymResponse();
            r.setId(g.getId());
            r.setName(g.getName());
            r.setAddress(g.getAddress());
            r.setLatitude(g.getLatitude());
            r.setLongitude(g.getLongitude());
            r.setDescription(g.getDescription());
            r.setPhone(g.getPhone());
            r.setEmail(g.getEmail());
            r.setCode(g.getCode());
            r.setMonthlyPrice(g.getMonthlyPrice());
            r.setAnnualPrice(g.getAnnualPrice());
            if (g.getPhotos() != null) {
                r.setPhotos(g.getPhotos().stream().map(p -> new GymPhotoResponse(p.getUrl())).collect(Collectors.toList()));
            }
            // Add rating data
            Double avgRating = gymRatingRepository.getAverageRatingByGymId(g.getId());
            Long ratingCount = gymRatingRepository.getCountByGymId(g.getId());
            r.setAverageRating(avgRating != null ? avgRating : 0.0);
            r.setRatingCount(ratingCount != null ? ratingCount : 0L);
            return r;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }
}
