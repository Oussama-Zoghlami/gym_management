package com.saas.gymManagement.controllers;

import com.saas.gymManagement.models.User;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.services.impl.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/email")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetails userDetails) {
            Optional<User> user = userRepository.findByEmail(userDetails.getUsername());
            return user.orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping("/send-to-member")
    public ResponseEntity<String> sendEmailToMember(@RequestBody EmailToMemberRequest request) {
        try {
            // Get current user (coach/admin sending the email)
            User currentUser = getCurrentUser();
            String senderName = currentUser.getFirstname() + " " + currentUser.getLastname();
            String senderRole = currentUser.getRole().name();

            // Send email to member
            emailService.sendEmailToMember(
                request.getMemberEmail(),
                request.getMemberName(),
                senderName,
                senderRole,
                request.getSubject(),
                request.getContent()
            );

            return ResponseEntity.ok("Email sent successfully to " + request.getMemberName());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to send email: " + e.getMessage());
        }
    }

    // DTO for email request
    public static class EmailToMemberRequest {
        private String memberEmail;
        private String memberName;
        private String content;
        private String subject;

        // Getters and setters
        public String getMemberEmail() { return memberEmail; }
        public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }
        public String getMemberName() { return memberName; }
        public void setMemberName(String memberName) { this.memberName = memberName; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
    }
}
