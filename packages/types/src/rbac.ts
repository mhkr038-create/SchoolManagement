export enum StandardRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  PRINCIPAL = 'PRINCIPAL',
  TEACHER = 'TEACHER',
  ACCOUNTANT = 'ACCOUNTANT',
  OFFICE_STAFF = 'OFFICE_STAFF',
  PARENT = 'PARENT',
  STUDENT = 'STUDENT',
  LIBRARIAN = 'LIBRARIAN',
  TRANSPORT_STAFF = 'TRANSPORT_STAFF'
}

export enum PermissionCode {
  // Organization & Settings
  SCHOOL_SETTINGS_VIEW = 'school.settings.view',
  SCHOOL_SETTINGS_EDIT = 'school.settings.edit',
  
  // Users & Roles
  USERS_VIEW = 'users.view',
  USERS_CREATE = 'users.create',
  USERS_EDIT = 'users.edit',
  USERS_DELETE = 'users.delete',
  ROLES_MANAGE = 'roles.manage',

  // Academics
  ACADEMICS_VIEW = 'academics.view',
  ACADEMICS_MANAGE = 'academics.manage',

  // Admissions
  ADMISSIONS_VIEW = 'admissions.view',
  ADMISSIONS_CREATE = 'admissions.create',
  ADMISSIONS_APPROVE = 'admissions.approve',

  // Students
  STUDENTS_VIEW = 'students.view',
  STUDENTS_CREATE = 'students.create',
  STUDENTS_EDIT = 'students.edit',
  STUDENTS_DELETE = 'students.delete',

  // Parents
  PARENTS_VIEW = 'parents.view',
  PARENTS_MANAGE = 'parents.manage',

  // Staff
  STAFF_VIEW = 'staff.view',
  STAFF_MANAGE = 'staff.manage',

  // Attendance
  ATTENDANCE_VIEW = 'attendance.view',
  ATTENDANCE_MARK = 'attendance.mark',
  ATTENDANCE_LOCK = 'attendance.lock',
  ATTENDANCE_CORRECT = 'attendance.correct',

  // Examinations & Marks
  EXAMS_VIEW = 'exams.view',
  EXAMS_MANAGE = 'exams.manage',
  MARKS_ENTER = 'marks.enter',
  MARKS_LOCK = 'marks.lock',
  REPORT_CARDS_GENERATE = 'report_cards.generate',

  // Fees & Finance
  FEES_VIEW = 'fees.view',
  FEES_MANAGE = 'fees.manage',
  FEES_COLLECT = 'fees.collect',
  FEES_REFUND = 'fees.refund',
  FEES_REPORTS = 'fees.reports',

  // Timetable & Assignments
  TIMETABLE_VIEW = 'timetable.view',
  TIMETABLE_MANAGE = 'timetable.manage',
  ASSIGNMENTS_VIEW = 'assignments.view',
  ASSIGNMENTS_MANAGE = 'assignments.manage',
  ASSIGNMENTS_SUBMIT = 'assignments.submit',

  // Communication
  ANNOUNCEMENTS_VIEW = 'announcements.view',
  ANNOUNCEMENTS_MANAGE = 'announcements.manage',
  NOTIFICATIONS_SEND = 'notifications.send',

  // Audits & Reports
  AUDIT_LOGS_VIEW = 'audit_logs.view',
  REPORTS_VIEW = 'reports.view',
  REPORTS_EXPORT = 'reports.export'
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  name: string;
  description?: string;
}

export interface Role {
  id: string;
  schoolId: string;
  name: string;
  description?: string;
  isSystemRole: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}
