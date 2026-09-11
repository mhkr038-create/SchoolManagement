import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  InputAdornment,
  Switch,
  FormControlLabel,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Business as SchoolIcon,
  Palette as PaletteIcon,
  CalendarMonth as CalendarIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Apartment as BranchIcon,
  Image as ImageIcon,
  Lock as LockIcon,
  Verified as VerifiedIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { School, AuditLog, CreateAcademicYearDto } from '@school/types';

export const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { school: authSchool, availableSchools, switchSchool } = useAuthStore();
  const [tabIndex, setTabIndex] = useState(0);

  // Snackbar notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ==========================================
  // TAB 0: SCHOOL PROFILE FORM
  // ==========================================
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    domain: '',
    logoUrl: ''
  });

  // Query: Current School Details
  const {
    data: currentSchoolData,
    isLoading: loadingSchool,
    refetch: refetchSchool
  } = useQuery<School>({
    queryKey: ['school-current'],
    queryFn: async () => {
      const res: any = await apiClient.get('/schools/current');
      return res.data || res;
    }
  });

  useEffect(() => {
    if (currentSchoolData) {
      setProfileForm({
        name: currentSchoolData.name || '',
        phone: currentSchoolData.phone || '',
        email: currentSchoolData.email || '',
        address: currentSchoolData.address || '',
        currency: currentSchoolData.currency || 'INR',
        timezone: currentSchoolData.timezone || 'Asia/Kolkata',
        domain: currentSchoolData.domain || '',
        logoUrl: currentSchoolData.logoUrl || ''
      });
    } else if (authSchool) {
      setProfileForm({
        name: authSchool.name || '',
        phone: authSchool.phone || '',
        email: authSchool.email || '',
        address: authSchool.address || '',
        currency: authSchool.currency || 'INR',
        timezone: authSchool.timezone || 'Asia/Kolkata',
        domain: authSchool.domain || '',
        logoUrl: authSchool.logoUrl || ''
      });
    }
  }, [currentSchoolData, authSchool]);

  // Mutation: Update School Profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res: any = await apiClient.patch('/schools/current', updatedData);
      return res.data || res;
    },
    onSuccess: (updated: School) => {
      showNotification('School profile and configurations updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['school-current'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      if (authSchool) {
        switchSchool({ ...authSchool, ...updated });
      }
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.message || 'Failed to update profile', 'error');
    }
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  // ==========================================
  // TAB 1: BRANDING & IDENTITY
  // ==========================================
  const [brandingLogo, setBrandingLogo] = useState('');
  const [brandingMotto, setBrandingMotto] = useState('Excellence in Education & Character Building');
  const [previewMode, setPreviewMode] = useState<'receipt' | 'report'>('receipt');

  useEffect(() => {
    if (profileForm.logoUrl) {
      setBrandingLogo(profileForm.logoUrl);
    }
  }, [profileForm.logoUrl]);

  const handleSaveBranding = () => {
    updateProfileMutation.mutate({
      ...profileForm,
      logoUrl: brandingLogo
    });
  };

  // ==========================================
  // TAB 2: ACADEMIC YEARS & SESSIONS
  // ==========================================
  const [openYearModal, setOpenYearModal] = useState(false);
  const [openTermModal, setOpenTermModal] = useState(false);
  const [selectedYearIdForTerm, setSelectedYearIdForTerm] = useState<string>('');

  const [newYearForm, setNewYearForm] = useState({
    name: '2026-2027',
    startDate: '2026-06-01',
    endDate: '2027-04-30',
    isCurrent: false,
    terms: [
      { name: 'Term 1', startDate: '2026-06-01', endDate: '2026-09-30' },
      { name: 'Term 2', startDate: '2026-10-01', endDate: '2026-12-31' },
      { name: 'Term 3', startDate: '2027-01-01', endDate: '2027-04-30' }
    ]
  });

  const [newTermForm, setNewTermForm] = useState({
    name: 'Term 1',
    startDate: '2026-06-01',
    endDate: '2026-10-31'
  });

  // Query: Academic Years
  const {
    data: academicYears = [],
    isLoading: loadingYears,
    refetch: refetchYears
  } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res: any = await apiClient.get('/academics/years');
      return Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    }
  });

  // Mutation: Create Academic Year
  const createYearMutation = useMutation({
    mutationFn: async (dto: CreateAcademicYearDto) => {
      const res: any = await apiClient.post('/academics/years', dto);
      return res.data || res;
    },
    onSuccess: () => {
      showNotification('Academic year and terms created successfully!');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      setOpenYearModal(false);
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.message || 'Failed to create academic year', 'error');
    }
  });

  // Mutation: Set Current Academic Year
  const setCurrentYearMutation = useMutation({
    mutationFn: async (yearId: string) => {
      const res: any = await apiClient.patch('/academics/years/' + yearId + '/set-current', {});
      return res.data || res;
    },
    onSuccess: () => {
      showNotification('Active academic session updated!');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.message || 'Failed to set active year', 'error');
    }
  });

  // Mutation: Add Term to Year
  const createTermMutation = useMutation({
    mutationFn: async ({ yearId, data }: { yearId: string; data: any }) => {
      const res: any = await apiClient.post('/academics/years/' + yearId + '/terms', data);
      return res.data || res;
    },
    onSuccess: () => {
      showNotification('Academic term added successfully!');
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      setOpenTermModal(false);
    },
    onError: (err: any) => {
      showNotification(err.response?.data?.message || 'Failed to add term', 'error');
    }
  });

  // ==========================================
  // TAB 3: AUDIT LOGS & SECURITY
  // ==========================================
  const [auditFilterAction, setAuditFilterAction] = useState('ALL');
  const [auditFilterEntity, setAuditFilterEntity] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [inspectDiffModal, setInspectDiffModal] = useState<{ open: boolean; log: AuditLog | null }>({
    open: false,
    log: null
  });

  // Query: Audit Logs
  const {
    data: auditLogsResponse,
    isLoading: loadingAuditLogs,
    refetch: refetchAuditLogs
  } = useQuery({
    queryKey: ['audit-logs', auditFilterAction, auditFilterEntity, auditSearch],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (auditFilterAction !== 'ALL') params.action = auditFilterAction;
      if (auditFilterEntity !== 'ALL') params.entityName = auditFilterEntity;
      if (auditSearch.trim()) params.search = auditSearch.trim();

      const res: any = await apiClient.get('/schools/audit-logs', { params });
      return res.data || res;
    }
  });

  const auditLogs: AuditLog[] = Array.isArray(auditLogsResponse)
    ? auditLogsResponse
    : Array.isArray(auditLogsResponse?.data)
      ? auditLogsResponse.data
      : [];

  const currentActiveYear = academicYears.find((y: any) => y.isCurrent);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 6 }}>
      {/* Top Header Banner */}
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <SchoolIcon sx={{ color: '#38bdf8', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={700}>
              School Configuration & Settings
            </Typography>
            <Chip
              label={currentSchoolData?.status || authSchool?.status || 'ACTIVE'}
              size="small"
              sx={{
                bgcolor: '#10b981',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.75rem'
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Branch: <strong>{currentSchoolData?.name || authSchool?.name || 'Main Campus'}</strong> ({currentSchoolData?.code || authSchool?.code || 'REMPS-MAIN'}) — Configure organizational profile, institutional branding, academic sessions, and monitor security audit logs.
          </Typography>
        </Box>

        {availableSchools && availableSchools.length > 1 && (
          <Button
            variant="outlined"
            startIcon={<BranchIcon />}
            onClick={() => navigate('/select-branch')}
            sx={{
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#38bdf8',
                bgcolor: 'rgba(56, 189, 248, 0.1)'
              }
            }}
          >
            Switch Branch ({availableSchools.length} Available)
          </Button>
        )}
      </Paper>

      {/* Main Tabs Navigation */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: 52,
                gap: 1
              }
            }}
          >
            <Tab icon={<SchoolIcon />} iconPosition="start" label="Organization Profile" />
            <Tab icon={<PaletteIcon />} iconPosition="start" label="Branding & Identity" />
            <Tab icon={<CalendarIcon />} iconPosition="start" label="Academic Years & Sessions" />
            <Tab icon={<SecurityIcon />} iconPosition="start" label="Audit Logs & Security" />
          </Tabs>
        </Box>

        {/* TAB 0: ORGANIZATION PROFILE */}
        {tabIndex === 0 && (
          <CardContent sx={{ p: 4 }}>
            {loadingSchool ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6" fontWeight={700}>
                        General Institutional Profile
                      </Typography>
                      <Chip
                        icon={<LockIcon sx={{ fontSize: '1rem !important' }} />}
                        label={'Institution Code: ' + (currentSchoolData?.code || authSchool?.code || 'N/A')}
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Update the master branch contact details, physical address, and global billing localization.
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="School / Institution Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                      placeholder="e.g. Royal English Medium Public School"
                      helperText="Official registered name of this educational institution"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Subdomain / Custom Web Portal"
                      value={profileForm.domain}
                      onChange={(e) => setProfileForm({ ...profileForm, domain: e.target.value })}
                      placeholder="e.g. royalenglish.schoolerp.io"
                      helperText="Custom domain or web address for portal access"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Official Contact Email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="contact@school.edu"
                      helperText="Used for system alerts, notices, and billing invoices"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Official Phone / Helpline"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      helperText="Front-desk telephone or administrative contact number"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Registered Physical Address"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Campus 1, 100 Feet Ring Road, Indiranagar, Bengaluru, Karnataka, 560038"
                      helperText="Printed on fee receipts, student ID cards, and report cards"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                      Financial & Regional Localization
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="currency-select-label">Default Currency</InputLabel>
                      <Select
                        labelId="currency-select-label"
                        value={profileForm.currency}
                        label="Default Currency"
                        onChange={(e) => setProfileForm({ ...profileForm, currency: e.target.value })}
                      >
                        <MenuItem value="INR">INR (₹) - Indian Rupee</MenuItem>
                        <MenuItem value="USD">USD ($) - United States Dollar</MenuItem>
                        <MenuItem value="EUR">EUR (€) - Euro</MenuItem>
                        <MenuItem value="GBP">GBP (£) - British Pound</MenuItem>
                        <MenuItem value="AED">AED (د.إ) - UAE Dirham</MenuItem>
                        <MenuItem value="SGD">SGD ($) - Singapore Dollar</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel id="timezone-select-label">Timezone</InputLabel>
                      <Select
                        labelId="timezone-select-label"
                        value={profileForm.timezone}
                        label="Timezone"
                        onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                      >
                        <MenuItem value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</MenuItem>
                        <MenuItem value="UTC">UTC (Coordinated Universal Time)</MenuItem>
                        <MenuItem value="America/New_York">America/New_York (EST/EDT)</MenuItem>
                        <MenuItem value="Europe/London">Europe/London (GMT/BST)</MenuItem>
                        <MenuItem value="Asia/Dubai">Asia/Dubai (GST - UTC+04:00)</MenuItem>
                        <MenuItem value="Asia/Singapore">Asia/Singapore (SGT - UTC+08:00)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => refetchSchool()}
                      disabled={updateProfileMutation.isPending}
                    >
                      Discard
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={updateProfileMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                      disabled={updateProfileMutation.isPending}
                      sx={{
                        px: 4,
                        py: 1.2,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 4px 14px 0 rgba(37,99,235,0.39)'
                      }}
                    >
                      {updateProfileMutation.isPending ? 'Saving Changes...' : 'Save School Profile'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            )}
          </CardContent>
        )}

        {/* TAB 1: BRANDING & IDENTITY */}
        {tabIndex === 1 && (
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                  Institutional Crest & Letterhead
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Configure your school crest, logo, and institutional motto for official letterheads, student report cards, and fee receipts.
                </Typography>

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="School Crest / Logo URL"
                    value={brandingLogo}
                    onChange={(e) => setBrandingLogo(e.target.value)}
                    placeholder="https://example.com/school-crest.png"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <ImageIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                    helperText="Paste a public direct image link (.png, .jpg, .svg)"
                  />

                  {/* Preset logo picker */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                      Quick Logo Presets (Click to apply):
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip
                        label="Royal Crest (Blue Shield)"
                        onClick={() => setBrandingLogo('https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=150&auto=format&fit=crop&q=80')}
                        clickable
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label="Academic Wisdom (Emblem)"
                        onClick={() => setBrandingLogo('https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80')}
                        clickable
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label="Clear Logo"
                        onClick={() => setBrandingLogo('')}
                        clickable
                        color="error"
                        variant="outlined"
                        size="small"
                      />
                    </Stack>
                  </Box>

                  <TextField
                    fullWidth
                    label="Institutional Motto / Tagline"
                    value={brandingMotto}
                    onChange={(e) => setBrandingMotto(e.target.value)}
                    placeholder="e.g. Inspiring Excellence, Igniting Potential"
                    helperText="Displays directly beneath school title on circulars and headers"
                  />

                  <Box sx={{ pt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={updateProfileMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveBranding}
                      disabled={updateProfileMutation.isPending}
                      sx={{ px: 4, py: 1.2, fontWeight: 600, textTransform: 'none' }}
                    >
                      {updateProfileMutation.isPending ? 'Updating Branding...' : 'Update Branding & Logo'}
                    </Button>
                  </Box>
                </Stack>
              </Grid>

              {/* Live Preview Card */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  Live Document Header Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Real-time rendering of your letterhead as printed on student documents.
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button
                    size="small"
                    variant={previewMode === 'receipt' ? 'contained' : 'outlined'}
                    onClick={() => setPreviewMode('receipt')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Fee Receipt Header
                  </Button>
                  <Button
                    size="small"
                    variant={previewMode === 'report' ? 'contained' : 'outlined'}
                    onClick={() => setPreviewMode('report')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Report Card Letterhead
                  </Button>
                </Stack>

                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                    {brandingLogo ? (
                      <Box
                        component="img"
                        src={brandingLogo}
                        alt="Crest"
                        sx={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #2563eb',
                          p: 0.5,
                          bgcolor: '#ffffff'
                        }}
                        onError={(e: any) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: '#1e3a8a',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '1.5rem'
                        }}
                      >
                        {(profileForm.name || 'S').charAt(0).toUpperCase()}
                      </Avatar>
                    )}

                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '0.5px' }}>
                        {profileForm.name || 'ROYAL ENGLISH MEDIUM PUBLIC SCHOOL'}
                      </Typography>
                      <Typography variant="caption" fontStyle="italic" color="primary.main" fontWeight={600} display="block">
                        "{brandingMotto}"
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                        {profileForm.address || '100 Feet Ring Road, Indiranagar, Bengaluru - 560038'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tel: {profileForm.phone || '+91 98765 43210'} | Email: {profileForm.email || 'contact@school.edu'}
                      </Typography>
                    </Box>

                    <Divider sx={{ width: '100%', my: 1, borderBottomWidth: 2, borderColor: '#1e3a8a' }} />

                    {previewMode === 'receipt' ? (
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', px: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          OFFICIAL FEE RECEIPT #REC-2026-0042
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          DATE: {new Date().toLocaleDateString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', px: 1 }}>
                        <Typography variant="caption" fontWeight={700} color="primary.main">
                          STUDENT ACADEMIC PERFORMANCE CARD (TERM 1)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          SESSION: 2026-2027
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        )}

        {/* TAB 2: ACADEMIC YEARS & SESSIONS */}
        {tabIndex === 2 && (
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Academic Years & Term Schedules
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage academic sessions, term milestones, and designate the active school operational year.
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenYearModal(true)}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 14px 0 rgba(37,99,235,0.35)'
                }}
              >
                Create Academic Session
              </Button>
            </Box>

            {/* Current Session Banner */}
            {currentActiveYear && (
              <Paper
                sx={{
                  p: 2.5,
                  mb: 4,
                  borderRadius: 2.5,
                  bgcolor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: '#10b981', color: '#ffffff' }}>
                    <VerifiedIcon />
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} color="#065f46">
                        Active Operational Session: {currentActiveYear.name}
                      </Typography>
                      <Chip label="CURRENT SESSION" size="small" color="success" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" color="#047857">
                      Running from {new Date(currentActiveYear.startDate).toLocaleDateString()} to {new Date(currentActiveYear.endDate).toLocaleDateString()} ({currentActiveYear.terms?.length || 0} Terms Configured)
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* List of Academic Years */}
            {loadingYears ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : academicYears.length === 0 ? (
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc' }}>
                <CalendarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                  No Academic Years Configured
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Get started by creating your first academic session (e.g. 2026-2027).
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenYearModal(true)}>
                  Create Academic Session
                </Button>
              </Paper>
            ) : (
              <Stack spacing={2.5}>
                {academicYears.map((year: any) => {
                  const isCurrent = year.isCurrent;
                  return (
                    <Accordion
                      key={year.id}
                      defaultExpanded={isCurrent}
                      sx={{
                        borderRadius: 2.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: isCurrent ? '#3b82f6' : '#e2e8f0',
                        boxShadow: isCurrent ? '0 4px 12px rgba(59, 130, 246, 0.12)' : 'none',
                        '&:before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2, flexWrap: 'wrap', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <CalendarIcon color={isCurrent ? 'primary' : 'action'} />
                            <Typography variant="subtitle1" fontWeight={700}>
                              Academic Year {year.name}
                            </Typography>
                            {isCurrent ? (
                              <Chip label="Active Session" color="primary" size="small" sx={{ fontWeight: 700 }} />
                            ) : (
                              <Chip label="Archived / Inactive" variant="outlined" size="small" />
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(year.startDate).toLocaleDateString()} — {new Date(year.endDate).toLocaleDateString()}
                            </Typography>
                            <Chip label={(year.terms?.length || 0) + ' Terms'} size="small" variant="outlined" />

                            {!isCurrent && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentYearMutation.mutate(year.id);
                                }}
                                disabled={setCurrentYearMutation.isPending}
                                sx={{ textTransform: 'none', fontWeight: 600, ml: 1 }}
                              >
                                Set as Active
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ bgcolor: '#f8fafc', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={700}>
                            Term Schedules & Breakdown
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setSelectedYearIdForTerm(year.id);
                              setOpenTermModal(true);
                            }}
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Add Term
                          </Button>
                        </Box>

                        {year.terms && year.terms.length > 0 ? (
                          <Grid container spacing={2}>
                            {year.terms.map((term: any, idx: number) => (
                              <Grid item xs={12} sm={6} md={4} key={term.id || idx}>
                                <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body1" fontWeight={700} color="primary.main">
                                      {term.name}
                                    </Typography>
                                    <Chip label={'Term ' + (idx + 1)} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }} />
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Start: <strong>{new Date(term.startDate).toLocaleDateString()}</strong>
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    End: <strong>{new Date(term.endDate).toLocaleDateString()}</strong>
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        ) : (
                          <Alert severity="info" sx={{ borderRadius: 2 }}>
                            No term schedules defined for this academic year. Click "Add Term" above to define term dates.
                          </Alert>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            )}
          </CardContent>
        )}

        {/* TAB 3: AUDIT LOGS & SECURITY */}
        {tabIndex === 3 && (
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  System Security & Audit Trail
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete immutable log of all administrative changes, profile edits, user logins, and critical operations.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => refetchAuditLogs()}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
              >
                Refresh Logs
              </Button>
            </Box>

            {/* Filter Toolbar */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search action, entity or ID..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="action-filter-label">Filter Action</InputLabel>
                    <Select
                      labelId="action-filter-label"
                      value={auditFilterAction}
                      label="Filter Action"
                      onChange={(e) => setAuditFilterAction(e.target.value)}
                    >
                      <MenuItem value="ALL">All Actions</MenuItem>
                      <MenuItem value="UPDATE">UPDATE</MenuItem>
                      <MenuItem value="CREATE">CREATE</MenuItem>
                      <MenuItem value="DELETE">DELETE</MenuItem>
                      <MenuItem value="LOGIN">LOGIN</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="entity-filter-label">Filter Entity</InputLabel>
                    <Select
                      labelId="entity-filter-label"
                      value={auditFilterEntity}
                      label="Filter Entity"
                      onChange={(e) => setAuditFilterEntity(e.target.value)}
                    >
                      <MenuItem value="ALL">All Entities</MenuItem>
                      <MenuItem value="School">School</MenuItem>
                      <MenuItem value="User">User</MenuItem>
                      <MenuItem value="AcademicYear">AcademicYear</MenuItem>
                      <MenuItem value="Student">Student</MenuItem>
                      <MenuItem value="FeeInvoice">FeeInvoice</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Audit Logs Table */}
            {loadingAuditLogs ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : auditLogs.length === 0 ? (
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc' }}>
                <SecurityIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                  No Audit Logs Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No administrative actions match your current filter parameters.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <Table size="medium">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actor / User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Entity & ID</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Network IP</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Changes / Diff</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const getActionChip = (action: string) => {
                        switch (action.toUpperCase()) {
                          case 'CREATE':
                            return <Chip label="CREATE" size="small" color="success" sx={{ fontWeight: 700 }} />;
                          case 'UPDATE':
                            return <Chip label="UPDATE" size="small" color="primary" sx={{ fontWeight: 700 }} />;
                          case 'DELETE':
                            return <Chip label="DELETE" size="small" color="error" sx={{ fontWeight: 700 }} />;
                          case 'LOGIN':
                            return <Chip label="LOGIN" size="small" color="secondary" sx={{ fontWeight: 700 }} />;
                          default:
                            return <Chip label={action} size="small" sx={{ fontWeight: 700 }} />;
                        }
                      };

                      return (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#3b82f6' }}>
                                {log.user?.firstName ? log.user.firstName.charAt(0) : 'S'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {log.user ? log.user.firstName + ' ' + log.user.lastName : 'System Admin'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {log.user?.email || 'automated'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{getActionChip(log.action)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {log.entityName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {log.entityId?.length > 18 ? log.entityId.substring(0, 18) + '...' : log.entityId}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'text.secondary' }}>
                            {log.ipAddress || '127.0.0.1'}
                          </TableCell>
                          <TableCell align="right">
                            {log.oldValues || log.newValues ? (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewIcon />}
                                onClick={() => setInspectDiffModal({ open: true, log })}
                                sx={{ textTransform: 'none', fontWeight: 600 }}
                              >
                                Inspect Diff
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No diff
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        )}
      </Card>

      {/* DIALOG: CREATE ACADEMIC YEAR */}
      <Dialog open={openYearModal} onClose={() => setOpenYearModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Create New Academic Session
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Academic Session Name"
              value={newYearForm.name}
              onChange={(e) => setNewYearForm({ ...newYearForm, name: e.target.value })}
              placeholder="e.g. 2026-2027"
              helperText="Standard format: YYYY-YYYY"
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={newYearForm.startDate}
                  onChange={(e) => setNewYearForm({ ...newYearForm, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={newYearForm.endDate}
                  onChange={(e) => setNewYearForm({ ...newYearForm, endDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={newYearForm.isCurrent}
                  onChange={(e) => setNewYearForm({ ...newYearForm, isCurrent: e.target.checked })}
                  color="primary"
                />
              }
              label="Designate as current active session immediately"
            />

            <Divider />
            <Typography variant="subtitle2" fontWeight={700}>
              Initial Term Schedules (3 Defaults Provided)
            </Typography>

            {newYearForm.terms.map((term, index) => (
              <Box key={index} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Term Name"
                      value={term.name}
                      onChange={(e) => {
                        const updated = [...newYearForm.terms];
                        updated[index].name = e.target.value;
                        setNewYearForm({ ...newYearForm, terms: updated });
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Start"
                      type="date"
                      value={term.startDate}
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) => {
                        const updated = [...newYearForm.terms];
                        updated[index].startDate = e.target.value;
                        setNewYearForm({ ...newYearForm, terms: updated });
                      }}
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="End"
                      type="date"
                      value={term.endDate}
                      InputLabelProps={{ shrink: true }}
                      onChange={(e) => {
                        const updated = [...newYearForm.terms];
                        updated[index].endDate = e.target.value;
                        setNewYearForm({ ...newYearForm, terms: updated });
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenYearModal(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={createYearMutation.isPending || !newYearForm.name}
            onClick={() => createYearMutation.mutate(newYearForm)}
            sx={{ textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            {createYearMutation.isPending ? 'Creating Session...' : 'Create Academic Year'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: ADD TERM */}
      <Dialog open={openTermModal} onClose={() => setOpenTermModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add Term Schedule
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Term Name"
              value={newTermForm.name}
              onChange={(e) => setNewTermForm({ ...newTermForm, name: e.target.value })}
              placeholder="e.g. Term 2 or Semester 2"
              required
            />
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={newTermForm.startDate}
              onChange={(e) => setNewTermForm({ ...newTermForm, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={newTermForm.endDate}
              onChange={(e) => setNewTermForm({ ...newTermForm, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTermModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={createTermMutation.isPending}
            onClick={() => {
              if (selectedYearIdForTerm) {
                createTermMutation.mutate({
                  yearId: selectedYearIdForTerm,
                  data: newTermForm
                });
              }
            }}
          >
            {createTermMutation.isPending ? 'Adding...' : 'Add Term'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: INSPECT AUDIT DIFF */}
      <Dialog
        open={inspectDiffModal.open}
        onClose={() => setInspectDiffModal({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Inspect Audit Event: {inspectDiffModal.log?.action} ({inspectDiffModal.log?.entityName})
        </DialogTitle>
        <DialogContent dividers>
          {inspectDiffModal.log && (
            <Box>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Timestamp:</strong> {new Date(inspectDiffModal.log.createdAt).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>User:</strong> {inspectDiffModal.log.user ? inspectDiffModal.log.user.firstName + ' ' + inspectDiffModal.log.user.lastName + ' (' + inspectDiffModal.log.user.email + ')' : 'System'}
                </Typography>
                <Typography variant="body2">
                  <strong>IP Address:</strong> {inspectDiffModal.log.ipAddress || '127.0.0.1'} | <strong>Agent:</strong> {inspectDiffModal.log.userAgent || 'School ERP'}
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} color="error.main" sx={{ mb: 1 }}>
                    Previous Values (Before)
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#fff1f2',
                      border: '1px solid #fecdd3',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxHeight: 300,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {inspectDiffModal.log.oldValues
                      ? JSON.stringify(inspectDiffModal.log.oldValues, null, 2)
                      : 'None (New Record)'}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={700} color="success.main" sx={{ mb: 1 }}>
                    Updated Values (After)
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      maxHeight: 300,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {inspectDiffModal.log.newValues
                      ? JSON.stringify(inspectDiffModal.log.newValues, null, 2)
                      : 'None (Deleted)'}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setInspectDiffModal({ open: false, log: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
