package com.saas.gymManagement.dto;

import com.saas.gymManagement.models.Role;
import lombok.Data;

@Data
public class JwtAuthenticationResponse {

    private String token ;
    private String refreshToken;
    private String role;

    public String getToken() {
        return token;
    }
    public void setToken(String token) {
        this.token = token;
    }
    public String getRefreshToken() {
        return refreshToken;
    }
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
}
