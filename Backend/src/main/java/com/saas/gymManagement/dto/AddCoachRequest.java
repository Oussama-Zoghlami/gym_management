package com.saas.gymManagement.dto;

import lombok.Data;

@Data
public class AddCoachRequest {
    private String firstname;
    private String lastname;
    private String email;
    private String phone;
    private String cin;
    private String speciality;
    private String password; // optional; if null/empty backend will generate a temp password
    private String gymName; // optional; if provided, assign coach to this gym (owned by current admin)
}


