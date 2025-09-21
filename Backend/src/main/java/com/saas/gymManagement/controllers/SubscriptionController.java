package com.saas.gymManagement.controllers;

import com.saas.gymManagement.models.Subscription;
import com.saas.gymManagement.models.SubscriptionPlan;
import com.saas.gymManagement.models.User;
import com.saas.gymManagement.services.SubscriptionService;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class SubscriptionController {
    
    private final SubscriptionService subscriptionService;
    
    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;
    
    @GetMapping("/stripe-public-key")
    public ResponseEntity<Map<String, String>> getStripePublicKey() {
        Map<String, String> response = new HashMap<>();
        response.put("publicKey", subscriptionService.getStripePublicKey());
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        try {
            User user = (User) authentication.getPrincipal();
            Integer gymId = Integer.valueOf(request.get("gymId").toString());
            String planStr = request.get("plan").toString();
            SubscriptionPlan plan = SubscriptionPlan.valueOf(planStr.toUpperCase());
            
            String checkoutUrl = subscriptionService.createCheckoutSession(user.getId(), gymId, plan);
            
            Map<String, String> response = new HashMap<>();
            response.put("checkoutUrl", checkoutUrl);
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to create checkout session: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/active")
    public ResponseEntity<Optional<Subscription>> getActiveSubscription(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Optional<Subscription> subscription = subscriptionService.getActiveSubscription(user.getId());
        return ResponseEntity.ok(subscription);
    }
    
    @GetMapping("/history")
    public ResponseEntity<java.util.List<Subscription>> getSubscriptionHistory(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        java.util.List<Subscription> subscriptions = subscriptionService.getSubscriptionHistory(user.getId());
        return ResponseEntity.ok(subscriptions);
    }
    
    @GetMapping("/check-subscription/{gymId}")
    public ResponseEntity<Map<String, Boolean>> checkSubscription(
            @PathVariable Integer gymId,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        boolean hasSubscription = subscriptionService.hasActiveSubscription(user.getId(), gymId);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasActiveSubscription", hasSubscription);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/cancel/{subscriptionId}")
    public ResponseEntity<Map<String, String>> cancelSubscription(
            @PathVariable Long subscriptionId,
            Authentication authentication) {
        
        try {
            subscriptionService.cancelSubscription(subscriptionId);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Subscription canceled successfully");
            return ResponseEntity.ok(response);
            
        } catch (StripeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to cancel subscription: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "An error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @PostMapping("/complete-payment")
    public ResponseEntity<Map<String, Object>> completePayment(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        try {
            System.out.println("🎯 POST /complete-payment called");
            System.out.println("📝 Request body: " + request);
            
            String sessionId = request.get("sessionId");
            if (sessionId == null || sessionId.trim().isEmpty()) {
                System.err.println("❌ Missing sessionId in request");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Session ID is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            User user = (User) authentication.getPrincipal();
            if (user == null) {
                System.err.println("❌ No authenticated user found");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "User not authenticated");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }
            
            System.out.println("👤 User authenticated: " + user.getId() + " (" + user.getEmail() + ")");
            System.out.println("🔑 Processing sessionId: " + sessionId);
            
            Subscription subscription = subscriptionService.createSubscriptionFromSession(sessionId, user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Subscription created successfully");
            response.put("subscription", subscription);
            System.out.println("✅ Payment completed successfully for user " + user.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error in complete-payment endpoint: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to complete payment: " + e.getMessage());
            errorResponse.put("details", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
        
        try {
            Event event;
            
            // For development: skip signature verification if no webhook secret
            if (webhookSecret == null || webhookSecret.trim().isEmpty() || 
                webhookSecret.equals("whsec_your_webhook_secret_here") || sigHeader == null) {
                // Parse event without verification (development only)
                event = Event.GSON.fromJson(payload, Event.class);
            } else {
                // Verify webhook signature (production)
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            }
            
            switch (event.getType()) {
                case "checkout.session.completed":
                    handleCheckoutSessionCompleted(event);
                    break;
                case "customer.subscription.updated":
                case "customer.subscription.deleted":
                    // Handle subscription updates/cancellations if needed
                    break;
                default:
                    break;
            }
            
            return ResponseEntity.ok("Success");
            
        } catch (Exception e) {
            System.err.println("Webhook error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Webhook error: " + e.getMessage());
        }
    }
    
    private void handleCheckoutSessionCompleted(Event event) {
        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        
        if (dataObjectDeserializer.getObject().isPresent()) {
            Session session = (Session) dataObjectDeserializer.getObject().get();
            
            // Extract metadata
            Integer userId = Integer.valueOf(session.getMetadata().get("userId"));
            Integer gymId = Integer.valueOf(session.getMetadata().get("gymId"));
            SubscriptionPlan plan = SubscriptionPlan.valueOf(session.getMetadata().get("plan"));
            
            // Create subscription record
            subscriptionService.createSubscription(session.getSubscription(), userId, gymId, plan);
        }
    }
}
