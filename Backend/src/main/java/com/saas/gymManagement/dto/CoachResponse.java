package com.saas.gymManagement.dto;

import lombok.Data;

@Data
public class CoachResponse {
    private Integer id;
    private String firstname;
    private String lastname;
    private String email;
    private String phone;
    private String speciality;
}


