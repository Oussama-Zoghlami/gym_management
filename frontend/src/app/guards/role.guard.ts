import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];
  const userRole = authService.getRole();

  if (userRole && userRole.toUpperCase() === expectedRole.toUpperCase()) {
    return true;
  }

  // Redirect to appropriate dashboard based on user's actual role
  if (userRole) {
    authService.navigateToDashboard(userRole);
  } else {
    router.navigate(['/signin']);
  }
  
  return false;
};
