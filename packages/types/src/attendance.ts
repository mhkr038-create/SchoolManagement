export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'EXCUSED_LEAVE';

export interface AttendanceRecordItem {
  id?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber?: number | null;
  status: AttendanceStatus | 'PENDING';
  remarks?: string | null;
  isLocked?: boolean;
}

export interface AttendanceSummary {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  excusedCount: number;
  attendancePercentage: number;
}

export interface AttendanceSheetResponse {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  date: string;
  isLocked: boolean;
  lockedAt?: string | null;
  summary: AttendanceSummary;
  records: AttendanceRecordItem[];
}

export interface BatchAttendanceItemDto {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BatchAttendanceDto {
  classId: string;
  sectionId: string;
  date: string;
  records: BatchAttendanceItemDto[];
}

export interface LockAttendanceDto {
  classId: string;
  sectionId: string;
  date: string;
}

export interface CorrectAttendanceDto {
  status: AttendanceStatus;
  remarks?: string;
}

export interface MonthlyStudentAttendance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber?: number | null;
  days: Record<number, AttendanceStatus | '-'>;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  halfDayCount: number;
  excusedCount: number;
  totalRecordedDays: number;
  attendancePercentage: number;
  isLowAttendance: boolean;
}

export interface MonthlyAttendanceReportResponse {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  month: number;
  year: number;
  totalDaysInMonth: number;
  workingDaysRecorded: number;
  students: MonthlyStudentAttendance[];
}
