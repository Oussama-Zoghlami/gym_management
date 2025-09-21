package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.GymStatistics;
import com.saas.gymManagement.dto.OverallStatistics;
import com.saas.gymManagement.dto.TopGymStats;
import com.saas.gymManagement.services.StatisticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
@Tag(name = "Statistics", description = "Gym statistics and analytics API")
@SecurityRequirement(name = "Bearer Authentication")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/overall")
    @Operation(summary = "Get overall platform statistics", 
               description = "Retrieves comprehensive statistics about the entire platform including total gyms, users, revenue, and activity metrics")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved overall statistics"),
        @ApiResponse(responseCode = "403", description = "Access denied - SuperAdmin role required"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token")
    })
    public ResponseEntity<OverallStatistics> getOverallStatistics() {
        OverallStatistics stats = statisticsService.getOverallStatistics();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/top-gyms/subscriptions")
    public ResponseEntity<List<TopGymStats>> getTopGymsBySubscriptions() {
        List<TopGymStats> stats = statisticsService.getTopGymsBySubscriptions();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/top-gyms/revenue")
    public ResponseEntity<List<TopGymStats>> getTopGymsByRevenue() {
        List<TopGymStats> stats = statisticsService.getTopGymsByRevenue();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/top-gyms/coaches")
    public ResponseEntity<List<TopGymStats>> getTopGymsByCoaches() {
        List<TopGymStats> stats = statisticsService.getTopGymsByCoaches();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/top-gyms/workout-plans")
    public ResponseEntity<List<TopGymStats>> getTopGymsByWorkoutPlans() {
        List<TopGymStats> stats = statisticsService.getTopGymsByWorkoutPlans();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/top-gyms/completed-workouts")
    public ResponseEntity<List<TopGymStats>> getTopGymsByCompletedWorkouts() {
        List<TopGymStats> stats = statisticsService.getTopGymsByCompletedWorkouts();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/top-gyms/rating")
    public ResponseEntity<List<TopGymStats>> getTopGymsByRating() {
        List<TopGymStats> stats = statisticsService.getTopGymsByRating();
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasAuthority('SuperAdmin')")
    @GetMapping("/gym/{gymId}")
    @Operation(summary = "Get detailed statistics for a specific gym", 
               description = "Retrieves comprehensive statistics for a specific gym including subscribers, coaches, revenue, and workout metrics")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Successfully retrieved gym statistics"),
        @ApiResponse(responseCode = "404", description = "Gym not found"),
        @ApiResponse(responseCode = "403", description = "Access denied - SuperAdmin role required"),
        @ApiResponse(responseCode = "401", description = "Unauthorized - Invalid or missing JWT token")
    })
    public ResponseEntity<GymStatistics> getGymStatistics(
            @Parameter(description = "ID of the gym to get statistics for", required = true, example = "1")
            @PathVariable Integer gymId) {
        GymStatistics stats = statisticsService.getGymStatistics(gymId);
        return ResponseEntity.ok(stats);
    }
}
