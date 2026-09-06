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
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  ButtonGroup,
  Stack
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  EventBusy as LeaveIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarMonthIcon,
  AssignmentTurnedIn as BatchDoneIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import type { AttendanceStatus, AttendanceSheetResponse, MonthlyAttendanceReportResponse } from '@school/types';

const AttendanceStatusMap = {
  PRESENT: 'PRESENT' as AttendanceStatus,
  ABSENT: 'ABSENT' as AttendanceStatus,
  LATE: 'LATE' as AttendanceStatus,
  HALF_DAY: 'HALF_DAY' as AttendanceStatus,
  EXCUSED_LEAVE: 'EXCUSED_LEAVE' as AttendanceStatus
};

export const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [tabIndex, setTabIndex] = useState(0);

  // Filter States
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Monthly Filter States
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // In-memory local draft of daily marks
  const [localRecords, setLocalRecords] = useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<{
    id: string;
    studentName: string;
    status: AttendanceStatus;
    remarks: string;
  } | null>(null);

  // Confirm Lock Dialog
  const [openLockDialog, setOpenLockDialog] = useState(false);

  // 1. Fetch Classes and Sections
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res: any = await apiClient.get('/academics/classes');
      return res.data || res;
    }
  });

  const classes: any[] = Array.isArray(classesData) ? classesData : [];

  // Default selection when classes load
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
      if (classes[0].sections && classes[0].sections.length > 0) {
        setSelectedSectionId(classes[0].sections[0].id);
      }
    }
  }, [classes, selectedClassId]);

  // Update section if class changes
  const currentClass = classes.find((c) => c.id === selectedClassId);
  const sections: any[] = currentClass?.sections || [];

  useEffect(() => {
    if (sections.length > 0) {
      if (!sections.some((s) => s.id === selectedSectionId)) {
        setSelectedSectionId(sections[0].id);
      }
    } else {
      setSelectedSectionId('');
    }
  }, [selectedClassId, sections, selectedSectionId]);

  // 2. Fetch Daily Attendance Sheet
  const {
    data: sheetData,
    isLoading: loadingSheet,
    refetch: refetchSheet
  } = useQuery<AttendanceSheetResponse>({
    queryKey: ['attendance-sheet', selectedClassId, selectedSectionId, selectedDate],
    queryFn: async () => {
      if (!selectedClassId || !selectedSectionId || !selectedDate) return null as any;
      const res: any = await apiClient.get(
        `/attendance/sheet?classId=${selectedClassId}&sectionId=${selectedSectionId}&date=${selectedDate}`
      );
      return res.data || res;
    },
    enabled: Boolean(selectedClassId && selectedSectionId && selectedDate)
  });

  // Sync server records to local editable draft state
  useEffect(() => {
    if (sheetData?.records) {
      const draft: Record<string, { status: AttendanceStatus; remarks: string }> = {};
      sheetData.records.forEach((r) => {
        draft[r.studentId] = {
          status: r.status === 'PENDING' ? AttendanceStatusMap.PRESENT : (r.status as AttendanceStatus),
          remarks: r.remarks || ''
        };
      });
      setLocalRecords(draft);
    }
  }, [sheetData]);

  // 3. Fetch Monthly Report
  const {
    data: monthlyReport,
    isLoading: loadingMonthly,
    refetch: refetchMonthly
  } = useQuery<MonthlyAttendanceReportResponse>({
    queryKey: ['attendance-monthly', selectedClassId, selectedSectionId, reportMonth, reportYear],
    queryFn: async () => {
      if (!selectedClassId || !selectedSectionId) return null as any;
      const res: any = await apiClient.get(
        `/attendance/monthly-report?classId=${selectedClassId}&sectionId=${selectedSectionId}&month=${reportMonth}&year=${reportYear}`
      );
      return res.data || res;
    },
    enabled: Boolean(tabIndex === 1 && selectedClassId && selectedSectionId)
  });

  // Batch Save Mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!sheetData?.records) return;
      const recordsToSubmit = sheetData.records.map((r) => ({
        studentId: r.studentId,
        status: localRecords[r.studentId]?.status || AttendanceStatusMap.PRESENT,
        remarks: localRecords[r.studentId]?.remarks || ''
      }));

      return apiClient.post('/attendance/batch', {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate,
        records: recordsToSubmit
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      setAlertMessage({
        type: 'success',
        text: res?.message || 'Daily attendance recorded successfully!'
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to save attendance records.'
      });
    }
  });

  // Lock Attendance Mutation
  const lockAttendanceMutation = useMutation({
    mutationFn: async () => {
      return apiClient.post('/attendance/lock', {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        date: selectedDate
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sheet'] });
      setOpenLockDialog(false);
      setAlertMessage({
        type: 'success',
        text: res?.message || 'Attendance finalized and locked successfully.'
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to lock attendance.'
      });
    }
  });

  // Administrative Correction Mutation
  const correctAttendanceMutation = useMutation({
    mutationFn: async () => {
      if (!correctionTarget) return;
      return apiClient.patch(`/attendance/${correctionTarget.id}`, {
        status: correctionTarget.status,
        remarks: correctionTarget.remarks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-sheet'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] });
      setCorrectionTarget(null);
      setAlertMessage({
        type: 'success',
        text: 'Attendance record corrected per administrative authorization.'
      });
    },
    onError: (err: any) => {
      setAlertMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Failed to correct record.'
      });
    }
  });

  // Fast Roster Helpers
  const handleMarkAllPresent = () => {
    if (!sheetData?.records) return;
    const updated = { ...localRecords };
    sheetData.records.forEach((r) => {
      updated[r.studentId] = {
        status: AttendanceStatusMap.PRESENT,
        remarks: updated[r.studentId]?.remarks || ''
      };
    });
    setLocalRecords(updated);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setLocalRecords((prev) => ({
      ...prev,
      [studentId]: {
        status,
        remarks: prev[studentId]?.remarks || ''
      }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setLocalRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || AttendanceStatusMap.PRESENT,
        remarks
      }
    }));
  };

  const isLocked = Boolean(sheetData?.isLocked);
  const canMark = hasPermission('attendance.mark');
  const canLock = hasPermission('attendance.lock');
  const canCorrect = hasPermission('attendance.correct');

  // Month array for select
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Attendance Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rainbow English Medium Primary School &bull; Daily & Monthly Student Tracking
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              if (tabIndex === 0) refetchSheet();
              else refetchMonthly();
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Alert Banner */}
      {alertMessage && (
        <Alert
          severity={alertMessage.type}
          onClose={() => setAlertMessage(null)}
          sx={{ mb: 3 }}
        >
          {alertMessage.text}
        </Alert>
      )}

      {/* Main Container Card */}
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, val) => setTabIndex(val)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}
        >
          <Tab icon={<TodayIcon />} iconPosition="start" label="Daily Attendance Sheet" />
          <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Monthly Attendance Register" />
        </Tabs>

        <CardContent sx={{ p: 3 }}>
          {/* TAB 0: DAILY ATTENDANCE */}
          {tabIndex === 0 && (
            <Box>
              {/* Filter Ribbon */}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={selectedClassId}
                      label="Class"
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      {classes.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small" disabled={sections.length === 0}>
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={selectedSectionId}
                      label="Section"
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                    >
                      {sections.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          Section {s.name} ({s.capacity} Max)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Attendance Date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', gap: 1, justifyContent: { md: 'flex-end' } }}>
                  {!isLocked && canMark && (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<BatchDoneIcon />}
                      onClick={handleMarkAllPresent}
                      disabled={!sheetData || sheetData.records.length === 0}
                    >
                      Mark All Present
                    </Button>
                  )}
                </Grid>
              </Grid>

              {/* Status & Summary Stats Bar */}
              {sheetData && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">
                        Class & Section:
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {sheetData.className} — Section {sheetData.sectionName}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {isLocked ? (
                          <Chip
                            icon={<LockIcon />}
                            label={`Locked & Finalized`}
                            color="error"
                            size="small"
                            variant="filled"
                          />
                        ) : (
                          <Chip
                            icon={<LockOpenIcon />}
                            label="Open for Editing"
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <Typography variant="body2" color="text.secondary">
                        Total Enrolled
                      </Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {sheetData.summary.totalStudents}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <Typography variant="body2" color="success.main">
                        Present
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        {sheetData.summary.presentCount}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3} md={2}>
                      <Typography variant="body2" color="error.main">
                        Absent
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="error.main">
                        {sheetData.summary.absentCount}
                      </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3} md={3}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Attendance Rate
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {sheetData.summary.attendancePercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={sheetData.summary.attendancePercentage}
                        color={sheetData.summary.attendancePercentage >= 75 ? 'success' : 'warning'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Roster Table */}
              {loadingSheet ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                  <CircularProgress />
                </Box>
              ) : !sheetData || sheetData.records.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Enrolled Students Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please ensure students are admitted and enrolled in this class and section.
                  </Typography>
                </Paper>
              ) : (
                <Box>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="medium">
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell width="80">Roll No</TableCell>
                          <TableCell>Student Details</TableCell>
                          <TableCell width="160">Admission No</TableCell>
                          <TableCell align="center" width="340">Attendance Status</TableCell>
                          <TableCell width="240">Remarks / Notes</TableCell>
                          {isLocked && canCorrect && (
                            <TableCell align="center" width="100">Override</TableCell>
                          )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sheetData.records.map((student) => {
                          const currentStatus =
                            localRecords[student.studentId]?.status ||
                            (student.status !== 'PENDING' ? student.status : AttendanceStatusMap.PRESENT);
                          const currentRemarks =
                            localRecords[student.studentId]?.remarks ?? (student.remarks || '');

                          return (
                            <TableRow key={student.studentId} hover>
                              <TableCell>
                                <Typography fontWeight={600}>
                                  {student.rollNumber ? `#${student.rollNumber}` : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                                    {student.studentName.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>
                                      {student.studentName}
                                    </Typography>
                                    {student.status === 'PENDING' && (
                                      <Chip label="Unmarked" size="small" variant="outlined" color="default" sx={{ height: 20, fontSize: '0.65rem' }} />
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {student.admissionNumber}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <ButtonGroup
                                  size="small"
                                  disabled={isLocked || !canMark}
                                  sx={{ borderRadius: 2 }}
                                >
                                  <Button
                                    variant={currentStatus === AttendanceStatusMap.PRESENT ? 'contained' : 'outlined'}
                                    color="success"
                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatusMap.PRESENT)}
                                    sx={{ minWidth: 42, fontWeight: 700 }}
                                  >
                                    P
                                  </Button>
                                  <Button
                                    variant={currentStatus === AttendanceStatusMap.ABSENT ? 'contained' : 'outlined'}
                                    color="error"
                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatusMap.ABSENT)}
                                    sx={{ minWidth: 42, fontWeight: 700 }}
                                  >
                                    A
                                  </Button>
                                  <Button
                                    variant={currentStatus === AttendanceStatusMap.LATE ? 'contained' : 'outlined'}
                                    color="warning"
                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatusMap.LATE)}
                                    sx={{ minWidth: 42, fontWeight: 700 }}
                                  >
                                    L
                                  </Button>
                                  <Button
                                    variant={currentStatus === AttendanceStatusMap.HALF_DAY ? 'contained' : 'outlined'}
                                    color="secondary"
                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatusMap.HALF_DAY)}
                                    sx={{ minWidth: 46, fontWeight: 700 }}
                                  >
                                    HD
                                  </Button>
                                  <Button
                                    variant={currentStatus === AttendanceStatusMap.EXCUSED_LEAVE ? 'contained' : 'outlined'}
                                    color="info"
                                    onClick={() => handleStatusChange(student.studentId, AttendanceStatusMap.EXCUSED_LEAVE)}
                                    sx={{ minWidth: 48, fontWeight: 700 }}
                                  >
                                    LVE
                                  </Button>
                                </ButtonGroup>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  fullWidth
                                  size="small"
                                  placeholder={currentStatus === AttendanceStatusMap.ABSENT ? 'Reason for absence...' : 'Optional notes...'}
                                  value={currentRemarks}
                                  disabled={isLocked || !canMark}
                                  onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                                />
                              </TableCell>
                              {isLocked && canCorrect && (
                                <TableCell align="center">
                                  <Tooltip title="Administrative Correction">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => {
                                        setCorrectionTarget({
                                          id: student.id || '',
                                          studentName: student.studentName,
                                          status: currentStatus,
                                          remarks: currentRemarks
                                        });
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Submission Action Bar */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2, alignItems: 'center' }}>
                    {isLocked ? (
                      <Alert severity="info" icon={<LockIcon fontSize="inherit" />} sx={{ py: 0, px: 2 }}>
                        This register is locked. Further modifications require administrative correction.
                      </Alert>
                    ) : (
                      <>
                        {canLock && (
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LockIcon />}
                            onClick={() => setOpenLockDialog(true)}
                          >
                            Lock & Finalize Register
                          </Button>
                        )}
                        {canMark && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={() => saveAttendanceMutation.mutate()}
                            disabled={saveAttendanceMutation.isPending}
                          >
                            {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                          </Button>
                        )}
                      </>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* TAB 1: MONTHLY REGISTER MATRIX */}
          {tabIndex === 1 && (
            <Box>
              {/* Monthly Filter Ribbon */}
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={selectedClassId}
                      label="Class"
                      onChange={(e) => setSelectedClassId(e.target.value)}
                    >
                      {classes.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small" disabled={sections.length === 0}>
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={selectedSectionId}
                      label="Section"
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                    >
                      {sections.map((s) => (
                        <MenuItem key={s.id} value={s.id}>
                          Section {s.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={reportMonth}
                      label="Month"
                      onChange={(e) => setReportMonth(Number(e.target.value))}
                    >
                      {monthNames.map((name, index) => (
                        <MenuItem key={index + 1} value={index + 1}>
                          {name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={reportYear}
                      label="Year"
                      onChange={(e) => setReportYear(Number(e.target.value))}
                    >
                      {[2025, 2026, 2027].map((yr) => (
                        <MenuItem key={yr} value={yr}>
                          {yr}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Monthly Legend */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Legend:
                </Typography>
                <Chip size="small" label="P = Present" color="success" sx={{ fontWeight: 600 }} />
                <Chip size="small" label="A = Absent" color="error" sx={{ fontWeight: 600 }} />
                <Chip size="small" label="L = Late" color="warning" sx={{ fontWeight: 600 }} />
                <Chip size="small" label="HD = Half Day (0.5)" color="secondary" sx={{ fontWeight: 600 }} />
                <Chip size="small" label="LVE = Excused Leave" color="info" sx={{ fontWeight: 600 }} />
                <Chip size="small" label="< 75% = Warning" icon={<WarningIcon />} color="error" variant="outlined" />
              </Box>

              {/* Monthly Grid */}
              {loadingMonthly ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
                  <CircularProgress />
                </Box>
              ) : !monthlyReport || monthlyReport.students.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h6" color="text.secondary">
                    No Attendance Data Available for this Month
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 600 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 60, bgcolor: 'grey.100', fontWeight: 700 }}>Roll</TableCell>
                        <TableCell sx={{ minWidth: 160, bgcolor: 'grey.100', fontWeight: 700 }}>Student</TableCell>
                        {Array.from({ length: monthlyReport.totalDaysInMonth }, (_, i) => i + 1).map((day) => (
                          <TableCell
                            key={day}
                            align="center"
                            sx={{ minWidth: 32, p: 0.5, bgcolor: 'grey.100', fontSize: '0.75rem', fontWeight: 700 }}
                          >
                            {day}
                          </TableCell>
                        ))}
                        <TableCell align="center" sx={{ minWidth: 70, bgcolor: 'grey.100', fontWeight: 700 }}>Pres.</TableCell>
                        <TableCell align="center" sx={{ minWidth: 70, bgcolor: 'grey.100', fontWeight: 700 }}>Abs.</TableCell>
                        <TableCell align="center" sx={{ minWidth: 90, bgcolor: 'grey.100', fontWeight: 700 }}>Rate %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyReport.students.map((st) => (
                        <TableRow key={st.studentId} hover>
                          <TableCell>#{st.rollNumber || '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{st.studentName}</TableCell>
                          {Array.from({ length: monthlyReport.totalDaysInMonth }, (_, i) => i + 1).map((day) => {
                            const val = st.days[day] || '-';
                            let bgColor = 'transparent';
                            let textColor = 'text.secondary';

                            if (val === 'PRESENT') {
                              bgColor = '#e8f5e9';
                              textColor = '#2e7d32';
                            } else if (val === 'ABSENT') {
                              bgColor = '#ffebee';
                              textColor = '#c62828';
                            } else if (val === 'LATE') {
                              bgColor = '#fff3e0';
                              textColor = '#ef6c00';
                            } else if (val === 'HALF_DAY') {
                              bgColor = '#f3e5f5';
                              textColor = '#7b1fa2';
                            } else if (val === 'EXCUSED_LEAVE') {
                              bgColor = '#e1f5fe';
                              textColor = '#0277bd';
                            }

                            return (
                              <TableCell
                                key={day}
                                align="center"
                                sx={{
                                  p: 0.25,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  bgcolor: bgColor,
                                  color: textColor,
                                  borderRight: '1px solid #f0f0f0'
                                }}
                              >
                                {val === 'EXCUSED_LEAVE' ? 'LVE' : val === 'HALF_DAY' ? 'HD' : val}
                              </TableCell>
                            );
                          })}
                          <TableCell align="center" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {st.presentCount}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, color: 'error.main' }}>
                            {st.absentCount}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={`${st.attendancePercentage}%`}
                              color={st.isLowAttendance ? 'error' : st.attendancePercentage >= 75 ? 'success' : 'default'}
                              icon={st.isLowAttendance ? <WarningIcon fontSize="small" /> : undefined}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Lock Confirmation Dialog */}
      <Dialog open={openLockDialog} onClose={() => setOpenLockDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon color="error" /> Finalize & Lock Register?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Once locked, teachers will not be able to change or resubmit attendance records for{' '}
            <strong>{selectedDate}</strong>. Any changes will require administrative correction privileges.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLockDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => lockAttendanceMutation.mutate()}
            disabled={lockAttendanceMutation.isPending}
          >
            {lockAttendanceMutation.isPending ? 'Locking...' : 'Yes, Lock Register'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Administrative Correction Dialog */}
      <Dialog
        open={Boolean(correctionTarget)}
        onClose={() => setCorrectionTarget(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Administrative Attendance Correction</DialogTitle>
        <DialogContent>
          {correctionTarget && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Student: <strong>{correctionTarget.studentName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Date: {selectedDate}
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Corrected Status</InputLabel>
                <Select
                  value={correctionTarget.status}
                  label="Corrected Status"
                  onChange={(e) =>
                    setCorrectionTarget({
                      ...correctionTarget,
                      status: e.target.value as AttendanceStatus
                    })
                  }
                >
                  <MenuItem value={AttendanceStatusMap.PRESENT}>PRESENT</MenuItem>
                  <MenuItem value={AttendanceStatusMap.ABSENT}>ABSENT</MenuItem>
                  <MenuItem value={AttendanceStatusMap.LATE}>LATE</MenuItem>
                  <MenuItem value={AttendanceStatusMap.HALF_DAY}>HALF_DAY</MenuItem>
                  <MenuItem value={AttendanceStatusMap.EXCUSED_LEAVE}>EXCUSED_LEAVE</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Correction Reason / Audit Rationale"
                placeholder="e.g., Parent provided validated doctor note; Principal authorized excused absence."
                value={correctionTarget.remarks}
                onChange={(e) =>
                  setCorrectionTarget({
                    ...correctionTarget,
                    remarks: e.target.value
                  })
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCorrectionTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => correctAttendanceMutation.mutate()}
            disabled={correctAttendanceMutation.isPending}
          >
            {correctAttendanceMutation.isPending ? 'Saving...' : 'Apply Correction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
