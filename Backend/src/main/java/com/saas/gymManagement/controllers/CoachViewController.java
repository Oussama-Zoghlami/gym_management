package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.GymPhotoResponse;
import com.saas.gymManagement.dto.GymResponse;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.dto.GymScheduleDto;
import com.saas.gymManagement.models.GymSchedule;
import com.saas.gymManagement.repositories.GymScheduleRepository;
import com.saas.gymManagement.repositories.UserRepository;
import java.util.List;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/coach")
public class CoachViewController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GymScheduleRepository gymScheduleRepository;

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            Optional<User> u = userRepository.findByEmail(userDetails.getUsername());
            return u.orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @PreAuthorize("hasAuthority('Coach')")
    @GetMapping("/gym")
    public ResponseEntity<GymResponse> getMyGym() {
        User coach = currentUser();
        Gym gym = coach.getGym();
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

    @PreAuthorize("hasAuthority('Coach')")
    @GetMapping("/schedule")
    public ResponseEntity<java.util.List<GymScheduleDto>> getMyGymSchedule() {
        User coach = currentUser();
        Gym gym = coach.getGym();
        if (gym == null) {
            return ResponseEntity.notFound().build();
        }
        java.util.List<GymSchedule> rows = gymScheduleRepository.findByGym_IdOrderByIdAsc(gym.getId());
        java.util.List<GymScheduleDto> list = rows.stream().map(r -> {
            GymScheduleDto d = new GymScheduleDto();
            d.setId(r.getId());
            d.setDayOfWeek(r.getDayOfWeek());
            d.setOpenTime(r.getOpenTime() != null ? r.getOpenTime().toString() : null);
            d.setCloseTime(r.getCloseTime() != null ? r.getCloseTime().toString() : null);
            d.setNote(r.getNote());
            return d;
        }).toList();
        return ResponseEntity.ok(list);
    }

    @PreAuthorize("hasAuthority('Coach')")
    @GetMapping("/gym-members")
    public ResponseEntity<List<GymMemberResponse>> getGymMembers() {
        User coach = currentUser();
        Gym gym = coach.getGym();
        if (gym == null) {
            return ResponseEntity.notFound().build();
        }
        
        List<User> members = userRepository.findBySubscribedGym_Id(gym.getId());
        List<GymMemberResponse> memberResponses = new ArrayList<>();
        
        for (User member : members) {
            GymMemberResponse response = new GymMemberResponse();
            response.setId(member.getId());
            response.setFirstname(member.getFirstname());
            response.setLastname(member.getLastname());
            response.setEmail(member.getEmail());
            response.setPhone(member.getPhone());
            response.setGymName(gym.getName());
            response.setGymCode(gym.getCode());
            response.setSubscriptionDate(member.getRegistrationDate());
            memberResponses.add(response);
        }
        
        return ResponseEntity.ok(memberResponses);
    }

    // DTO for gym member response
    public static class GymMemberResponse {
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
}


