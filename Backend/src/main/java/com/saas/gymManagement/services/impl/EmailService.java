package com.saas.gymManagement.services.impl;

import com.saas.gymManagement.models.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;



    public void sendLoginCredentialsEmail(String to, String firstname, String email,  String role) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlMsg = String.format("""
                    <html>
                        <body>
                            <h2>Dear %s,</h2>
                            <p>Your account has been approved by the SuperAdmin.</p>
                            <ul>
                                <li><strong>Email:</strong> %s</li>
                                <li><strong>Role:</strong> %s</li>
                            </ul>
                            <p>You can now log in to your dashboard using the link below:</p>
                            <a href="http://localhost:4200/signin">Login to Dashboard</a>
                            <p>Best regards,<br/>The Gym SaaS Team</p>
                        </body>
                    </html>
                    """, firstname, email, role);

            helper.setText(htmlMsg, true); // true indicates HTML content
            helper.setTo(to);
            helper.setSubject("Your Gym SaaS Account Has Been Approved");
            helper.setFrom("oussamazoghlami62@gmail.com"); // Replace with your sender email

            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            // Log and continue (don’t break the approval flow on mail issues)
            System.err.println("Failed to send approval email: " + e.getMessage());
        }
    }

    public void sendRejectionEmail(String to, String firstname) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlMsg = String.format("""
                    <html>
                        <body>
                            <h2>Dear %s,</h2>
                            <p>We regret to inform you that your account registration has been declined by the SuperAdmin.</p>
                            <p>If you believe this is an error, please contact the administrator for more information.</p>
                            <p>Thank you for your interest in Safe Fitness.</p>
                            <p>Best regards,<br/>The Safe Fitness Team</p>
                        </body>
                    </html>
                    """, firstname);

            helper.setText(htmlMsg, true); // true indicates HTML content
            helper.setTo(to);
            helper.setSubject("Safe Fitness Account Registration - Status Update");
            helper.setFrom("oussamazoghlami62@gmail.com"); // Replace with your sender email

            javaMailSender.send(mimeMessage);

        } catch (Exception e) {
            System.err.println("Failed to send rejection email: " + e.getMessage());
        }
    }


    public void sendCoachWelcomeEmail(String to, String firstname, String email, String tempPassword) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlMsg = String.format("""
                    <html>
                        <body>
                            <h2>Welcome %s!</h2>
                            <p>Your coach account has been created by the Admin.</p>
                            <ul>
                                <li><strong>Email:</strong> %s</li>
                                <li><strong>Temporary Password:</strong> %s</li>
                            </ul>
                            <p>
                                Please log in and change your password immediately. 
                                <a href=\"http://localhost:4200/signin\">Login here</a>
                            </p>
                            <p>Best regards,<br/>Safe Fitness Team</p>
                        </body>
                    </html>
                    """, firstname, email, tempPassword);

            helper.setText(htmlMsg, true);
            helper.setTo(to);
            helper.setSubject("Your Coach Account - Temporary Credentials");
            helper.setFrom("oussamazoghlami62@gmail.com");

            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send coach welcome email: " + e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String to, String firstname, String resetLink) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlMsg = String.format("""
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <h1 style="color: #667eea; margin: 0;">Safe Fitness</h1>
                                </div>
                                
                                <h2 style="color: #1f2937;">Password Reset Request</h2>
                                
                                <p>Dear %s,</p>
                                
                                <p>You have requested to reset your password for your Safe Fitness account. Click the button below to reset your password:</p>
                                
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="%s" style="background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                                        Reset Password
                                    </a>
                                </div>
                                
                                <p><strong>Important:</strong></p>
                                <ul>
                                    <li>This link will expire in 1 hour for security reasons</li>
                                    <li>If you did not request this password reset, please ignore this email</li>
                                    <li>Your password will remain unchanged until you click the link above</li>
                                </ul>
                                
                                <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                                <p style="word-break: break-all; color: #667eea;">%s</p>
                                
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                                
                                <p style="color: #6b7280; font-size: 14px;">
                                    Best regards,<br/>
                                    The Safe Fitness Team
                                </p>
                            </div>
                        </body>
                    </html>
                    """, firstname, resetLink, resetLink);

            helper.setText(htmlMsg, true); // true indicates HTML content
            helper.setTo(to);
            helper.setSubject("Password Reset Request - Safe Fitness");
            helper.setFrom("oussamazoghlami62@gmail.com");

            javaMailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send password reset email: " + e.getMessage());
        }
    }

    public void sendEmailToMember(String memberEmail, String memberName, String senderName, String senderRole, String subject, String content) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

            String htmlMsg = String.format("""
                    <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                <div style="background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
                                    <h1 style="margin: 0; font-size: 24px;">Safe Fitness</h1>
                                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Message from Gym Staff</p>
                                </div>
                                
                                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                                    <h2 style="color: #333; margin-bottom: 20px;">Hello %s,</h2>
                                    
                                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #555;">Message from %s (%s):</p>
                                        <p style="margin: 0; white-space: pre-wrap;">%s</p>
                                    </div>
                                    
                                    <p style="color: #666; font-size: 14px; margin-top: 30px;">
                                        If you have any questions or need assistance, please don't hesitate to contact us.
                                    </p>
                                    
                                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                        <p style="color: #999; font-size: 12px; margin: 0;">
                                            © 2024 Safe Fitness. All rights reserved.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </body>
                    </html>
                    """, memberName, senderName, senderRole, content);

            helper.setText(htmlMsg, true);
            helper.setTo(memberEmail);
            helper.setSubject(subject);
            helper.setFrom("noreply@safefitness.com");

            javaMailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email to member", e);
        }
    }
}
