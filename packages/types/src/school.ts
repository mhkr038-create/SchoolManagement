export interface School {
  id: string;
  code: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  createdAt: string;
  updatedAt: string;
  _count?: {
    students?: number;
    classes?: number;
    users?: number;
    academicYears?: number;
  };
}

export interface UpdateSchoolProfileDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
  currency?: string;
  timezone?: string;
  domain?: string;
}

export interface AuditLog {
  id: string;
  schoolId: string;
  userId?: string | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  entityName: string;
  entityId: string;
  action: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface CreateAcademicYearDto {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  terms?: Array<{
    name: string;
    startDate: string;
    endDate: string;
  }>;
}

