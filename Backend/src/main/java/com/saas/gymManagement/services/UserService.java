package com.saas.gymManagement.services;

import com.saas.gymManagement.models.User;
import org.springframework.security.core.userdetails.UserDetailsService;

import java.util.Optional;

public interface UserService {

    UserDetailsService userDetailsService();
    
    User findByEmail(String email);
}
