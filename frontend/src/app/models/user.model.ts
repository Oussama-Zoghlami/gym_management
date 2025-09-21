export interface User {
  id?: number;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  cin?: string; // National ID card number for Admins
  role?: string;
  confirmed?: boolean;
  gymId?: number; // Gym ID from JWT token
  userId?: number; // User ID from JWT token
}

export interface SignupRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  cin?: string; // Only for Admin signup
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  role: string;
  user?: User;
}

export interface PendingUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  cin?: string;
  role: string;
  registrationDate?: Date;
}

export interface CoachDto {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  speciality?: string;
}