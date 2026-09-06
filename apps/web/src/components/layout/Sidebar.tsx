import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  EventAvailable as AttendanceIcon,
  AssignmentTurnedIn as ExamIcon,
  AccountBalanceWallet as FeeIcon,
  CalendarToday as TimetableIcon,
  MenuBook as AssignmentIcon,
  Campaign as AnnouncementIcon,
  AdminPanelSettings as UsersIcon,
  Settings as SettingsIcon,
  AssignmentInd as AdmissionsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/store/useAuthStore';

const drawerWidth = 260;

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

export const Sidebar: React.FC<{ mobileOpen: boolean; handleDrawerToggle: () => void }> = ({
  mobileOpen,
  handleDrawerToggle
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { school, hasPermission } = useAuthStore();

  const navItems: NavItem[] = [
    { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { title: 'Students', path: '/students', icon: <SchoolIcon />, permission: 'students.view' },
    { title: 'Admissions', path: '/admissions', icon: <AdmissionsIcon />, permission: 'admissions.view' },
    { title: 'Academics', path: '/academics', icon: <SchoolIcon />, permission: 'academics.view' },
    { title: 'Attendance', path: '/attendance', icon: <AttendanceIcon />, permission: 'attendance.view' },
    { title: 'Examinations', path: '/examinations', icon: <ExamIcon />, permission: 'exams.view' },
    { title: 'Fees & Billing', path: '/fees', icon: <FeeIcon />, permission: 'fees.view' },
    { title: 'Timetable', path: '/timetable', icon: <TimetableIcon />, permission: 'timetable.view' },
    { title: 'Assignments', path: '/assignments', icon: <AssignmentIcon />, permission: 'assignments.view' },
    { title: 'Announcements', path: '/announcements', icon: <AnnouncementIcon />, permission: 'announcements.view' },
    { title: 'User Management', path: '/users', icon: <UsersIcon />, permission: 'users.view' },
    { title: 'Settings', path: '/settings', icon: <SettingsIcon />, permission: 'school.settings.view' }
  ];

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SchoolIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap color="text.primary">
            {school?.name || 'School ERP'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {school?.code ? `Code: ${school.code}` : 'Cloud Portal'}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, py: 1.5, flexGrow: 1 }}>
        {navItems
          .filter((item) => !item.permission || hasPermission(item.permission))
          .map((item) => {
            const isSelected = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => {
                    navigate(item.path);
                    if (mobileOpen) handleDrawerToggle();
                  }}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText'
                      },
                      '&:hover': {
                        backgroundColor: 'primary.main'
                      }
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected ? 'inherit' : 'text.secondary'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: isSelected ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
      <Divider />
      <Box sx={{ p: 2, bgcolor: '#f1f5f9', textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          School ERP Platform v1.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};
