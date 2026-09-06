import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuthStore } from '../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole
}) => {
  const { isAuthenticated, hasPermission, hasRole } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderRadius: 3 }}>
          <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Access Denied
          </Typography>
          <Typography color="text.secondary" paragraph>
            You do not possess the required permission (<code>{requiredPermission}</code>) to view this module.
          </Typography>
          <Button variant="outlined" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, maxWidth: 500, textAlign: 'center', borderRadius: 3 }}>
          <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Restricted Role
          </Typography>
          <Typography color="text.secondary" paragraph>
            This section requires the <strong>{requiredRole}</strong> role.
          </Typography>
          <Button variant="outlined" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};
