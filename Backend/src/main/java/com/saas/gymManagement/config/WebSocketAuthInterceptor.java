package com.saas.gymManagement.config;

import com.saas.gymManagement.services.JWTService;
import com.saas.gymManagement.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    @Autowired
    private JWTService jwtService;

    @Autowired
    private UserService userService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            System.out.println("DEBUG: WebSocket CONNECT command received");
            List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
            
            if (authorizationHeaders != null && !authorizationHeaders.isEmpty()) {
                String authHeader = authorizationHeaders.get(0);
                System.out.println("DEBUG: WebSocket auth header found: " + (authHeader != null ? "Bearer [TOKEN]" : "null"));
                
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    
                    try {
                        // Validate JWT token
                        String userEmail = jwtService.extractUserName(token);
                        System.out.println("DEBUG: WebSocket auth - extracted email: " + userEmail);
                        
                        if (userEmail != null) {
                            UserDetailsService userDetailsService = userService.userDetailsService();
                            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                            
                            if (jwtService.isTokenValid(token, userDetails)) {
                                UsernamePasswordAuthenticationToken authToken = 
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                SecurityContextHolder.getContext().setAuthentication(authToken);
                                
                                // Set the user as the principal for the WebSocket session
                                accessor.setUser(authToken);
                                System.out.println("DEBUG: WebSocket authentication successful for user: " + userEmail);
                            } else {
                                System.out.println("DEBUG: WebSocket authentication failed - invalid token for user: " + userEmail);
                                // Reject the connection
                                throw new RuntimeException("Invalid token");
                            }
                        } else {
                            System.out.println("DEBUG: WebSocket authentication failed - could not extract email from token");
                            throw new RuntimeException("Could not extract email from token");
                        }
                    } catch (Exception e) {
                        System.out.println("DEBUG: WebSocket authentication failed: " + e.getMessage());
                        e.printStackTrace();
                        // Reject the connection
                        throw new RuntimeException("Authentication failed: " + e.getMessage());
                    }
                } else {
                    System.out.println("DEBUG: WebSocket authentication failed - no Bearer token found");
                    throw new RuntimeException("No Bearer token found");
                }
            } else {
                System.out.println("DEBUG: WebSocket authentication failed - no Authorization header found");
                throw new RuntimeException("No Authorization header found");
            }
        }
        
        return message;
    }
}
