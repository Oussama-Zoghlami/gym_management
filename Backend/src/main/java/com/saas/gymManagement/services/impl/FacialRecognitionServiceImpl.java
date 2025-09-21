package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.services.FacialRecognitionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class FacialRecognitionServiceImpl implements FacialRecognitionService {

    @Value("${facial.recognition.service.url:http://localhost:5000}")
    private String facialRecognitionServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public ResponseEntity<String> deleteMemberByEmail(String email) {
        try {
            String url = facialRecognitionServiceUrl + "/api/delete-member-by-email";
            
            Map<String, String> requestBody = new HashMap<>();
            requestBody.put("email", email);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, 
                HttpMethod.DELETE, 
                request, 
                String.class
            );
            
            log.info("Successfully deleted member from facial recognition service: {}", email);
            return response;
            
        } catch (Exception e) {
            log.error("Error deleting member from facial recognition service: {}", e.getMessage());
            // Return success even if facial recognition service is not available
            // This prevents user deletion from failing if facial recognition service is down
            return ResponseEntity.ok("Facial recognition service unavailable, but user deleted from database");
        }
    }

    @Override
    public ResponseEntity<String> cleanupDeletedUsers(List<String> activeEmails) {
        try {
            String url = facialRecognitionServiceUrl + "/api/cleanup-deleted-users";
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("active_emails", activeEmails);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                request, 
                String.class
            );
            
            log.info("Successfully cleaned up facial recognition data");
            return response;
            
        } catch (Exception e) {
            log.error("Error cleaning up facial recognition data: {}", e.getMessage());
            // Return success even if facial recognition service is not available
            return ResponseEntity.ok("Facial recognition service unavailable, but cleanup attempted");
        }
    }
}
