# Gym Management System - Backend

## Overview
This is a comprehensive Spring Boot backend application for a Gym Management System (SaaS) that provides multi-tenant gym management capabilities with role-based access control, subscription management, and real-time messaging.

## 🏗️ Architecture

### Technology Stack
- **Framework**: Spring Boot 3.x
- **Database**: MySQL with JPA/Hibernate
- **Security**: Spring Security with JWT
- **Real-time**: WebSocket with STOMP
- **Documentation**: Swagger/OpenAPI 3
- **Build Tool**: Maven
- **Java Version**: 17+

### Key Features
- 🔐 **JWT Authentication & Authorization**
- 👥 **Role-based Access Control** (SuperAdmin, Admin, Coach, Member)
- 📧 **Email Notifications** (User approval, password reset)
- 💳 **Stripe Payment Integration**
- 💬 **Real-time Messaging** (WebSocket)
- 📊 **Comprehensive Statistics & Analytics**
- 🏋️ **Workout Plan Management**
- 📅 **Schedule Management**
- ⭐ **Rating & Review System**
- 📁 **File Upload Management**

## 🔐 Authentication & Authorization

### JWT Implementation
The system uses JWT (JSON Web Tokens) for stateless authentication:

```java
// JWT Filter processes every request
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    // Extracts JWT from Authorization header
    // Validates token and sets security context
}
```

### User Registration & Approval Flow
1. **User Registration**: Users sign up with basic information
2. **Pending Status**: New users are marked as `confirmed = false`
3. **SuperAdmin Approval**: SuperAdmin reviews and approves/rejects users
4. **Email Notification**: Approved users receive login credentials via email
5. **Login Access**: Only approved users can log in

### Role-Based Access Control
```java
// Security Configuration
.requestMatchers("/api/v1/superAdmin/**").hasAnyAuthority(Role.SuperAdmin.name())
.requestMatchers("/api/v1/admin/**").hasAnyAuthority(Role.Admin.name())
.requestMatchers("/api/v1/coach/**").hasAnyAuthority(Role.Coach.name())
.requestMatchers("/api/v1/member/**").hasAnyAuthority(Role.Member.name())
```

**Roles:**
- **SuperAdmin**: System-wide management, user approval, statistics
- **Admin**: Gym-specific management, coach management
- **Coach**: Member management, workout plans, messaging
- **Member**: Personal dashboard, subscription management

## 📧 Email Service

### Email Templates
The system sends various email notifications:

1. **User Approval Email**
   - Sent when SuperAdmin approves a user
   - Contains login credentials and dashboard link

2. **User Rejection Email**
   - Sent when SuperAdmin rejects a user
   - Explains rejection and contact information

3. **Coach Welcome Email**
   - Sent when Admin creates a coach account
   - Contains temporary password and login instructions

4. **Password Reset Email**
   - Sent when user requests password reset
   - Contains secure reset link with 1-hour expiration

### Email Configuration
```java
@Service
public class EmailService {
    @Autowired
    private JavaMailSender javaMailSender;
    
    // HTML email templates with styling
    // Error handling for email failures
}
```

## 💳 Stripe Payment Integration

### Subscription Management
The system integrates with Stripe for subscription payments:

```java
// Subscription Entity
@Entity
public class Subscription {
    private String stripeSubscriptionId;
    private BigDecimal amount;
    private SubscriptionStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
```

### Payment Flow
1. **Subscription Creation**: User selects gym and subscription plan
2. **Stripe Checkout**: Redirects to Stripe payment page
3. **Webhook Handling**: Processes payment confirmations
4. **Status Updates**: Updates subscription status in database
5. **Access Control**: Grants gym access based on active subscription

### Subscription Statuses
- **ACTIVE**: Payment successful, user has access
- **PENDING**: Payment processing
- **CANCELLED**: User cancelled subscription
- **EXPIRED**: Subscription period ended

## 💬 Real-time Messaging

### WebSocket Implementation
The system uses WebSocket with STOMP protocol for real-time messaging:

```java
// WebSocket Configuration
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // Configures message broker and endpoints
}
```

### Message Features
- **Real-time Chat**: Instant messaging between users
- **Typing Indicators**: Shows when someone is typing
- **Read Receipts**: Tracks message read status
- **Notifications**: Real-time notification delivery
- **User-specific Queues**: Messages routed to specific users

### Message Flow
1. **Connection**: User connects to WebSocket endpoint
2. **Authentication**: JWT token validated for WebSocket connection
3. **Subscription**: User subscribes to personal message queue
4. **Message Sending**: Messages sent via STOMP protocol
5. **Real-time Delivery**: Messages delivered instantly to recipients

## 📊 Statistics & Analytics

### Comprehensive Statistics
The system provides detailed analytics for SuperAdmins:

```java
@Service
public class StatisticsService {
    // Overall system statistics
    public OverallStatistics getOverallStatistics()
    
    // Top performing gyms by various metrics
    public List<TopGymStats> getTopGymsBySubscriptions()
    public List<TopGymStats> getTopGymsByRevenue()
    public List<TopGymStats> getTopGymsByCoaches()
    public List<TopGymStats> getTopGymsByWorkoutPlans()
    public List<TopGymStats> getTopGymsByCompletedWorkouts()
    public List<TopGymStats> getTopGymsByRating()
    
    // Individual gym statistics
    public GymStatistics getGymStatistics(Integer gymId)
}
```

### Metrics Tracked
- **User Statistics**: Total users, coaches, members, admins
- **Subscription Metrics**: Active subscriptions, revenue
- **Gym Performance**: Top gyms by various criteria
- **Workout Analytics**: Completed workouts, workout plans
- **Rating System**: Average ratings, review counts

## 🏋️ Workout Management

### Workout Plan System
- **Plan Creation**: Coaches create workout plans
- **Plan Assignment**: Plans assigned to members
- **Progress Tracking**: Members mark workouts as completed
- **Statistics**: Track completion rates and performance

### Schedule Management
- **Coach Schedules**: Coaches set availability
- **Member Booking**: Members book sessions with coaches
- **Calendar Integration**: Google Calendar integration for meetings

## 📁 File Management

### Upload System
- **Gym Photos**: Multiple photos per gym
- **User Avatars**: Profile picture uploads
- **Document Storage**: Secure file storage
- **Image Processing**: Automatic image optimization

### File Structure
```
uploads/
├── {gymId}/
│   ├── gym_photos/
│   └── documents/
└── users/
    └── avatars/
```

## 🔧 Configuration

### Database Configuration
```properties
# application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/gym_management
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### Security Configuration
```properties
# JWT Configuration
jwt.secret=your_jwt_secret_key
jwt.expiration=86400000  # 24 hours
```

### Email Configuration
```properties
# Email Settings
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=your_app_password
```

### Stripe Configuration
```properties
# Stripe Settings
stripe.public.key=your_stripe_public_key
stripe.secret.key=your_stripe_secret_key
stripe.webhook.secret=your_webhook_secret
```

## 🚀 API Documentation

### Swagger Integration
The system includes comprehensive API documentation:
- **Swagger UI**: Available at `/swagger-ui.html`
- **OpenAPI Spec**: Available at `/v3/api-docs`
- **Authentication**: JWT Bearer token support

### Key API Endpoints

#### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/signin` - User login
- `POST /api/v1/auth/signupAdmin` - Admin registration

#### SuperAdmin
- `GET /api/v1/superAdmin/pending-users` - Get pending users
- `POST /api/v1/superAdmin/{userId}/approve` - Approve user
- `POST /api/v1/superAdmin/{userId}/reject` - Reject user

#### Statistics
- `GET /api/v1/statistics/overall` - Overall statistics
- `GET /api/v1/statistics/top-gyms/subscriptions` - Top gyms by subscriptions
- `GET /api/v1/statistics/top-gyms/revenue` - Top gyms by revenue

#### Messaging
- `POST /api/v1/messages` - Send message
- `GET /api/v1/messages/conversation/{userId}` - Get conversation
- `PUT /api/v1/messages/{messageId}/read` - Mark as read

## 🛠️ Development Setup

### Prerequisites
- Java 17+
- Maven 3.6+
- MySQL 8.0+
- IDE (IntelliJ IDEA, Eclipse, VS Code)

### Installation Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd Backend
   ```

2. **Database Setup**
   ```sql
   CREATE DATABASE gym_management;
   ```

3. **Configuration**
   - Update `application.properties` with your database credentials
   - Configure email settings
   - Set up Stripe keys

4. **Build & Run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```

5. **Access Application**
   - API: `http://localhost:8080`
   - Swagger UI: `http://localhost:8080/swagger-ui.html`

## 🔒 Security Features

### Password Security
- **BCrypt Hashing**: Passwords hashed with BCrypt
- **Password Reset**: Secure token-based password reset
- **Temporary Passwords**: Auto-generated for new coaches

### Data Protection
- **CORS Configuration**: Configured for frontend access
- **Input Validation**: Comprehensive input validation
- **SQL Injection Prevention**: JPA/Hibernate protection
- **XSS Protection**: Input sanitization

### Access Control
- **JWT Expiration**: Tokens expire after 24 hours
- **Role-based Endpoints**: Strict endpoint access control
- **File Upload Security**: Secure file upload handling

## 📈 Performance & Scalability

### Database Optimization
- **JPA Queries**: Optimized database queries
- **Connection Pooling**: HikariCP connection pooling
- **Indexing**: Proper database indexing

### Caching
- **Query Caching**: Hibernate second-level cache
- **Session Management**: Stateless JWT sessions

### Monitoring
- **Health Checks**: Spring Boot Actuator
- **Logging**: Comprehensive logging configuration
- **Error Handling**: Global exception handling

## 🧪 Testing

### Test Structure
- **Unit Tests**: Service and repository tests
- **Integration Tests**: API endpoint tests
- **Security Tests**: Authentication and authorization tests

### Running Tests
```bash
mvn test                    # Run all tests
mvn test -Dtest=ClassName   # Run specific test class
```

## 🚀 Deployment

### Production Configuration
- **Environment Variables**: Use environment variables for sensitive data
- **Database**: Use production MySQL instance
- **SSL**: Configure HTTPS for production
- **Monitoring**: Set up application monitoring

### Docker Support
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/gymManagement-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

## 📝 API Usage Examples

### User Registration
```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "Member"
  }'
```

### User Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Statistics
```bash
curl -X GET http://localhost:8080/api/v1/statistics/overall \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

**Built with ❤️ using Spring Boot**
