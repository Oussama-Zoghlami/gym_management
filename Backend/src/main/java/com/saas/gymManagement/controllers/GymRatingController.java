package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.GymRatingRequest;
import com.saas.gymManagement.models.Gym;
import com.saas.gymManagement.models.GymRating;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.repositories.GymRatingRepository;
import com.saas.gymManagement.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/rating")
@RequiredArgsConstructor
public class GymRatingController {

    @Autowired
    private GymRatingRepository gymRatingRepository;
    
    @Autowired
    private GymRepository gymRepository;
    
    @Autowired
    private UserRepository userRepository;

    private Integer currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            String email = userDetails.getUsername();
            Optional<User> u = userRepository.findByEmail(email);
            return u.map(User::getId).orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @PreAuthorize("hasAuthority('MEMBER')")
    @PostMapping("/gym")
    public ResponseEntity<GymRating> rateGym(@RequestBody GymRatingRequest request) {
        Integer userId = currentUserId();
        
        // Validate rating
        if (request.getRating() < 1 || request.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }
        
        // Find gym
        Optional<Gym> gymOpt = gymRepository.findById(request.getGymId());
        if (gymOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // Find user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Gym gym = gymOpt.get();
        User user = userOpt.get();
        
        // Check if user already rated this gym
        Optional<GymRating> existingRating = gymRatingRepository.findByGymIdAndUserId(gym.getId(), userId);
        
        GymRating rating;
        if (existingRating.isPresent()) {
            // Update existing rating
            rating = existingRating.get();
            rating.setRating(request.getRating());
            rating.setComment(request.getComment());
            rating.setUpdatedAt(LocalDateTime.now());
        } else {
            // Create new rating
            rating = new GymRating();
            rating.setGym(gym);
            rating.setUser(user);
            rating.setRating(request.getRating());
            rating.setComment(request.getComment());
        }
        
        GymRating saved = gymRatingRepository.save(rating);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/gym/{gymId}/average")
    public ResponseEntity<Double> getAverageRating(@PathVariable Integer gymId) {
        Double average = gymRatingRepository.getAverageRatingByGymId(gymId);
        return ResponseEntity.ok(average != null ? average : 0.0);
    }

    @GetMapping("/gym/{gymId}/count")
    public ResponseEntity<Long> getRatingCount(@PathVariable Integer gymId) {
        Long count = gymRatingRepository.getCountByGymId(gymId);
        return ResponseEntity.ok(count != null ? count : 0L);
    }

    @PreAuthorize("hasAuthority('MEMBER')")
    @GetMapping("/gym/{gymId}/my-rating")
    public ResponseEntity<GymRating> getMyRating(@PathVariable Integer gymId) {
        Integer userId = currentUserId();
        Optional<GymRating> rating = gymRatingRepository.findByGymIdAndUserId(gymId, userId);
        return rating.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
