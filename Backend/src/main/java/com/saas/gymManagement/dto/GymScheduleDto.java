package com.saas.gymManagement.dto;

import lombok.Data;

@Data
public class GymScheduleDto {
    private Long id;
    private String dayOfWeek; // MONDAY..SUNDAY
    private String openTime;  // HH:mm
    private String closeTime; // HH:mm
    private String note;
}


