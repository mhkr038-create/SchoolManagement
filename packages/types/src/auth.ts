import { User } from './user';
import { School } from './school';

export interface LoginDto {
  email: string;
  password: string;
  schoolCode?: string;
}

export interface AuthResponse {
  user: User;
  school: School;
  availableSchools?: School[];
  accessToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  schoolId: string;
  userType: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}
