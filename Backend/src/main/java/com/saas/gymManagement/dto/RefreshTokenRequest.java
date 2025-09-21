package com.saas.gymManagement.dto;

import lombok.Data;


public class RefreshTokenRequest {
    private String token ;

    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }
}
