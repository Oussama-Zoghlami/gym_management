package com.saas.gymManagement.dto;

import lombok.Data;

@Data
public class GymRatingRequest {
    private Integer gymId;
    private Integer rating; // 1 to 5
    private String comment;
}
