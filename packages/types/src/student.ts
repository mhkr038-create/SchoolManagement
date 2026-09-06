import { Class, Section, AcademicYear } from './academics';

export interface Guardian {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN';
  occupation?: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary?: boolean;
  canPickup?: boolean;
}

export interface StudentEnrollment {
  id: string;
  schoolId: string;
  studentId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  rollNumber?: number;
  status: 'ENROLLED' | 'PROMOTED' | 'REPEATED';
  class?: Class;
  section?: Section;
  academicYear?: AcademicYear;
}

export interface Student {
  id: string;
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  nationalId?: string;
  admissionDate: string;
  previousSchool?: string;
  medicalNotes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED';
  guardians?: Array<{
    guardian: Guardian;
    isPrimary: boolean;
    canPickup: boolean;
  }>;
  currentEnrollment?: StudentEnrollment;
  enrollments?: StudentEnrollment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentDto {
  admissionNumber?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  admissionDate?: string;
  previousSchool?: string;
  medicalNotes?: string;
  
  // Optional Guardian Info to link simultaneously
  guardian?: {
    firstName: string;
    lastName: string;
    relationship: string;
    phone: string;
    email?: string;
    occupation?: string;
    address?: string;
  };

  // Optional Enrollment Info
  enrollment?: {
    academicYearId?: string;
    classId: string;
    sectionId: string;
    rollNumber?: number;
  };
}

export interface BulkImportStudentItem {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  parentName?: string;
  parentRelationship?: string;
  parentPhone?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: number;
}

export interface BulkImportResult {
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; error: string; studentName?: string }>;
  message: string;
}
