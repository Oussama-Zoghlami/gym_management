import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

// Components
import { SigninComponent } from './components/signin/signin.component';
import { SignupComponent } from './components/signup/signup.component';
import { EmailVerificationComponent } from './components/email-verification/email-verification.component';
import { SuperadminDashboardComponent } from './components/superadmin-dashboard/superadmin-dashboard.component';
import { SuperadminGymsComponent } from './components/superadmin-gyms/superadmin-gyms.component';
import { SuperadminUsersComponent } from './components/superadmin-users/superadmin-users.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AdminGymComponent } from './components/admin-gym/admin-gym.component';
import { AdminGymViewComponent } from './components/admin-gym-view/admin-gym-view.component';
import { MemberDashboardComponent } from './components/member-dashboard/member-dashboard.component';
import { CoachDashboardComponent } from './components/coach-dashboard/coach-dashboard.component';
import { AdminScheduleComponent } from './components/admin-schedule/admin-schedule.component';
import { AdminNavbarComponent } from './components/admin-navbar/admin-navbar.component';
import { AdminGymLayoutComponent } from './layouts/admin-gym-layout/admin-gym-layout.component';
import { AdminAddCoachComponent } from './components/admin-add-coach/admin-add-coach.component';
import { CoachGymViewComponent } from './components/coach-gym-view/coach-gym-view.component';
import { CoachScheduleComponent } from './components/coach-schedule/coach-schedule.component';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { SubscriptionModalComponent } from './components/subscription-modal/subscription-modal.component';
import { SubscriptionSuccessComponent } from './components/subscription-success/subscription-success.component';
import { SubscriptionCancelComponent } from './components/subscription-cancel/subscription-cancel.component';
import { SubscribedGymComponent } from './components/subscribed-gym/subscribed-gym.component';
import { BrowseGymsComponent } from './components/browse-gyms/browse-gyms.component';
import { MemberScheduleComponent } from './components/member-schedule/member-schedule.component';
import { CoachMessagingComponent } from './components/coach-messaging/coach-messaging.component';
import { NutritionTrackerComponent } from './components/nutrition-tracker/nutrition-tracker.component';
import { ForgotPasswordModalComponent } from './components/forgot-password-modal/forgot-password-modal.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { SubscribedMembersComponent } from './components/subscribed-members/subscribed-members.component';
import { CoachWorkoutPlansComponent } from './components/coach-workout-plans/coach-workout-plans.component';
import { MemberWorkoutPlansComponent } from './components/member-workout-plans/member-workout-plans.component';
import { CoachMembersComponent } from './components/coach-members/coach-members.component';
import { MessageModalComponent } from './components/message-modal/message-modal.component';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';
import { MemberDetailsModalComponent } from './components/member-details-modal/member-details-modal.component';
import { EmailModalComponent } from './components/email-modal/email-modal.component';
import { SubscriptionCalendarComponent } from './components/subscription-calendar/subscription-calendar.component';

// Interceptor
import { AuthHttpInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    SigninComponent,
    SignupComponent,
    EmailVerificationComponent,
    SuperadminDashboardComponent,
    SuperadminGymsComponent,
    SuperadminUsersComponent,
    AdminDashboardComponent,
    AdminGymComponent,
    AdminGymViewComponent,
    MemberDashboardComponent,
    CoachDashboardComponent,
    AdminScheduleComponent
    ,AdminNavbarComponent
    ,AdminGymLayoutComponent
    ,AdminAddCoachComponent
    ,CoachGymViewComponent
    ,CoachScheduleComponent
    ,StarRatingComponent
    ,SubscriptionModalComponent
    ,SubscriptionSuccessComponent
    ,SubscriptionCancelComponent
    ,SubscribedGymComponent
    ,BrowseGymsComponent
    ,MemberScheduleComponent
    ,CoachMessagingComponent
    ,NutritionTrackerComponent
    ,ForgotPasswordModalComponent
    ,ResetPasswordComponent
    ,SubscribedMembersComponent
    ,CoachWorkoutPlansComponent
    ,MemberWorkoutPlansComponent
    ,CoachMembersComponent
    ,MessageModalComponent
    ,StatisticsDashboardComponent
    ,MemberDetailsModalComponent
    ,EmailModalComponent
    ,SubscriptionCalendarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
    DatePipe
  ],
  schemas: [NO_ERRORS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}


