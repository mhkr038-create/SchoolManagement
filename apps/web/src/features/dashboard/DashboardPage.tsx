import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Chip,
  Avatar
} from '@mui/material';
import {
  School as SchoolIcon,
  People as PeopleIcon,
  Class as ClassIcon,
  AccountBalanceWallet as FeeIcon,
  CheckCircle as CheckCircleIcon,
  VerifiedUser as ShieldIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuthStore } from '../../app/store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, school } = useAuthStore();
  const navigate = useNavigate();

  const metrics = [
    { title: 'Total Students', value: '1,520', icon: <SchoolIcon />, color: '#2563eb' },
    { title: 'Faculty & Teachers', value: '84', icon: <PeopleIcon />, color: '#0d9488' },
    { title: 'Active Classes', value: '32', icon: <ClassIcon />, color: '#f59e0b' },
    { title: 'Term Fee Collected', value: '₹12,45,000', icon: <FeeIcon />, color: '#10b981' }
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Welcome Banner */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              Welcome back, {user?.firstName} {user?.lastName}!
            </Typography>
            <Chip
              label={typeof user?.roles?.[0] === 'string' ? user.roles[0] : (user?.roles?.[0] as any)?.name || user?.userType}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 600 }}
            />
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {school?.name} | Active Academic Year: <strong>2026–2027</strong> | Timezone: {school?.timezone}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/users')}
            sx={{
              bgcolor: '#ffffff',
              color: '#1e40af',
              fontWeight: 600,
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Manage Users
          </Button>
        </Box>
      </Paper>

      {/* Metrics Grid */}
      <Grid container spacing={2.5}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={3} key={metric.title}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: `${metric.color}15`,
                    color: metric.color,
                    width: 52,
                    height: 52,
                    borderRadius: 2.5
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {metric.title}
                  </Typography>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    {metric.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Status & Architecture Highlights */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Phase 1: Foundation & Security Overview
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The enterprise multi-tenant foundation is fully operational with row-level data isolation,
                cryptographic session tracking, and granular permissions.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    <strong>PostgreSQL Schema & Prisma ORM:</strong> 25+ relational tables configured with foreign keys, cascading rules, and unique constraints.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Stateless JWT & Refresh Token Rotation:</strong> Family-tracked refresh tokens with breach protection and HttpOnly cookies.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Multi-School Data Isolation:</strong> <code>SchoolContextGuard</code> ensures strict tenant segregation per request.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    <strong>Role & Permission Enforcement:</strong> <code>PermissionsGuard</code> validates user access down to specific action codes.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Active User Claims
              </Typography>
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  AUTHENTICATED AS
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {user?.email}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  User ID: {user?.id}
                </Typography>
              </Box>

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Active Roles ({user?.roles?.length || 0}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {user?.roles?.map((r, idx) => {
                  const roleName = typeof r === 'string' ? r : (r as any)?.name;
                  return <Chip key={idx} label={roleName} size="small" color="primary" variant="outlined" />;
                })}
              </Box>

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Granted Permissions ({user?.permissions?.length || 0}):
              </Typography>
              <Box
                sx={{
                  maxHeight: 120,
                  overflowY: 'auto',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1.5,
                  p: 1,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 0.5
                }}
              >
                {user?.permissions?.map((p) => (
                  <Chip key={p} label={p} size="small" sx={{ fontSize: '0.7rem' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
