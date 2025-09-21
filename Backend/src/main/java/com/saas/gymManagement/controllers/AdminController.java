package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.GymCreateRequest;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.dto.GymResponse;
import com.saas.gymManagement.dto.GymPhotoResponse;
import com.saas.gymManagement.services.GymService;
import com.saas.gymManagement.dto.AddCoachRequest;
import com.saas.gymManagement.models.Role;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.saas.gymManagement.services.impl.EmailService;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.dto.GymScheduleDto;
import com.saas.gymManagement.services.GymScheduleService;
import lombok.RequiredArgsConstructor;
import com.saas.gymManagement.dto.CoachResponse;
import com.saas.gymManagement.repositories.GymRatingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.services.Services;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/gym")
@RequiredArgsConstructor
public class AdminController {

    @Autowired
    private GymService gymService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymScheduleService gymScheduleService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.saas.gymManagement.repositories.GymRepository gymRepo;

    @Autowired
    private GymRatingRepository gymRatingRepository;

    @Autowired
    private Services services;

    private Integer currentAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            String email = userDetails.getUsername();
            Optional<User> u = userRepository.findByEmail(email);
            return u.map(User::getId).orElseThrow(() -> new RuntimeException("Admin user not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @PreAuthorize("hasAuthority('Admin')")
    @PostMapping
    public ResponseEntity<GymResponse> createGym(@RequestBody GymCreateRequest request) {
        Gym gym = gymService.createGym(currentAdminId(), request);
        return ResponseEntity.ok(mapGymToResponse(gym));
    }

    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping
    public ResponseEntity<GymResponse> getMyGym() {
        Gym gym = gymService.getMyGym(currentAdminId());
        if (gym == null) {
            return ResponseEntity.notFound().build();
        }
        GymResponse res = new GymResponse();
        res.setId(gym.getId());
        res.setName(gym.getName());
        res.setAddress(gym.getAddress());
        res.setLatitude(gym.getLatitude());
        res.setLongitude(gym.getLongitude());
        res.setDescription(gym.getDescription());
        res.setPhone(gym.getPhone());
        res.setEmail(gym.getEmail());
        res.setCode(gym.getCode());
        res.setMonthlyPrice(gym.getMonthlyPrice());
        res.setAnnualPrice(gym.getAnnualPrice());
        if (gym.getPhotos() != null) {
            res.setPhotos(gym.getPhotos().stream().map(p -> new GymPhotoResponse(p.getUrl())).toList());
        }
        return ResponseEntity.ok(res);
    }

    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/my-gym-id")
    public ResponseEntity<Integer> getMyGymId() {
        Gym gym = gymService.getMyGym(currentAdminId());
        if (gym == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(gym.getId());
    }

    @PreAuthorize("hasAuthority('Admin')")
    @PutMapping
    public ResponseEntity<GymResponse> updateGym(@RequestBody GymCreateRequest request) {
        Gym gym = (request.getCode() != null && !request.getCode().isBlank())
                ? gymService.updateGymByCode(currentAdminId(), request.getCode(), request)
                : gymService.updateGym(currentAdminId(), request);
        return ResponseEntity.ok(mapGymToResponse(gym));
    }

    // List gyms for current admin (for cards view)
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/all")
    public ResponseEntity<java.util.List<GymResponse>> listMyGyms() {
        java.util.List<Gym> gyms = gymService.listMyGyms(currentAdminId());
        java.util.List<GymResponse> result = gyms.stream().map(this::mapGymToResponse).toList();
        return ResponseEntity.ok(result);
    }

    // Schedule endpoints under /api/v1/admin/gym
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/schedule")
    public ResponseEntity<java.util.List<GymScheduleDto>> getMyGymSchedule() {
        return ResponseEntity.ok(gymScheduleService.getMyGymSchedule(currentAdminId()));
    }

    @PreAuthorize("hasAuthority('Admin')")
    @PutMapping("/schedule")
    public ResponseEntity<java.util.List<GymScheduleDto>> saveMyGymSchedule(@RequestBody java.util.List<GymScheduleDto> schedules) {
        return ResponseEntity.ok(gymScheduleService.saveMyGymSchedule(currentAdminId(), schedules));
    }

    // By gym id
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/{gymId}/schedules")
    public ResponseEntity<java.util.List<GymScheduleDto>> getSchedulesForGym(@PathVariable Integer gymId) {
        return ResponseEntity.ok(gymScheduleService.getSchedulesForGym(currentAdminId(), gymId));
    }

    @PreAuthorize("hasAuthority('Admin')")
    @PostMapping("/{gymId}/schedules")
    public ResponseEntity<java.util.List<GymScheduleDto>> addSchedulesForGym(@PathVariable Integer gymId,
                                                                             @RequestBody java.util.List<GymScheduleDto> schedules) {
        return ResponseEntity.ok(gymScheduleService.addSchedulesForGym(currentAdminId(), gymId, schedules));
    }

    // Schedule by code endpoints
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/code/{code}/schedules")
    public ResponseEntity<java.util.List<GymScheduleDto>> getSchedulesForGymCode(@PathVariable String code) {
        return ResponseEntity.ok(gymScheduleService.getSchedulesForGymCode(currentAdminId(), code));
    }

    @PreAuthorize("hasAuthority('Admin')")
    @PostMapping("/code/{code}/schedules")
    public ResponseEntity<java.util.List<GymScheduleDto>> addSchedulesForGymCode(@PathVariable String code,
                                                                                  @RequestBody java.util.List<GymScheduleDto> schedules) {
        return ResponseEntity.ok(gymScheduleService.addSchedulesForGymCode(currentAdminId(), code, schedules));
    }

    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/code/{code}/schedules/{scheduleId}")
    public ResponseEntity<Void> deleteScheduleForGymCode(@PathVariable String code, @PathVariable Long scheduleId) {
        gymScheduleService.deleteScheduleForGymCode(currentAdminId(), code, scheduleId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/{gymId}/schedules/{scheduleId}")
    public ResponseEntity<Void> deleteScheduleForGym(@PathVariable Integer gymId, @PathVariable Long scheduleId) {
        gymScheduleService.deleteScheduleForGym(currentAdminId(), gymId, scheduleId);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/schedule/{scheduleId}")
    public ResponseEntity<Void> deleteMySchedule(@PathVariable Long scheduleId) {
        gymScheduleService.deleteMySchedule(currentAdminId(), scheduleId);
        return ResponseEntity.noContent().build();
    }

    // Convenience fallback: return most recently created gym (for dev/demo viewing)
    // Removed fallback endpoint to enforce tenant isolation

    private GymResponse mapGymToResponse(Gym gym) {
        GymResponse res = new GymResponse();
        res.setId(gym.getId());
        res.setName(gym.getName());
        res.setAddress(gym.getAddress());
        res.setLatitude(gym.getLatitude());
        res.setLongitude(gym.getLongitude());
        res.setDescription(gym.getDescription());
        res.setPhone(gym.getPhone());
        res.setEmail(gym.getEmail());
        res.setCode(gym.getCode());
        res.setMonthlyPrice(gym.getMonthlyPrice());
        res.setAnnualPrice(gym.getAnnualPrice());
        if (gym.getPhotos() != null) {
            res.setPhotos(gym.getPhotos().stream().map(p -> new GymPhotoResponse(p.getUrl())).toList());
        }
        // Add rating data
        Double avgRating = gymRatingRepository.getAverageRatingByGymId(gym.getId());
        Long ratingCount = gymRatingRepository.getCountByGymId(gym.getId());
        res.setAverageRating(avgRating != null ? avgRating : 0.0);
        res.setRatingCount(ratingCount != null ? ratingCount : 0L);
        return res;
    }

    // Add Coach for current tenant (admin)
    @PreAuthorize("hasAuthority('Admin')")
    @PostMapping("/add-coach")
    public ResponseEntity<User> addCoach(@RequestBody AddCoachRequest request) {
        // Basic validation
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        // Check existing
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(409).build();
        }

        // Generate temp password if missing
        String rawPassword = (request.getPassword() == null || request.getPassword().isBlank())
                ? ("Coach-" + java.util.UUID.randomUUID().toString().substring(0,8))
                : request.getPassword();

        User coach = new User();
        coach.setFirstname(request.getFirstname());
        coach.setLastname(request.getLastname());
        coach.setEmail(request.getEmail());
        coach.setPassword(passwordEncoder.encode(rawPassword));
        coach.setRole(Role.Coach);
        coach.setConfirmed(true);
        coach.setCin(request.getCin());
        coach.setPhone(request.getPhone());
        coach.setSpeciality(request.getSpeciality());

        // Link coach to gym by provided name (scoped to current admin), else admin's own gym
        Gym targetGym = null;
        if (request.getGymName() != null && !request.getGymName().isBlank()) {
            targetGym = gymRepository.findByAdminIdAndNameIgnoreCase(currentAdminId(), request.getGymName()).orElse(null);
        }
        if (targetGym == null) {
            targetGym = gymService.getMyGym(currentAdminId());
        }
        if (targetGym != null) {
            coach.setGym(targetGym);
        }

        User created = userRepository.save(coach);

        // Send welcome email with temporary password (not hashed)
        emailService.sendCoachWelcomeEmail(coach.getEmail(), coach.getFirstname(), coach.getEmail(), rawPassword);

        return ResponseEntity.ok(created);
    }

    // List coaches by gym code (scoped to current admin)
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/code/{code}/coaches")
    public ResponseEntity<java.util.List<CoachResponse>> getCoachesByGymCode(@PathVariable String code) {
        Gym gym = gymRepository.findByAdminIdAndCode(currentAdminId(), code).orElse(null);
        if (gym == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        java.util.List<User> users = userRepository.findAll();
        java.util.List<CoachResponse> list = users.stream()
                .filter(u -> u.getRole() == Role.Coach && u.getGym() != null && u.getGym().getId().equals(gym.getId()))
                .map(u -> {
                    CoachResponse c = new CoachResponse();
                    c.setId(u.getId());
                    c.setFirstname(u.getFirstname());
                    c.setLastname(u.getLastname());
                    c.setEmail(u.getEmail());
                    c.setPhone(u.getPhone());
                    c.setSpeciality(u.getSpeciality());
                    return c;
                }).toList();
        return ResponseEntity.ok(list);
    }

    // Delete gym by ID (scoped to current admin)
    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/{gymId}")
    public ResponseEntity<Void> deleteGym(@PathVariable Integer gymId) {
        // Verify the gym belongs to the current admin
        java.util.List<Gym> adminGyms = gymService.listMyGyms(currentAdminId());
        boolean gymBelongsToAdmin = adminGyms.stream().anyMatch(g -> g.getId().equals(gymId));
        
        if (!gymBelongsToAdmin) {
            return ResponseEntity.notFound().build();
        }
        
        // Delete the gym (cascade will handle related data)
        gymRepository.deleteById(gymId);
        return ResponseEntity.noContent().build();
    }

    // Get subscribed members for admin's gyms
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping("/subscribed-members")
    public ResponseEntity<java.util.List<SubscribedMemberResponse>> getSubscribedMembers() {
        java.util.List<Gym> adminGyms = gymService.listMyGyms(currentAdminId());
        java.util.List<SubscribedMemberResponse> subscribedMembers = new java.util.ArrayList<>();
        
        for (Gym gym : adminGyms) {
            java.util.List<User> members = userRepository.findBySubscribedGym_Id(gym.getId());
            for (User member : members) {
                SubscribedMemberResponse response = new SubscribedMemberResponse();
                response.setId(member.getId());
                response.setFirstname(member.getFirstname());
                response.setLastname(member.getLastname());
                response.setEmail(member.getEmail());
                response.setPhone(member.getPhone());
                response.setGymName(gym.getName());
                response.setGymCode(gym.getCode());
                response.setSubscriptionDate(member.getRegistrationDate());
                subscribedMembers.add(response);
            }
        }
        
        return ResponseEntity.ok(subscribedMembers);
    }

    // DTO for subscribed member response
    public static class SubscribedMemberResponse {
        private Integer id;
        private String firstname;
        private String lastname;
        private String email;
        private String phone;
        private String gymName;
        private String gymCode;
        private java.time.LocalDateTime subscriptionDate;

        // Getters and setters
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }
        
        public String getFirstname() { return firstname; }
        public void setFirstname(String firstname) { this.firstname = firstname; }
        
        public String getLastname() { return lastname; }
        public void setLastname(String lastname) { this.lastname = lastname; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getGymName() { return gymName; }
        public void setGymName(String gymName) { this.gymName = gymName; }
        
        public String getGymCode() { return gymCode; }
        public void setGymCode(String gymCode) { this.gymCode = gymCode; }
        
        public java.time.LocalDateTime getSubscriptionDate() { return subscriptionDate; }
        public void setSubscriptionDate(java.time.LocalDateTime subscriptionDate) { this.subscriptionDate = subscriptionDate; }
    }

    // Cleanup facial recognition data for deleted users
    @PreAuthorize("hasAuthority('Admin')")
    @PostMapping("/cleanup-facial-recognition")
    public ResponseEntity<String> cleanupFacialRecognitionData() {
        try {
            services.cleanupFacialRecognitionData();
            return ResponseEntity.ok("Facial recognition data cleanup completed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error during cleanup: " + e.getMessage());
        }
    }
}
