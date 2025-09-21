package com.saas.gymManagement.services;

import com.saas.gymManagement.models.*;
import com.saas.gymManagement.repositories.SubscriptionRepository;
import com.saas.gymManagement.repositories.UserRepository;
import com.saas.gymManagement.repositories.GymRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SubscriptionService {
    
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    
    @Value("${stripe.public.key}")
    private String stripePublicKey;
    
    @Value("${stripe.webhook.secret:}")
    private String webhookSecret;
    
    public String getStripePublicKey() {
        return stripePublicKey;
    }
    
    @Transactional
    public String createCheckoutSession(Integer userId, Integer gymId, SubscriptionPlan plan) throws StripeException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new RuntimeException("Gym not found"));
        
        // Create or get Stripe customer
        String customerId = getOrCreateStripeCustomer(user);
        
        // Get pricing from gym or use default if not set
        BigDecimal price;
        if (plan == SubscriptionPlan.MONTHLY && gym.getMonthlyPrice() != null) {
            price = gym.getMonthlyPrice();
        } else if (plan == SubscriptionPlan.ANNUAL && gym.getAnnualPrice() != null) {
            price = gym.getAnnualPrice();
        } else {
            // Fallback to default pricing if gym pricing not set
            price = BigDecimal.valueOf(plan.getPrice());
        }
        
        // Create checkout session
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl("http://localhost:4200/member/subscription-success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl("http://localhost:4200/member/subscription-cancel")
                .setCustomer(customerId)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(price.multiply(BigDecimal.valueOf(100)).longValue()) // Convert to cents
                                                .setRecurring(
                                                        SessionCreateParams.LineItem.PriceData.Recurring.builder()
                                                                .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.valueOf(plan.getInterval().toUpperCase()))
                                                                .build()
                                                )
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(gym.getName() + " - " + plan.getDisplayName() + " Subscription")
                                                                .setDescription("Access to " + gym.getName() + " gym facilities")
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                )
                .putMetadata("userId", userId.toString())
                .putMetadata("gymId", gymId.toString())
                .putMetadata("plan", plan.name())
                .build();
        
        Session session = Session.create(params);
        return session.getUrl();
    }
    
    private String getOrCreateStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) {
            return user.getStripeCustomerId();
        }
        
        CustomerCreateParams params = CustomerCreateParams.builder()
                .setEmail(user.getEmail())
                .setName(user.getFirstname() + " " + user.getLastname())
                .build();
        
        Customer customer = Customer.create(params);
        user.setStripeCustomerId(customer.getId());
        userRepository.save(user);
        
        return customer.getId();
    }
    
    @Transactional
    public Subscription createSubscription(String stripeSubscriptionId, Integer userId, Integer gymId, SubscriptionPlan plan) {
        try {
            System.out.println("🔍 Creating subscription - userId: " + userId + ", gymId: " + gymId + ", plan: " + plan);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
            Gym gym = gymRepository.findById(gymId)
                    .orElseThrow(() -> new RuntimeException("Gym not found with ID: " + gymId));
            
            System.out.println("👤 User found: " + user.getEmail());
            System.out.println("🏋️ Gym found: " + gym.getName());
            System.out.println("🔑 User stripe customer ID: " + user.getStripeCustomerId());
            
            // If user doesn't have a stripe customer ID, create one
            String stripeCustomerId = user.getStripeCustomerId();
            if (stripeCustomerId == null || stripeCustomerId.trim().isEmpty()) {
                System.out.println("🆕 Creating new Stripe customer for user");
                try {
                    stripeCustomerId = getOrCreateStripeCustomer(user);
                } catch (StripeException e) {
                    throw new RuntimeException("Failed to create Stripe customer: " + e.getMessage(), e);
                }
            }
            
            Subscription subscription = new Subscription();
            subscription.setUser(user);
            subscription.setGym(gym);
            subscription.setStripeCustomerId(stripeCustomerId);
            subscription.setStripeSubscriptionId(stripeSubscriptionId);
            subscription.setPlan(plan);
            subscription.setStatus(SubscriptionStatus.ACTIVE);
            
            // Set amount based on gym pricing or default
            BigDecimal amount;
            if (plan == SubscriptionPlan.MONTHLY && gym.getMonthlyPrice() != null) {
                amount = gym.getMonthlyPrice();
            } else if (plan == SubscriptionPlan.ANNUAL && gym.getAnnualPrice() != null) {
                amount = gym.getAnnualPrice();
            } else {
                amount = BigDecimal.valueOf(plan.getPrice());
            }
            subscription.setAmount(amount);
            subscription.setStartDate(LocalDateTime.now());
            
            // Set end date based on plan
            if (plan == SubscriptionPlan.MONTHLY) {
                subscription.setEndDate(LocalDateTime.now().plusMonths(1));
            } else {
                subscription.setEndDate(LocalDateTime.now().plusYears(1));
            }
            
            System.out.println("💾 Saving subscription to database...");
            Subscription savedSubscription = subscriptionRepository.save(subscription);
            System.out.println("✅ Subscription saved with ID: " + savedSubscription.getId());
            
            // Update user's subscribed gym
            System.out.println("👤 Updating user's subscribed gym...");
            user.setSubscribedGym(gym);
            userRepository.save(user);
            System.out.println("✅ User updated successfully");
            
            return savedSubscription;
            
        } catch (Exception e) {
            System.err.println("❌ Error creating subscription: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Optional<Subscription> getActiveSubscription(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return subscriptionRepository.findActiveSubscriptionByUser(user);
    }
    
    public java.util.List<Subscription> getSubscriptionHistory(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public boolean hasActiveSubscription(Integer userId, Integer gymId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Gym gym = gymRepository.findById(gymId)
                .orElseThrow(() -> new RuntimeException("Gym not found"));
        
        return subscriptionRepository.existsByUserAndGymAndStatus(user, gym, SubscriptionStatus.ACTIVE);
    }
    
    @Transactional
    public Subscription createSubscriptionFromSession(String sessionId, Integer userId) throws StripeException {
        try {
            System.out.println("🔍 Starting createSubscriptionFromSession for sessionId: " + sessionId + ", userId: " + userId);
            
            // Retrieve the session from Stripe
            Session session = Session.retrieve(sessionId);
            System.out.println("📋 Session retrieved: " + session.getId());
            System.out.println("💳 Payment status: " + session.getPaymentStatus());
            System.out.println("✅ Session status: " + session.getStatus());
            
            // Check if session is complete (status should be "complete" not paymentStatus)
            if (!"complete".equals(session.getStatus())) {
                throw new RuntimeException("Session is not completed. Current status: " + session.getStatus());
            }
            
            // Get metadata from session
            Map<String, String> metadata = session.getMetadata();
            System.out.println("📊 Session metadata: " + metadata);
            
            if (metadata == null || metadata.isEmpty()) {
                throw new RuntimeException("Session metadata is null or empty");
            }
            
            String userIdStr = metadata.get("userId");
            String gymIdStr = metadata.get("gymId");
            String planStr = metadata.get("plan");
            
            System.out.println("👤 Metadata userId: " + userIdStr);
            System.out.println("🏋️ Metadata gymId: " + gymIdStr);
            System.out.println("📅 Metadata plan: " + planStr);
            
            if (userIdStr == null || gymIdStr == null || planStr == null) {
                throw new RuntimeException("Session metadata is incomplete. userId: " + userIdStr + ", gymId: " + gymIdStr + ", plan: " + planStr);
            }
            
            Integer sessionUserId = Integer.valueOf(userIdStr);
            Integer gymId = Integer.valueOf(gymIdStr);
            SubscriptionPlan plan = SubscriptionPlan.valueOf(planStr);
            
            // Verify user matches
            if (!sessionUserId.equals(userId)) {
                throw new RuntimeException("User ID mismatch. Expected: " + userId + ", Found: " + sessionUserId);
            }
            
            // Check if subscription already exists for this session
            String stripeSubscriptionId = session.getSubscription();
            System.out.println("🔗 Stripe subscription ID: " + stripeSubscriptionId);
            
            if (stripeSubscriptionId != null) {
                Optional<Subscription> existingSubscription = subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
                if (existingSubscription.isPresent()) {
                    System.out.println("♻️ Returning existing subscription: " + existingSubscription.get().getId());
                    return existingSubscription.get();
                }
            }
            
            // Create the subscription
            System.out.println("🆕 Creating new subscription...");
            Subscription newSubscription = createSubscription(stripeSubscriptionId, userId, gymId, plan);
            System.out.println("✅ Subscription created successfully with ID: " + newSubscription.getId());
            
            return newSubscription;
            
        } catch (Exception e) {
            System.err.println("❌ Error in createSubscriptionFromSession: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Transactional
    public void cancelSubscription(Long subscriptionId) throws StripeException {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));
        
        // Cancel in Stripe
        com.stripe.model.Subscription stripeSubscription = 
                com.stripe.model.Subscription.retrieve(subscription.getStripeSubscriptionId());
        stripeSubscription.cancel();
        
        // Update local subscription
        subscription.setStatus(SubscriptionStatus.CANCELED);
        subscription.setEndDate(LocalDateTime.now());
        subscriptionRepository.save(subscription);
        
        // Remove subscribed gym from user
        User user = subscription.getUser();
        user.setSubscribedGym(null);
        userRepository.save(user);
    }
}
