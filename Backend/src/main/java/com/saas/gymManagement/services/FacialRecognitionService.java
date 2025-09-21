package com.saas.gymManagement.services;

import org.springframework.http.ResponseEntity;

public interface FacialRecognitionService {
    
    /**
     * Delete a member from facial recognition service by email
     * @param email the email of the member to delete
     * @return ResponseEntity with the result
     */
    ResponseEntity<String> deleteMemberByEmail(String email);
    
    /**
     * Clean up facial recognition data for users that no longer exist in the database
     * @param activeEmails list of emails that should remain in the facial recognition system
     * @return ResponseEntity with the cleanup result
     */
    ResponseEntity<String> cleanupDeletedUsers(java.util.List<String> activeEmails);
}
