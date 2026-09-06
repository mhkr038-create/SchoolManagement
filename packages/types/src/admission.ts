import { Class } from './academics';

export enum AdmissionStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ENROLLED = 'ENROLLED'
}

export interface AdmissionApplication {
  id: string;
  schoolId: string;
  applicationNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  applyingForClassId: string;
  academicYearId: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  previousSchool?: string;
  status: AdmissionStatus | string;
  studentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  applyingClass?: Class;
}

export interface CreateAdmissionDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  applyingForClassId: string;
  academicYearId?: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  previousSchool?: string;
  notes?: string;
}

export interface ConvertAdmissionDto {
  classId: string;
  sectionId: string;
  rollNumber?: number;
  academicYearId?: string;
}
