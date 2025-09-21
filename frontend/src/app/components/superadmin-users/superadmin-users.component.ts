import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

interface ExtendedUser extends User {
  phone?: string; // Phone number
  speciality?: string; // Coach speciality
  gym?: any; // Assigned gym for admins/coaches
  createdGyms?: any[]; // Gyms created by this admin
  subscribedGym?: any; // Subscribed gym for members
  subscription?: any; // Placeholder for subscription details if needed
  createdAt?: string; // Registration date
}

@Component({
  selector: 'app-superadmin-users',
  templateUrl: './superadmin-users.component.html',
  styleUrls: ['./superadmin-users.component.scss']
})
export class SuperadminUsersComponent implements OnInit {
  users: ExtendedUser[] = [];
  filteredUsers: ExtendedUser[] = [];
  isLoading = true;
  selectedFilter: string = 'all';
  
  filterOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'non-subscribed', label: 'Non-Subscribed Users' },
    { value: 'subscribed', label: 'Subscribed Users' },
    { value: 'admins', label: 'All Admins' },
    { value: 'coaches', label: 'All Coaches' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllUsers();
  }

  loadAllUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data as ExtendedUser[];
        this.applyFilter();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  applyFilter(): void {
    switch (this.selectedFilter) {
      case 'non-subscribed':
        this.filteredUsers = this.users.filter(user => 
          user.role === 'Member' && !user.subscribedGym
        );
        break;
      case 'subscribed':
        this.filteredUsers = this.users.filter(user => 
          user.role === 'Member' && user.subscribedGym
        );
        break;
      case 'admins':
        this.filteredUsers = this.users.filter(user => user.role === 'Admin');
        break;
      case 'coaches':
        this.filteredUsers = this.users.filter(user => user.role === 'Coach');
        break;
      default:
        this.filteredUsers = this.users;
    }
  }

  getUserRoleDisplay(role?: string): string {
    switch (role) {
      case 'Admin': return 'Admin';
      case 'Coach': return 'Coach';
      case 'Member': return 'Member';
      case 'SuperAdmin': return 'Super Admin';
      case 'User': return 'User';
      default: return role || 'Unknown';
    }
  }

  getSubscriptionStatus(user: ExtendedUser): string {
    if (user.role !== 'Member') return 'N/A';
    return user.subscribedGym ? 'Active' : 'No Subscription';
  }

  getGymNames(user: ExtendedUser): string {
    const gyms = [];
    
    // For admins, show gyms they created
    if (user.role === 'Admin' && user.createdGyms && user.createdGyms.length > 0) {
      user.createdGyms.forEach(gym => {
        if (gym && gym.name) {
          gyms.push(gym.name);
        }
      });
    }
    
    // Add assigned gym (for coaches)
    if (user.role === 'Coach' && user.gym) {
      gyms.push(user.gym.name);
    }
    
    // Add subscribed gym (for members)
    if (user.role === 'Member' && user.subscribedGym) {
      gyms.push(user.subscribedGym.name);
    }
    
    if (gyms.length === 0) return 'No gym assigned';
    return gyms.join(', ');
  }

  getSpecialityDisplay(user: ExtendedUser): string {
    return user.speciality || 'Not specified';
  }

  viewUser(user: ExtendedUser): void {
    // Create a detailed view of the user
    let gymInfo = '';
    if (user.role === 'Admin' && user.createdGyms && user.createdGyms.length > 0) {
      const gymNames = user.createdGyms.map(gym => gym.name).join(', ');
      gymInfo = `Gyms Created: ${gymNames}`;
    } else {
      gymInfo = `Gym Assignment: ${this.getGymNames(user)}`;
    }
    
    const userDetails = `
      User Details:
      Name: ${user.firstname} ${user.lastname}
      Email: ${user.email}
      Role: ${this.getUserRoleDisplay(user.role)}
      Phone: ${user.phone || 'Not provided'}
      CIN: ${user.cin || 'Not provided'}
      Speciality: ${this.getSpecialityDisplay(user)}
      ${gymInfo}
      Subscription Status: ${this.getSubscriptionStatus(user)}
      Joined: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
    `;
    
    alert(userDetails);
  }

  deleteUser(user: ExtendedUser): void {
    const confirmMessage = `Are you sure you want to delete user "${user.firstname} ${user.lastname}"?\n\nThis action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
      // Call the backend to delete the user
      this.userService.deleteUser(user.id!).subscribe({
        next: () => {
          alert('User deleted successfully');
          // Reload the users list
          this.loadAllUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Error deleting user. Please try again.');
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  goBack(): void {
    this.router.navigate(['/superadmin']);
  }
}
