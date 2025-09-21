import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
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
import { CoachScheduleComponent } from './components/coach-schedule/coach-schedule.component';
import { CoachGymViewComponent } from './components/coach-gym-view/coach-gym-view.component';
import { AdminScheduleComponent } from './components/admin-schedule/admin-schedule.component';
import { AdminGymLayoutComponent } from './layouts/admin-gym-layout/admin-gym-layout.component';
import { AdminAddCoachComponent } from './components/admin-add-coach/admin-add-coach.component';
import { SubscriptionSuccessComponent } from './components/subscription-success/subscription-success.component';
import { SubscriptionCancelComponent } from './components/subscription-cancel/subscription-cancel.component';
import { SubscribedGymComponent } from './components/subscribed-gym/subscribed-gym.component';
import { BrowseGymsComponent } from './components/browse-gyms/browse-gyms.component';
import { MemberScheduleComponent } from './components/member-schedule/member-schedule.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { CoachMembersComponent } from './components/coach-members/coach-members.component';
import { StatisticsDashboardComponent } from './components/statistics-dashboard/statistics-dashboard.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/signin', 
    pathMatch: 'full' 
  },
  {
    path: 'signin',
    component: SigninComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },
  {
    path: 'email-verification',
    component: EmailVerificationComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'superadmin',
    component: SuperadminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'SUPERADMIN' }
  },
  {
    path: 'superadmin/gyms',
    component: SuperadminGymsComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'SUPERADMIN' }
  },
  {
    path: 'superadmin/users',
    component: SuperadminUsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'SUPERADMIN' }
  },
  {
    path: 'superadmin/statistics',
    component: StatisticsDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'SUPERADMIN' }
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'admin/add-coach',
    component: AdminAddCoachComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' }
  },
  {
    path: 'admin/gym',
    component: AdminGymLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ADMIN' },
    children: [
      { path: '', component: AdminGymComponent },
      { path: 'view', component: AdminGymViewComponent },
      { path: 'edit', component: AdminGymComponent },
      { path: 'schedule', component: AdminScheduleComponent },
      { path: 'manage', component: AdminGymComponent },
      { path: ':id/schedule', component: AdminScheduleComponent }
    ]
  },
  {
    path: 'member',
    component: MemberDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'MEMBER' }
  },
  {
    path: 'member/subscription-success',
    component: SubscriptionSuccessComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'MEMBER' }
  },
  {
    path: 'member/subscription-cancel',
    component: SubscriptionCancelComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'MEMBER' }
  },
  {
    path: 'member/my-gym',
    component: SubscribedGymComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'MEMBER' }
  },
  {
    path: 'member/browse-gyms',
    component: BrowseGymsComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'MEMBER' }
  },
  {
    path: 'member/gym/:gymId/schedule',
    component: MemberScheduleComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'MEMBER' }
  },
  {
    path: 'coach',
    component: CoachDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'COACH' }
  },
  {
    path: 'coach/gym/view',
    component: CoachGymViewComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'COACH' }
  },
  {
    path: 'coach/schedule',
    component: CoachScheduleComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'COACH' }
  },
  {
    path: 'coach/members',
    component: CoachMembersComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'COACH' }
  },
  {
    path: '**',
    redirectTo: '/signin'
  }
];
