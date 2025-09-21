package com.saas.gymManagement.controllers;

import com.saas.gymManagement.dto.*;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.services.AuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthentiicationController {



    @Autowired
    AuthenticationService authenticationService;

    @PostMapping("/signup")
    public ResponseEntity<User> signup(@RequestBody SignUpRequest signUpRequest) {
        System.out.println("Received signup request: " + signUpRequest);
        User user = authenticationService.signup(signUpRequest);
        System.out.println("User created: " + user);
        return ResponseEntity.ok(user);
    }
    @PostMapping("/signupAdmin")
    public ResponseEntity<User> signupAdmin(@RequestBody SignUpRequestAdmin requestAdmin) {
        User createdAdmin = authenticationService.signupAdmin(requestAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAdmin);
    }

    @PostMapping("/signin")
    public ResponseEntity<JwtAuthenticationResponse> signin(@RequestBody SignInRequest signinRequest) {
        return ResponseEntity.ok(authenticationService.signin(signinRequest));
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtAuthenticationResponse> refresh(@RequestBody RefreshTokenRequest refreshTokenRequest) {
        return ResponseEntity.ok(authenticationService.refreshToken(refreshTokenRequest));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            authenticationService.forgotPassword(request);
            return ResponseEntity.ok("Password reset email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            authenticationService.resetPassword(request);
            return ResponseEntity.ok("Password reset successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/signin-facial")
    public ResponseEntity<JwtAuthenticationResponse> signinFacial(@RequestBody FacialSignInRequest facialRequest) {
        try {
            return ResponseEntity.ok(authenticationService.signinFacial(facialRequest));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
