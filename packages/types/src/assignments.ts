export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'RESUBMIT_REQUESTED' | 'LATE' | 'PENDING';

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string | null;
  fileUrl?: string | null;
  submittedAt: string;
  marksAwarded?: number | null;
  feedback?: string | null;
  gradedBy?: string | null;
  status: SubmissionStatus;
  student?: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  grader?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Assignment {
  id: string;
  schoolId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description?: string | null;
  dueDate: string;
  maxMarks?: number | null;
  fileAttachmentUrl?: string | null;
  createdAt: string;
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
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  submissions?: AssignmentSubmission[];
  _count?: {
    submissions: number;
  };
  stats?: {
    totalStudents: number;
    submittedCount: number;
    gradedCount: number;
    pendingCount: number;
  };
}

export interface AssignmentStats {
  activeAssignments: number;
  pendingGrading: number;
  gradedThisWeek: number;
  averageClassScore: number;
}