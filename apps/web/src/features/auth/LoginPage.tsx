import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  School as SchoolIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Domain as DomainIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: any = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
        schoolCode: schoolCode.trim() || undefined
      });

      const { user, school, accessToken, availableSchools } = response.data || response;
      setAuth(user, school, accessToken, availableSchools);

      if (availableSchools && availableSchools.length > 1) {
        navigate('/select-branch', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@schoolerp.com');
    setPassword('AdminPassword123!');
    setSchoolCode('');
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5
              }}
            >
              <SchoolIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              School Management ERP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to manage school operations & academics
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
              required
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              required
            />

            <TextField
              label="School Code (Optional)"
              type="text"
              fullWidth
              size="small"
              placeholder="e.g. GIA-2026"
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DomainIcon fontSize="small" color="action" />
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={isLoading}
              sx={{ mt: 1, py: 1.2, fontWeight: 600 }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              QUICK TEST CREDENTIALS
            </Typography>
          </Divider>

          <Stack spacing={1} sx={{ textAlign: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={fillDemoAdmin}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Super Admin (All Campuses)
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setEmail('teacher.govind@rainbowschool.edu');
                setPassword('AdminPassword123!');
                setSchoolCode('REMPS-MAIN');
                setError(null);
              }}
              sx={{ textTransform: 'none' }}
            >
              Main Campus Teacher (Govind Reddy)
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setEmail('teacher.rajesh@rainbowschool.edu');
                setPassword('AdminPassword123!');
                setSchoolCode('REMPS-CITY');
                setError(null);
              }}
              sx={{ textTransform: 'none' }}
            >
              City Campus Teacher (Rajesh Kumar)
            </Button>
            <Divider sx={{ my: 1 }} />
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              &larr; Back to Public Landing Page
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
