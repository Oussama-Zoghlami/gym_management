package com.saas.gymManagement.dto;

import lombok.Data;

@Data
public class FacialSignInRequest {
    private String email;
    private String memberId;
    private Integer gymId;
    private String firstname;
    private String lastname;
}
