export interface GradeScale {
  id: string;
  gradingSystemId: string;
  name: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint?: number | null;
  remarks?: string | null;
}

export interface GradingSystem {
  id: string;
  schoolId: string;
  name: string;
  type: 'PERCENTAGE' | 'GPA';
  isDefault: boolean;
  createdAt: string;
  gradeScales: GradeScale[];
}

export interface ExamSchedule {
  id: string;
  examinationId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Examination {
  id: string;
  schoolId: string;
  academicYearId: string;
  termId?: string | null;
  name: string;
  startDate: string;
  endDate: string;
  isPublished: boolean;
  createdAt: string;
  schedules?: ExamSchedule[];
  academicYear?: {
    id: string;
    name: string;
  };
}

export interface StudentMarkEntry {
  studentId: string;
  admissionNumber: string;
  rollNumber: number | null;
  studentName: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string | null;
  isLocked: boolean;
  grade?: string | null;
  gradePoint?: number | null;
  isPassed?: boolean;
}

export interface ExamSheetResponse {
  examSchedule: {
    id: string;
    examinationId: string;
    examinationName: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    examDate: string;
    startTime: string;
    endTime: string;
    maxMarks: number;
    passingMarks: number;
    isLocked: boolean;
  };
  entries: StudentMarkEntry[];
  summary: {
    totalStudents: number;
    markedCount: number;
    absentCount: number;
    passedCount: number;
    failedCount: number;
    classAverage: number;
    highestMark: number;
    lowestMark: number;
  };
}

export interface BatchMarkEntryItem {
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string | null;
}

export interface BatchMarkEntryDto {
  examScheduleId: string;
  entries: BatchMarkEntryItem[];
}

export interface ReportCardSubjectRow {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  passingMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  percentage: number;
  grade: string;
  gradePoint?: number | null;
  status: 'PASS' | 'FAIL' | 'ABSENT';
  remarks?: string | null;
}

export interface ReportCardResponse {
  school: {
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    logoUrl: string | null;
  };
  student: {
    id: string;
    admissionNumber: string;
    rollNumber: number | null;
    fullName: string;
    gender: string;
    dateOfBirth?: string | null;
    className: string;
    sectionName: string;
    academicYear: string;
  };
  examination: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  subjects: ReportCardSubjectRow[];
  summary: {
    totalMaxMarks: number;
    totalObtainedMarks: number;
    aggregatePercentage: number;
    overallGrade: string;
    overallGpa?: number | null;
    classRank: number;
    totalStudentsInClass: number;
    overallResult: 'DISTINCTION' | 'FIRST CLASS' | 'SECOND CLASS' | 'PASS' | 'FAIL';
    attendancePercentage?: number | null;
  };
}

export interface ClassStudentSummary {
  studentId: string;
  admissionNumber: string;
  rollNumber: number | null;
  studentName: string;
  totalMarksObtained: number;
  totalMaxMarks: number;
  percentage: number;
  overallGrade: string;
  classRank: number;
  status: 'PASSED' | 'FAILED';
}

export interface ClassExamSummaryResponse {
  examinationId: string;
  examinationName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  students: ClassStudentSummary[];
  classStats: {
    totalStudents: number;
    passedStudents: number;
    failedStudents: number;
    passPercentage: number;
    classAveragePercentage: number;
    highestScorePercentage: number;
  };
}
