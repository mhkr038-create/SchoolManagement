export interface AcademicYear {
  id: string;
  schoolId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms?: AcademicTerm[];
  createdAt: string;
  updatedAt: string;
}

export interface AcademicTerm {
  id: string;
  schoolId: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  displayOrder: number;
  sections?: Section[];
  classSubjects?: ClassSubject[];
  _count?: {
    studentEnrollments?: number;
    sections?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Section {
  id: string;
  schoolId: string;
  classId: string;
  name: string;
  capacity: number;
  className?: string;
  _count?: {
    studentEnrollments?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  type: 'THEORY' | 'PRACTICAL' | 'ACTIVITY';
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubject {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId?: string;
  creditHours?: number;
  subject?: Subject;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
