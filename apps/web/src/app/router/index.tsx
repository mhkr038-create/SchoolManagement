import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LandingPage } from '../../features/landing/LandingPage';
import { LoginPage } from '../../features/auth/LoginPage';
import { BranchSelectionPage } from '../../features/schools/BranchSelectionPage';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardPage } from '../../features/dashboard/DashboardPage';
import { UsersListPage } from '../../features/users/UsersListPage';
import { AcademicsPage } from '../../features/academics/AcademicsPage';
import { StudentsListPage } from '../../features/students/StudentsListPage';
import { StudentDetailPage } from '../../features/students/StudentDetailPage';
import { AdmissionsPage } from '../../features/admissions/AdmissionsPage';
import { AttendancePage } from '../../features/attendance/AttendancePage';
import { ExaminationsPage } from '../../features/examinations/ExaminationsPage';
import { FeesPage } from '../../features/fees/FeesPage';
import { TimetablePage } from '../../features/timetable/TimetablePage';
import { AssignmentsPage } from '../../features/assignments/AssignmentsPage';
import { AnnouncementsPage } from '../../features/announcements/AnnouncementsPage';
import { SettingsPage } from '../../features/settings/SettingsPage';
import { ModulePlaceholderPage } from '../../features/placeholder/ModulePlaceholderPage';

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },

  // Multi-Branch Selection Screen
  {
    path: '/select-branch',
    element: (
      <ProtectedRoute>
        <BranchSelectionPage />
      </ProtectedRoute>
    )
  },

  // Authenticated ERP App Routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute requiredPermission="users.view">
            <UsersListPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute requiredPermission="students.view">
            <StudentsListPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'students/:id',
        element: (
          <ProtectedRoute requiredPermission="students.view">
            <StudentDetailPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'admissions',
        element: (
          <ProtectedRoute requiredPermission="admissions.view">
            <AdmissionsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'academics',
        element: (
          <ProtectedRoute requiredPermission="academics.view">
            <AcademicsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'attendance',
        element: (
          <ProtectedRoute requiredPermission="attendance.view">
            <AttendancePage />
          </ProtectedRoute>
        )
      },
      {
        path: 'examinations',
        element: (
          <ProtectedRoute requiredPermission="exams.view">
            <ExaminationsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'fees',
        element: (
          <ProtectedRoute requiredPermission="fees.view">
            <FeesPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'timetable',
        element: (
          <ProtectedRoute requiredPermission="timetable.view">
            <TimetablePage />
          </ProtectedRoute>
        )
      },
      {
        path: 'assignments',
        element: (
          <ProtectedRoute requiredPermission="assignments.view">
            <AssignmentsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'announcements',
        element: (
          <ProtectedRoute requiredPermission="announcements.view">
            <AnnouncementsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute requiredPermission="school.settings.view">
            <SettingsPage />
          </ProtectedRoute>
        )
      },
      {
        path: '*',
        element: <Navigate to="/" replace />
      }
    ]
  }
]);
