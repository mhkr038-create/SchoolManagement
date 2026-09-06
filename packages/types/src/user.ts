import { Role } from './rbac';

export enum UserType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STAFF = 'STAFF',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export interface User {
  id: string;
  schoolId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  userType: UserType | string;
  status: UserStatus | string;
  roles?: (Role | string)[];
  permissions?: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
