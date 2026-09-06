import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination,
  Grid,
  Divider,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  School as EnrollIcon,
  RateReview as ReviewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuthStore } from '../../app/store/useAuthStore';

export const AdmissionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog States
  const [openNewModal, setOpenNewModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [openConvertModal, setOpenConvertModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // New Application Form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('2020-01-01');
  const [applyingClassId, setApplyingClassId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Review & Convert Form
  const [reviewStatus, setReviewStatus] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [convertSectionId, setConvertSectionId] = useState('');
  const [convertRollNo, setConvertRollNo] = useState<number | ''>('');

  // Queries
  const { data: applicationsResponse, isLoading } = useQuery({
    queryKey: ['admissions', page + 1, rowsPerPage, search, statusFilter],
    queryFn: async () => {
      const res: any = await apiClient.get('/admissions', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
          status: statusFilter || undefined
        }
      });
      return res.data || res;
    }
  });

  const { data: classesResponse } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res: any = await apiClient.get('/academics/classes');
      return res.data || res;
    }
  });

  const classes = Array.isArray(classesResponse) ? classesResponse : [];
  const applications = applicationsResponse?.data || [];
  const totalItems = applicationsResponse?.meta?.totalItems || 0;

  // Mutations
  const createApplicationMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/admissions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      setOpenNewModal(false);
      resetNewForm();
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to submit application')
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: any) => apiClient.patch(`/admissions/${id}/status`, { status, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      setOpenReviewModal(false);
    }
  });

  const convertMutation = useMutation({
    mutationFn: ({ id, data }: any) => apiClient.post(`/admissions/${id}/convert`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setOpenConvertModal(false);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to convert applicant')
  });

  const resetNewForm = () => {
    setFirstName('');
    setLastName('');
    setGender('MALE');
    setDateOfBirth('2020-01-01');
    setApplyingClassId('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setAddress('');
    setNotes('');
    setFormError(null);
  };

  const handleOpenReview = (app: any) => {
    setSelectedApp(app);
    setReviewStatus(app.status === 'SUBMITTED' ? 'APPROVED' : app.status);
    setReviewNotes(app.notes || '');
    setOpenReviewModal(true);
  };

  const handleOpenConvert = (app: any) => {
    setSelectedApp(app);
    setConvertSectionId('');
    setConvertRollNo('');
    setFormError(null);
    setOpenConvertModal(true);
  };

  // Sections for the converting class
  const targetClass = classes.find((c: any) => c.id === selectedApp?.applyingForClassId);
  const targetSections = targetClass?.sections || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Student Admissions Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process inquiries, document verifications, approvals, and one-click student enrollment
          </Typography>
        </Box>
        {hasPermission('admissions.create') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setFormError(null); setOpenNewModal(true); }}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            New Admission Inquiry
          </Button>
        )}
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search by applicant name, app no, parent..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: { xs: '100%', sm: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Application Stage</InputLabel>
            <Select
              value={statusFilter}
              label="Application Stage"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All Applications</MenuItem>
              <MenuItem value="SUBMITTED">Submitted</MenuItem>
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="ENROLLED">Enrolled as Student</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>App No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Applicant Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Applying For</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Parent / Contact</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                        No admission applications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app: any) => (
                      <TableRow key={app.id} hover>
                        <TableCell>
                          <Chip label={app.applicationNo} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {app.firstName} {app.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Gender: {app.gender} | DOB: {new Date(app.dateOfBirth).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={app.applyingClass?.name || 'Class'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{app.parentName}</Typography>
                          <Typography variant="caption" color="text.secondary">{app.parentPhone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={app.status} />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            {app.status !== 'ENROLLED' && hasPermission('admissions.approve') && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ReviewIcon />}
                                onClick={() => handleOpenReview(app)}
                              >
                                Review
                              </Button>
                            )}

                            {app.status === 'APPROVED' && hasPermission('admissions.approve') && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<EnrollIcon />}
                                onClick={() => handleOpenConvert(app)}
                              >
                                Convert to Student
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalItems}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Card>

      {/* New Application Dialog */}
      <Dialog open={openNewModal} onClose={() => setOpenNewModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Admission Inquiry Application</DialogTitle>
        <Box component="form" onSubmit={(e) => {
          e.preventDefault();
          createApplicationMutation.mutate({
            firstName,
            lastName,
            gender,
            dateOfBirth,
            applyingForClassId: applyingClassId,
            parentName,
            parentPhone,
            parentEmail: parentEmail || undefined,
            address: address || undefined,
            notes: notes || undefined
          });
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Candidate First Name" size="small" required fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Candidate Last Name" size="small" required fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select value={gender} label="Gender" onChange={(e) => setGender(e.target.value)}>
                    <MenuItem value="MALE">Male</MenuItem>
                    <MenuItem value="FEMALE">Female</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Date of Birth" type="date" size="small" required fullWidth value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl size="small" fullWidth required>
                  <InputLabel>Applying For Class</InputLabel>
                  <Select value={applyingClassId} label="Applying For Class" onChange={(e) => setApplyingClassId(e.target.value)}>
                    {classes.map((c: any) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Parent / Guardian Name" size="small" required fullWidth value={parentName} onChange={(e) => setParentName(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Parent Phone" size="small" required fullWidth value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks / Special Requirements" size="small" multiline rows={2} fullWidth value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenNewModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createApplicationMutation.isPending}>
              {createApplicationMutation.isPending ? <CircularProgress size={24} /> : 'Submit Application'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={openReviewModal} onClose={() => setOpenReviewModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Review Admission Application</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <Typography variant="body2">
            Applicant: <strong>{selectedApp?.firstName} {selectedApp?.lastName}</strong> ({selectedApp?.applicationNo})
          </Typography>
          <FormControl size="small" fullWidth required>
            <InputLabel>Application Decision</InputLabel>
            <Select value={reviewStatus} label="Application Decision" onChange={(e) => setReviewStatus(e.target.value)}>
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="APPROVED">Approve for Admission</MenuItem>
              <MenuItem value="REJECTED">Reject Application</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Decision Notes"
            size="small"
            multiline
            rows={3}
            fullWidth
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenReviewModal(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            onClick={() => updateStatusMutation.mutate({ id: selectedApp.id, status: reviewStatus, notes: reviewNotes })}
            disabled={updateStatusMutation.isPending}
          >
            Update Decision
          </Button>
        </DialogActions>
      </Dialog>

      {/* Convert to Student Dialog */}
      <Dialog open={openConvertModal} onClose={() => setOpenConvertModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Convert to Enrolled Student
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <Typography variant="body2">
            Enrolling: <strong>{selectedApp?.firstName} {selectedApp?.lastName}</strong> into <strong>{targetClass?.name}</strong>
          </Typography>

          <FormControl size="small" fullWidth required>
            <InputLabel>Assign Section</InputLabel>
            <Select
              value={convertSectionId}
              label="Assign Section"
              onChange={(e) => setConvertSectionId(e.target.value)}
            >
              {targetSections.map((sec: any) => (
                <MenuItem key={sec.id} value={sec.id}>
                  Section {sec.name} ({sec._count?.studentEnrollments || 0}/{sec.capacity})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Assigned Roll Number"
            type="number"
            size="small"
            fullWidth
            value={convertRollNo}
            onChange={(e) => setConvertRollNo(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConvertModal(false)} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            color="success"
            disabled={!convertSectionId || convertMutation.isPending}
            onClick={() => {
              convertMutation.mutate({
                id: selectedApp.id,
                data: {
                  classId: selectedApp.applyingForClassId,
                  sectionId: convertSectionId,
                  rollNumber: convertRollNo ? Number(convertRollNo) : undefined
                }
              });
            }}
          >
            {convertMutation.isPending ? <CircularProgress size={24} /> : 'Complete Student Enrollment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
