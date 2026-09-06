import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Button,
  Divider,
  ListItemIcon,
  ListItemText,
  Badge,
  Popover,
  List,
  ListItem,
  Stack
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout as LogoutIcon,
  Apartment as CampusIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Check as CheckIcon,
  HomeWork as HomeWorkIcon,
  Notifications as NotificationsIcon,
  DoneAll as DoneAllIcon,
  Campaign as AnnouncementIcon
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '../../app/store/useAuthStore';
import { apiClient } from '../../services/api/apiClient';

const drawerWidth = 260;

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [branchAnchorEl, setBranchAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const queryClient = useQueryClient();
  const { user, school, availableSchools, switchSchool, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/announcements/notifications');
        return res.data?.data !== undefined ? res.data.data : (res.data || []);
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 30000
  });
  const notifications = Array.isArray(notifData) ? notifData : [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/announcements/notifications/${id}/read`);
      refetchNotifs();
    } catch (e) {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/announcements/notifications/read-all');
      refetchNotifs();
    } catch (e) {
      // ignore
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBranchMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setBranchAnchorEl(event.currentTarget);
  };

  const handleBranchMenuClose = () => {
    setBranchAnchorEl(null);
  };

  const handleSwitchBranch = (targetSchool: any) => {
    handleBranchMenuClose();
    if (targetSchool.id !== school?.id) {
      switchSchool(targetSchool);
      queryClient.invalidateQueries();
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      logout();
      navigate('/login');
    }
  };

  const isMultiBranch = availableSchools && availableSchools.length > 1;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: '#ffffff',
          color: 'text.primary',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Branch Switcher Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isMultiBranch ? (
              <>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  startIcon={<CampusIcon color="primary" />}
                  endIcon={<ArrowDownIcon />}
                  onClick={handleBranchMenuOpen}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: '#cbd5e1',
                    px: 1.5,
                    py: 0.5
                  }}
                >
                  {school?.name || 'Select Campus'}
                </Button>
                <Menu
                  anchorEl={branchAnchorEl}
                  open={Boolean(branchAnchorEl)}
                  onClose={handleBranchMenuClose}
                  transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                  PaperProps={{ sx: { minWidth: 320, borderRadius: 2, mt: 0.5 } }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                      Switch Active Campus / Branch
                    </Typography>
                  </Box>
                  <Divider />
                  {availableSchools.map((b) => {
                    const isSelected = b.id === school?.id;
                    return (
                      <MenuItem
                        key={b.id}
                        onClick={() => handleSwitchBranch(b)}
                        selected={isSelected}
                        sx={{ py: 1 }}
                      >
                        <ListItemIcon>
                          <CampusIcon color={isSelected ? 'primary' : 'action'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={isSelected ? 700 : 500}>
                              {b.name}
                            </Typography>
                          }
                          secondary={`Code: ${b.code}`}
                        />
                        {isSelected && <CheckIcon color="primary" fontSize="small" sx={{ ml: 1 }} />}
                      </MenuItem>
                    );
                  })}
                  <Divider />
                  <MenuItem
                    onClick={() => {
                      handleBranchMenuClose();
                      navigate('/select-branch');
                    }}
                    sx={{ color: 'primary.main', fontWeight: 600 }}
                  >
                    <ListItemIcon>
                      <HomeWorkIcon color="primary" />
                    </ListItemIcon>
                    Manage All Branches Overview
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Chip
                icon={<CampusIcon />}
                label={school?.name || 'School ERP'}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* In-App Notifications Bell */}
            <IconButton
              onClick={(e) => setNotifAnchorEl(e.currentTarget)}
              size="medium"
              aria-label="notifications"
              sx={{ color: unreadCount > 0 ? 'primary.main' : 'text.secondary' }}
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Notification Popover */}
            <Popover
              open={Boolean(notifAnchorEl)}
              anchorEl={notifAnchorEl}
              onClose={() => setNotifAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: { width: 360, maxHeight: 460, borderRadius: 2, boxShadow: 4, display: 'flex', flexDirection: 'column' }
              }}
            >
              <Box sx={{ p: 2, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Notifications {unreadCount > 0 ? `(${unreadCount} new)` : ''}
                  </Typography>
                </Box>
                {unreadCount > 0 && (
                  <Button
                    size="small"
                    startIcon={<DoneAllIcon fontSize="small" />}
                    onClick={handleMarkAllRead}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                  >
                    Mark all read
                  </Button>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                {notifications.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No notifications yet
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {notifications.slice(0, 10).map((n: any) => (
                      <ListItem
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) handleMarkRead(n.id);
                        }}
                        sx={{
                          p: 1.5,
                          mb: 0.5,
                          borderRadius: 1.5,
                          bgcolor: n.isRead ? 'transparent' : '#f0f9ff',
                          cursor: 'pointer',
                          display: 'block',
                          '&:hover': { bgcolor: '#f1f5f9' }
                        }}
                      >
                        <Typography variant="body2" fontWeight={n.isRead ? 500 : 700} color="text.primary">
                          {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {n.content}
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.7rem' }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Box sx={{ p: 1.5, borderTop: '1px solid #e2e8f0', textAlign: 'center', bgcolor: '#f8fafc' }}>
                <Button
                  fullWidth
                  size="small"
                  variant="text"
                  onClick={() => {
                    setNotifAnchorEl(null);
                    navigate('/announcements');
                  }}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  View all announcements & alerts →
                </Button>
              </Box>
            </Popover>

            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" fontWeight={600}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {typeof user?.roles?.[0] === 'string' ? user.roles[0] : (user?.roles?.[0] as any)?.name || user?.userType}
              </Typography>
            </Box>
            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  width: 36,
                  height: 36,
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                {user?.firstName?.[0] || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              {isMultiBranch && (
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate('/select-branch');
                  }}
                >
                  <CampusIcon sx={{ mr: 1.5, fontSize: 20 }} /> Switch Campus Branch
                </MenuItem>
              )}
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <AccountCircle sx={{ mr: 1.5, fontSize: 20 }} /> Profile & Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Content Canvas */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
