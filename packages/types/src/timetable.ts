export interface Room {
  id: string;
  schoolId: string;
  name: string;
  capacity: number;
}

export interface TimetableEntry {
  id: string;
  schoolId: string;
  academicYearId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  dayOfWeek: number; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  startTime: string; // e.g. '08:30'
  endTime: string;   // e.g. '09:15'
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    color?: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  room?: Room | null;
}

export interface TimetableSlotPayload {
  academicYearId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  type?: 'TEACHER_CONFLICT' | 'ROOM_CONFLICT';
  message?: string;
  conflictingEntry?: TimetableEntry;
}
