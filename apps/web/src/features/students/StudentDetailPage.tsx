import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Tabs,
  Tab,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  HistoryEdu as AcademicHistoryIcon,
  Phone as PhoneIcon,
  Event as CalendarIcon,
  MedicalInformation as MedicalIcon,
  School as SchoolIcon,
  FactCheck as AttendanceIcon,
  ReceiptLong as FeeIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabIndex, setTabIndex] = useState(0);

  const { data: studentResponse, isLoading, error } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res: any = await apiClient.get(`/students/${id}`);
      return res;
    },
    enabled: !!id
  });

  const rawStudent = studentResponse?.data !== undefined ? studentResponse.data : studentResponse;
  const student = rawStudent?.data !== undefined ? rawStudent.data : rawStudent;

  const formatDate = (val: any) => {
    if (!val) return '-';
    const d = new Date(val);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !student || !student.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Student record could not be found or you do not have permission to view records from this branch.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/students')} sx={{ mt: 2 }}>
          Back to Students Directory
        </Button>
      </Box>
    );
  }

  const enrollment = student.currentEnrollment;
  const guardians = student.guardians || [];
  const attendanceRecords = student.attendanceRecords || [];
  const feeInvoices = student.feeInvoices || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Top Bar */}
      <Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/students')} sx={{ mb: 1.5 }}>
          Back to Students Directory
        </Button>

        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            border: '1px solid #e2e8f0'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 64,
                height: 64,
                fontSize: '1.6rem',
                fontWeight: 700
              }}
            >
              {student.firstName?.[0] || 'S'}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={700}>
                  {student.firstName} {student.middleName ? student.middleName + ' ' : ''}{student.lastName}
                </Typography>
                <StatusBadge status={student.status} />
                {student.school && (
                  <Chip
                    icon={<SchoolIcon />}
                    label={student.school.name ? `${student.school.name} (${student.school.code})` : student.school.code}
                    size="small"
                    variant="outlined"
                    color={student.school.code?.includes('CITY') ? 'secondary' : 'primary'}
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Admission No: <strong>{student.admissionNumber}</strong> | Roll No: <strong>{enrollment?.rollNumber ?? '-'}</strong>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {enrollment && (
              <Chip
                label={`${enrollment.class?.name || 'Class'} — Section ${enrollment.section?.name || 'A'}`}
                color="primary"
                sx={{ fontWeight: 700, px: 1 }}
              />
            )}
            <Chip
              label={enrollment?.academicYear?.name || 'Academic Year 2026–2027'}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Profile Tabs */}
      <Paper sx={{ borderRadius: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, newTab) => setTabIndex(newTab)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Profile & Bio" />
          <Tab icon={<FamilyIcon />} iconPosition="start" label={`Guardians (${guardians.length})`} />
          <Tab icon={<AcademicHistoryIcon />} iconPosition="start" label="Academic History" />
          <Tab icon={<AttendanceIcon />} iconPosition="start" label={`Attendance (${attendanceRecords.length})`} />
          <Tab icon={<FeeIcon />} iconPosition="start" label={`Fee Invoices (${feeInvoices.length})`} />
        </Tabs>

        {/* Tab 0: Profile */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2.5, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Personal Information
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Campus / Branch:</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {student.school?.name ? `${student.school.name} (${student.school.code})` : (student.school?.code || 'Main Campus')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Date of Birth:</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDate(student.dateOfBirth)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Gender:</Typography>
                        <Typography variant="body2" fontWeight={600}>{student.gender || '-'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Blood Group:</Typography>
                        <Typography variant="body2" fontWeight={600}>{student.bloodGroup || '-'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Contact Phone:</Typography>
                        <Typography variant="body2" fontWeight={600}>{student.phone || '-'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Admission Date:</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatDate(student.admissionDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2.5, height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Medical & Background Notes
                    </Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          PREVIOUS SCHOOL
                        </Typography>
                        <Typography variant="body2">
                          {student.previousSchool || 'First time school admission'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          MEDICAL & ALLERGY NOTES
                        </Typography>
                        <Typography variant="body2">
                          {student.medicalNotes || 'No known allergies or medical restrictions recorded.'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 1: Guardians */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            {guardians.length === 0 ? (
              <Typography color="text.secondary">No guardians linked yet.</Typography>
            ) : (
              <Grid container spacing={2.5}>
                {guardians.map((gObj: any, idx: number) => {
                  const g = gObj.guardian;
                  if (!g) return null;
                  return (
                    <Grid item xs={12} sm={6} key={g.id || idx}>
                      <Card sx={{ borderRadius: 2.5, border: gObj.isPrimary ? '1.5px solid #2563eb' : '1px solid #e2e8f0' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" fontWeight={700}>
                              {g.firstName} {g.lastName}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {gObj.isPrimary && <Chip label="PRIMARY" size="small" color="primary" sx={{ fontWeight: 700 }} />}
                              <Chip label={g.relationship || 'GUARDIAN'} size="small" variant="outlined" />
                            </Box>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="body2">
                              Phone: <strong>{g.phone || '-'}</strong>
                            </Typography>
                            {g.email && <Typography variant="body2">Email: <strong>{g.email}</strong></Typography>}
                            {g.occupation && <Typography variant="body2">Occupation: <strong>{g.occupation}</strong></Typography>}
                            {g.address && <Typography variant="body2">Address: {g.address}</Typography>}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 2: Academic History */}
        {tabIndex === 2 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Academic Year</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Section</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {student.enrollments && student.enrollments.length > 0 ? (
                    student.enrollments.map((e: any) => (
                      <TableRow key={e.id}>
                        <TableCell>{e.academicYear?.name || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{e.class?.name || '-'}</TableCell>
                        <TableCell>Section {e.section?.name || 'A'}</TableCell>
                        <TableCell>{e.rollNumber ?? '-'}</TableCell>
                        <TableCell>
                          <Chip label={e.status || 'ENROLLED'} size="small" color="primary" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No enrollment history records found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Attendance Records */}
        {tabIndex === 3 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((att: any) => (
                      <TableRow key={att.id}>
                        <TableCell>{formatDate(att.date)}</TableCell>
                        <TableCell>
                          <Chip
                            label={att.status}
                            size="small"
                            color={att.status === 'PRESENT' ? 'success' : att.status === 'ABSENT' ? 'error' : 'warning'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>{att.remarks || '—'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No attendance records logged yet for this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 4: Fee Invoices */}
        {tabIndex === 4 && (
          <Box sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Total Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Paid</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feeInvoices.length > 0 ? (
                    feeInvoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{inv.invoiceNumber}</TableCell>
                        <TableCell>₹{Number(inv.totalAmount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell>₹{Number(inv.paidAmount || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Chip
                            label={inv.status}
                            size="small"
                            color={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIAL' ? 'warning' : 'default'}
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No fee invoices generated yet for this student.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
