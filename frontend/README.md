# Gym Management System - Frontend

## Overview
This is a comprehensive Angular frontend application for a Gym Management System (SaaS) that provides a modern, responsive user interface for managing gym operations, members, coaches, subscriptions, and real-time communication. The application features role-based dashboards, real-time messaging, nutrition tracking, and integration with various third-party services.

## 🏗️ Architecture

### Technology Stack
- **Framework**: Angular 17
- **Language**: TypeScript
- **Styling**: SCSS with Material Design
- **State Management**: RxJS Observables
- **HTTP Client**: Angular HttpClient
- **Real-time**: WebSocket with STOMP
- **Build Tool**: Angular CLI
- **Package Manager**: npm

### Key Features
- 🔐 **JWT Authentication & Authorization**
- 👥 **Role-based Dashboards** (SuperAdmin, Admin, Coach, Member)
- 💬 **Real-time Messaging** (WebSocket)
- 🍎 **Nutrition Tracking** (Nutritionix API)
- 🗺️ **Google Maps Integration**
- 📹 **Google Meet Integration**
- 📊 **Statistics & Analytics Dashboard**
- ⭐ **Rating & Review System**
- 📅 **Schedule Management**
- 💳 **Stripe Payment Integration**
- 📱 **Responsive Design**

## 🎨 User Interface

### Design System
- **Material Design**: Google Material Design principles
- **Color Scheme**: Modern gradient-based color palette
- **Typography**: Poppins font family
- **Icons**: Material Icons
- **Responsive**: Mobile-first responsive design
- **Animations**: Smooth transitions and micro-interactions

### Component Architecture
```
src/app/
├── components/           # Feature components
│   ├── admin-dashboard/
│   ├── coach-dashboard/
│   ├── member-dashboard/
│   ├── superadmin-dashboard/
│   ├── statistics-dashboard/
│   ├── nutrition-tracker/
│   ├── coach-messaging/
│   └── ...
├── services/            # Business logic services
│   ├── auth.service.ts
│   ├── nutrition.service.ts
│   ├── websocket.service.ts
│   ├── google-meet-api.service.ts
│   └── ...
├── guards/              # Route guards
├── interceptors/        # HTTP interceptors
├── models/              # TypeScript interfaces
└── layouts/             # Layout components
```

## 🔐 Authentication & Authorization

### JWT Implementation
```typescript
@Injectable()
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, credentials);
  }
  
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, userData);
  }
}
```

### Route Guards
```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('token');
    const userRole = this.getUserRole();
    const requiredRole = route.data['role'];
    
    return token && this.isTokenValid() && this.hasRequiredRole(userRole, requiredRole);
  }
}
```

### Role-based Access Control
- **SuperAdmin**: System-wide management, user approval, statistics
- **Admin**: Gym-specific management, coach management
- **Coach**: Member management, workout plans, messaging
- **Member**: Personal dashboard, subscription management

## 💬 Real-time Messaging

### WebSocket Integration
```typescript
@Injectable()
export class WebSocketService {
  private stompClient: Client | null = null;
  private connected = false;
  
  connect(): void {
    const token = localStorage.getItem('token');
    const socket = new SockJS(`http://localhost:8080/ws`);
    
    this.stompClient = new Client({
      webSocketFactory: () => socket,
      connectHeaders: { 'Authorization': `Bearer ${token}` },
      onConnect: (frame) => {
        this.connected = true;
        this.setupSubscriptions();
      }
    });
    
    this.stompClient.activate();
  }
}
```

### Message Features
- **Real-time Chat**: Instant messaging between users
- **Typing Indicators**: Shows when someone is typing
- **Read Receipts**: Tracks message read status
- **Notifications**: Real-time notification delivery
- **Message History**: Persistent message storage

### Message Service
```typescript
@Injectable()
export class MessageService {
  sendMessage(messageRequest: MessageRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.apiUrl, messageRequest, {
      headers: this.getHeaders()
    });
  }
  
  getConversation(otherUserId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.apiUrl}/conversation/${otherUserId}`, {
      headers: this.getHeaders()
    });
  }
}
```

## 🍎 Nutrition Tracking

### Nutritionix API Integration
```typescript
@Injectable()
export class NutritionService {
  private readonly NUTRITIONIX_API_URL = 'https://trackapi.nutritionix.com/v2';
  private readonly APP_ID = '20bd4122';
  private readonly APP_KEY = 'd9de1facbbd31cbd389a69ef596ea5a3';
  
  searchFood(query: string): Observable<NutritionData[]> {
    const body = { query: query, timezone: 'US/Eastern' };
    
    return this.http.post<NutritionResponse>(`${this.NUTRITIONIX_API_URL}/natural/nutrients`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.foods || []),
      catchError(error => of([]))
    );
  }
}
```

### Nutrition Features
- **Food Search**: Search for foods using natural language
- **Nutritional Information**: Calories, protein, carbs, fat
- **Daily Logging**: Track daily nutrition intake
- **Local Storage**: Persistent nutrition data
- **Progress Tracking**: Monitor nutritional goals

### Nutrition Data Models
```typescript
export interface NutritionData {
  food_name: string;
  nf_calories: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
  serving_weight_grams: number;
  serving_unit: string;
  serving_qty: number;
}

export interface DailyNutritionLog {
  date: string;
  entries: NutritionEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
```

## 🗺️ Google Maps Integration

### Maps Service
```typescript
@Injectable()
export class MapsService {
  private map: google.maps.Map | null = null;
  
  initializeMap(element: HTMLElement, options: google.maps.MapOptions): void {
    this.map = new google.maps.Map(element, options);
  }
  
  addMarker(position: google.maps.LatLng, title: string): google.maps.Marker {
    return new google.maps.Marker({
      position: position,
      map: this.map,
      title: title
    });
  }
}
```

### Maps Features
- **Gym Locations**: Display gym locations on interactive maps
- **Directions**: Get directions to gym locations
- **Location Search**: Search for nearby gyms
- **Custom Markers**: Custom markers for different gym types
- **Responsive Design**: Mobile-friendly map interface

## 📹 Google Meet Integration

### Google Meet API Service
```typescript
@Injectable()
export class GoogleMeetApiService {
  private isSignedIn = false;
  private accessToken: string | null = null;
  
  async signIn(): Promise<boolean> {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: environment.googleMeet.clientId,
      scope: 'https://www.googleapis.com/auth/calendar',
      callback: (response: any) => {
        this.isSignedIn = true;
        this.accessToken = response.access_token;
      }
    });
    
    tokenClient.requestAccessToken();
    return true;
  }
  
  async createMeeting(title: string, startTime?: Date, endTime?: Date): Promise<GoogleMeetInfo> {
    const event = {
      summary: title,
      start: { dateTime: startTime?.toISOString() },
      end: { dateTime: endTime?.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: `gym-meeting-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
    
    return response.json();
  }
}
```

### Google Meet Features
- **Meeting Creation**: Create Google Meet meetings
- **Calendar Integration**: Sync with Google Calendar
- **OAuth Authentication**: Secure Google account integration
- **Meeting Links**: Generate shareable meeting links
- **Schedule Integration**: Integrate with gym scheduling system

## 📊 Statistics Dashboard

### Statistics Service
```typescript
@Injectable()
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;
  
  getOverallStatistics(): Observable<OverallStatistics> {
    return this.http.get<OverallStatistics>(`${this.apiUrl}/overall`);
  }
  
  getTopGymsBySubscriptions(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/subscriptions`);
  }
  
  getTopGymsByRevenue(): Observable<TopGymStats[]> {
    return this.http.get<TopGymStats[]>(`${this.apiUrl}/top-gyms/revenue`);
  }
}
```

### Statistics Features
- **Overall Statistics**: System-wide metrics and KPIs
- **Gym Performance**: Top-performing gyms by various metrics
- **Revenue Analytics**: Revenue tracking and analysis
- **User Statistics**: User growth and engagement metrics
- **Subscription Analytics**: Subscription trends and insights

## 💳 Stripe Payment Integration

### Payment Flow
1. **Subscription Selection**: User selects gym and subscription plan
2. **Stripe Checkout**: Redirects to Stripe payment page
3. **Payment Processing**: Secure payment processing via Stripe
4. **Confirmation**: Payment confirmation and subscription activation
5. **Access Grant**: User gains access to selected gym

### Payment Components
```typescript
@Component({
  selector: 'app-subscription-modal',
  template: `
    <div class="subscription-modal">
      <h2>Choose Your Subscription</h2>
      <div class="plans">
        <div class="plan" *ngFor="let plan of subscriptionPlans">
          <h3>{{ plan.name }}</h3>
          <p class="price">${{ plan.price }}/month</p>
          <button (click)="selectPlan(plan)">Select Plan</button>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionModalComponent {
  selectPlan(plan: SubscriptionPlan): void {
    // Redirect to Stripe checkout
    window.location.href = this.getStripeCheckoutUrl(plan);
  }
}
```

## 🎨 UI Components

### Dashboard Components
- **SuperAdmin Dashboard**: System-wide management interface
- **Admin Dashboard**: Gym-specific management interface
- **Coach Dashboard**: Member and workout management
- **Member Dashboard**: Personal fitness tracking

### Feature Components
- **Statistics Dashboard**: Analytics and reporting
- **Nutrition Tracker**: Food logging and tracking
- **Coach Messaging**: Real-time communication
- **Schedule Management**: Appointment and session booking
- **Rating System**: Gym and service ratings

### Reusable Components
- **Star Rating**: Rating input and display
- **Message Modal**: Message composition and display
- **Subscription Modal**: Payment and subscription management
- **Forgot Password Modal**: Password reset functionality

## 🔧 Configuration

### Environment Configuration
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  googleMeet: {
    clientId: 'your-google-client-id'
  },
  stripe: {
    publicKey: 'your-stripe-public-key'
  },
  nutritionix: {
    appId: 'your-nutritionix-app-id',
    appKey: 'your-nutritionix-app-key'
  }
};
```

### Angular Configuration
```json
// angular.json
{
  "projects": {
    "safe-fitness": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/safe-fitness",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": "src/polyfills.ts",
            "tsConfig": "tsconfig.app.json",
            "styles": ["src/styles.scss"],
            "scripts": []
          }
        }
      }
    }
  }
}
```

## 🚀 Development Setup

### Prerequisites
- Node.js 18+
- npm 8+
- Angular CLI 17+

### Installation Steps
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Update `src/environments/environment.ts` with your API URLs
   - Configure Google Meet client ID
   - Set up Stripe public key

4. **Start Development Server**
   ```bash
   ng serve
   ```

5. **Access Application**
   - Open `http://localhost:4200` in your browser

### Build for Production
```bash
ng build --configuration production
```

## 🧪 Testing

### Unit Testing
```bash
# Run unit tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run specific test file
ng test --include="**/auth.service.spec.ts"
```

### E2E Testing
```bash
# Run e2e tests
ng e2e

# Run e2e tests in headless mode
ng e2e --headless
```

### Testing Structure
```
src/
├── app/
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts
│   └── components/
│       ├── login/
│       │   ├── login.component.ts
│       │   └── login.component.spec.ts
└── e2e/
    ├── src/
    │   ├── app.e2e-spec.ts
    │   └── app.po.ts
    └── protractor.conf.js
```

## 📱 Responsive Design

### Breakpoints
```scss
// Mobile First Approach
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    display: none;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Mobile Features
- **Touch-friendly Interface**: Optimized for touch interactions
- **Responsive Navigation**: Collapsible navigation for mobile
- **Mobile-first Design**: Designed for mobile devices first
- **Progressive Web App**: PWA capabilities for mobile installation

## 🔒 Security Features

### HTTP Interceptors
```typescript
@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('token');
    
    if (token) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(authReq);
    }
    
    return next.handle(req);
  }
}
```

### Security Measures
- **JWT Token Management**: Secure token storage and handling
- **HTTPS Enforcement**: Force HTTPS in production
- **XSS Protection**: Input sanitization and validation
- **CSRF Protection**: Cross-site request forgery protection
- **Content Security Policy**: CSP headers for additional security

## 📈 Performance Optimization

### Lazy Loading
```typescript
// app.routes.ts
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./components/admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardModule)
  },
  {
    path: 'coach',
    loadChildren: () => import('./components/coach-dashboard/coach-dashboard.module').then(m => m.CoachDashboardModule)
  }
];
```

### Performance Features
- **Lazy Loading**: Load modules on demand
- **OnPush Change Detection**: Optimize change detection
- **Virtual Scrolling**: Handle large lists efficiently
- **Image Optimization**: Optimize images for web
- **Bundle Optimization**: Minimize bundle size

## 🚀 Deployment

### Production Build
```bash
# Build for production
ng build --configuration production

# Build with AOT compilation
ng build --aot --prod

# Build with source maps
ng build --source-map
```

### Deployment Options
- **Static Hosting**: Deploy to Netlify, Vercel, or GitHub Pages
- **CDN**: Use CDN for static assets
- **Docker**: Containerize the application
- **Cloud Platforms**: Deploy to AWS, Azure, or Google Cloud

### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/safe-fitness /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
ng cache clean
```

#### 2. CORS Issues
```typescript
// Configure CORS in backend
@CrossOrigin(origins = "http://localhost:4200")
@RestController
public class ApiController {
  // Controller methods
}
```

#### 3. WebSocket Connection Issues
```typescript
// Check WebSocket connection
this.webSocketService.getConnectionStatus().subscribe(status => {
  console.log('WebSocket status:', status);
});
```

#### 4. Google APIs Issues
```html
<!-- Ensure Google APIs are loaded -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY"></script>
```

## 📊 Analytics & Monitoring

### Error Tracking
```typescript
// Global error handler
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Global error:', error);
    // Send to error tracking service
  }
}
```

### Performance Monitoring
- **Core Web Vitals**: Monitor LCP, FID, CLS
- **Bundle Analysis**: Analyze bundle size and composition
- **Runtime Performance**: Monitor application performance
- **User Analytics**: Track user behavior and engagement

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run linting and tests
6. Submit a pull request

### Code Standards
- **TypeScript**: Strict TypeScript configuration
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Angular Style Guide**: Follow Angular best practices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the Angular documentation
- Review the API documentation

---

**Built with ❤️ using Angular, TypeScript, and modern web technologies**
