package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.GymResponse;
import com.saas.gymManagement.dto.GymPhotoResponse;
import com.saas.gymManagement.dto.GymScheduleDto;
import com.saas.gymManagement.repositories.GymRepository;
import com.saas.gymManagement.repositories.GymRatingRepository;
import com.saas.gymManagement.services.GymScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/member")
@RequiredArgsConstructor
public class MemberController {

    @Autowired
    private GymRepository gymRepository;

    @Autowired
    private GymRatingRepository gymRatingRepository;

    @Autowired
    private GymScheduleService gymScheduleService;

    @PreAuthorize("hasAuthority('MEMBER')")
    @GetMapping("/gyms")
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

    @PreAuthorize("hasAuthority('MEMBER')")
    @GetMapping("/gym/{gymId}/schedule")
    public ResponseEntity<List<GymScheduleDto>> getGymSchedule(@PathVariable Integer gymId) {
        List<GymScheduleDto> schedules = gymScheduleService.getPublicSchedulesForGym(gymId);
        return ResponseEntity.ok(schedules);
    }
}