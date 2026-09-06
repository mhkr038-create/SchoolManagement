export type TargetAudience = 'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS';
export type NotificationType = 'ATTENDANCE' | 'FEE' | 'EXAM' | 'ASSIGNMENT' | 'ANNOUNCEMENT' | 'SYSTEM';

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  targetAudience: TargetAudience;
  targetClassId?: string | null;
  publishedBy: string;
  publishedAt: string;
  expiresAt?: string | null;
  targetClass?: {
    id: string;
    name: string;
    code: string;
  } | null;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  schoolId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}