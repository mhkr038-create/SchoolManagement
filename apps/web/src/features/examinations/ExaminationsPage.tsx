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
  Checkbox,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  AssignmentTurnedIn as ExamIcon,
  Add as AddIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  EmojiEvents as TrophyIcon,
  CalendarToday as CalendarIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Grading as GradingIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { ReportCardModal } from './components/ReportCardModal';
import type {
  Examination,
  ExamSchedule,
  GradingSystem,
  ExamSheetResponse,
  ClassExamSummaryResponse
} from '@school/types';

export const ExaminationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { hasPermission, hasRole } = useAuthStore();
  const queryClient = useQueryClient();

  // Dialogs
  const [openCreateExamDialog, setOpenCreateExamDialog] = useState(false);
  const [openAddScheduleDialog, setOpenAddScheduleDialog] = useState(false);
  const [selectedExamForSchedule, setSelectedExamForSchedule] = useState<string>('');

  // Form states for creating exam
  const [examName, setExamName] = useState('');
  const [examYearId, setExamYearId] = useState('');
  const [examStartDate, setExamStartDate] = useState('2026-10-10');
  const [examEndDate, setExamEndDate] = useState('2026-10-20');
  const [examPublished, setExamPublished] = useState(true);

  // Form states for schedule
  const [schedClassId, setSchedClassId] = useState('');
  const [schedSubjectId, setSchedSubjectId] = useState('');
  const [schedDate, setSchedDate] = useState('2026-10-15');
  const [schedStartTime, setSchedStartTime] = useState('09:30 AM');
  const [schedEndTime, setSchedEndTime] = useState('11:30 AM');
  const [schedMaxMarks, setSchedMaxMarks] = useState<number>(100);
  const [schedPassingMarks, setSchedPassingMarks] = useState<number>(35);

  // Mark Entry Filter states
  const [markExamId, setMarkExamId] = useState('');
  const [markClassId, setMarkClassId] = useState('');
  const [markSectionId, setMarkSectionId] = useState('');
  const [markScheduleId, setMarkScheduleId] = useState('');
  const [markEntriesState, setMarkEntriesState] = useState<Record<string, { marks: number | null; isAbsent: boolean; remarks: string }>>({});

  // Report Cards Filter states
  const [reportExamId, setReportExamId] = useState('');
  const [reportClassId, setReportClassId] = useState('');
  const [reportSectionId, setReportSectionId] = useState('');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<string | null>(null);

  // Queries
  const { data: examinations = [], isLoading: loadingExams } = useQuery<Examination[]>({
    queryKey: ['examinations'],
    queryFn: async () => {
      const res = await apiClient.get('/examinations');
      return res.data.data;
    }
  });

  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['academics-classes'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data;
    }
  });

  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['academics-subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data.data;
    }
  });

  const { data: gradingSystems = [] } = useQuery<GradingSystem[]>({
    queryKey: ['grading-systems'],
    queryFn: async () => {
      const res = await apiClient.get('/examinations/grading-systems');
      return res.data.data;
    }
  });

  // Set default filter values once exams are loaded
  useEffect(() => {
    if (examinations.length > 0 && !markExamId) {
      const defaultExam = examinations[0];
      setMarkExamId(defaultExam.id);
      setReportExamId(defaultExam.id);
      if (defaultExam.academicYear?.id) {
        setExamYearId(defaultExam.academicYear.id);
      }
    }
  }, [examinations, markExamId]);

  useEffect(() => {
    if (classes.length > 0 && !markClassId) {
      const defaultClass = classes.find((c: any) => c.name === 'Class 1') || classes[0];
      setMarkClassId(defaultClass.id);
      setReportClassId(defaultClass.id);
      if (defaultClass.sections?.length > 0) {
        setMarkSectionId(defaultClass.sections[0].id);
        setReportSectionId(defaultClass.sections[0].id);
      }
    }
  }, [classes, markClassId]);

  // Selected Exam object
  const activeExam = examinations.find((e) => e.id === markExamId);
  const examSchedulesForClass = activeExam?.schedules?.filter((s) => s.classId === markClassId) || [];

  useEffect(() => {
    if (examSchedulesForClass.length > 0 && (!markScheduleId || !examSchedulesForClass.some((s) => s.id === markScheduleId))) {
      setMarkScheduleId(examSchedulesForClass[0].id);
    }
  }, [examSchedulesForClass, markScheduleId]);

  // Query: Mark Sheet
  const {
    data: markSheet,
    isLoading: loadingSheet,
    refetch: refetchSheet
  } = useQuery<ExamSheetResponse>({
    queryKey: ['mark-sheet', markScheduleId, markSectionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/examinations/marks/sheet?examScheduleId=${markScheduleId}&sectionId=${markSectionId}`
      );
      return res.data.data;
    },
    enabled: Boolean(markScheduleId) && Boolean(markSectionId)
  });

  // Populate local form state when markSheet changes
  useEffect(() => {
    if (markSheet?.entries) {
      const stateObj: Record<string, { marks: number | null; isAbsent: boolean; remarks: string }> = {};
      markSheet.entries.forEach((entry) => {
        stateObj[entry.studentId] = {
          marks: entry.marksObtained,
          isAbsent: entry.isAbsent,
          remarks: entry.remarks || ''
        };
      });
      setMarkEntriesState(stateObj);
    }
  }, [markSheet]);

  // Query: Class Summary for Report Cards
  const {
    data: classSummary,
    isLoading: loadingSummary,
    refetch: refetchSummary
  } = useQuery<ClassExamSummaryResponse>({
    queryKey: ['class-summary', reportExamId, reportClassId, reportSectionId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/examinations/${reportExamId}/class-summary?classId=${reportClassId}&sectionId=${reportSectionId}`
      );
      return res.data.data;
    },
    enabled: Boolean(reportExamId) && Boolean(reportClassId) && Boolean(reportSectionId)
  });

  // Mutations
  const createExamMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/examinations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      setOpenCreateExamDialog(false);
      setExamName('');
    }
  });

  const createScheduleMutation = useMutation({
    mutationFn: async ({ examId, payload }: { examId: string; payload: any }) => {
      return apiClient.post(`/examinations/${examId}/schedules`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      queryClient.invalidateQueries({ queryKey: ['mark-sheet'] });
      setOpenAddScheduleDialog(false);
    }
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      return apiClient.delete(`/examinations/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      queryClient.invalidateQueries({ queryKey: ['mark-sheet'] });
    }
  });

  const saveMarksMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/examinations/marks/batch', payload);
    },
    onSuccess: () => {
      refetchSheet();
      queryClient.invalidateQueries({ queryKey: ['class-summary'] });
    }
  });

  const lockMarksMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/examinations/marks/lock', payload);
    },
    onSuccess: () => {
      refetchSheet();
    }
  });

  const handleSaveMarks = () => {
    if (!markScheduleId || !markSheet) return;

    const entries = markSheet.entries.map((e) => {
      const local = markEntriesState[e.studentId] || { marks: null, isAbsent: false, remarks: '' };
      return {
        studentId: e.studentId,
        marksObtained: local.isAbsent ? null : local.marks,
        isAbsent: local.isAbsent,
        remarks: local.remarks
      };
    });

    saveMarksMutation.mutate({
      examScheduleId: markScheduleId,
      entries
    });
  };

  const handleToggleLock = () => {
    if (!markScheduleId || !markSheet) return;
    const currentLock = markSheet.examSchedule.isLocked;
    lockMarksMutation.mutate({
      examScheduleId: markScheduleId,
      isLocked: !currentLock
    });
  };

  const handleQuickFillPassing = () => {
    if (!markSheet) return;
    const passing = markSheet.examSchedule.passingMarks;
    const updated = { ...markEntriesState };
    markSheet.entries.forEach((e) => {
      if (updated[e.studentId] && !updated[e.studentId].isAbsent && updated[e.studentId].marks === null) {
        updated[e.studentId].marks = passing;
      }
    });
    setMarkEntriesState(updated);
  };

  // Grade color helper
  const getGradeColor = (grade: string | null | undefined) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'B':
      case 'C':
        return { bg: '#e3f2fd', color: '#1565c0' };
      case 'D':
      case 'E':
        return { bg: '#fff8e1', color: '#f57f17' };
      default:
        return { bg: '#ffebee', color: '#c62828' };
    }
  };

  // Calculate local grade for an entry
  const getDynamicGrade = (score: number | null, isAbsent: boolean, maxMarks: number) => {
    if (isAbsent) return { grade: 'F', status: 'ABSENT' };
    if (score === null || score === undefined) return { grade: '-', status: 'PENDING' };

    const scales = gradingSystems[0]?.gradeScales || [];
    const percentage = (score / maxMarks) * 100;
    const matched = scales.find(
      (s) => percentage >= Number(s.minPercentage) && percentage <= Number(s.maxPercentage)
    );
    return {
      grade: matched?.name || 'P',
      status: score >= (markSheet?.examSchedule.passingMarks || 35) ? 'PASS' : 'FAIL'
    };
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ExamIcon sx={{ color: 'primary.main', fontSize: 32 }} />
            Examinations & Academic Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage assessment schedules, bulk mark entry, grade thresholds, and printable student report cards.
          </Typography>
        </Box>

        {hasPermission('exams.manage') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateExamDialog(true)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
            }}
          >
            Create Examination
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, mb: 3, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="Exams & Schedules" icon={<CalendarIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab label="Mark Entry Matrix" icon={<GradingIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab label="Report Cards & Results" icon={<TrophyIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
          <Tab label="Grading Scales" icon={<SchoolIcon />} iconPosition="start" sx={{ fontWeight: 700 }} />
        </Tabs>

        {/* ------------------------------------------------------------- */}
        {/* TAB 0: EXAMINATIONS & SCHEDULES                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 0 && (
          <CardContent sx={{ p: 3 }}>
            {loadingExams ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : examinations.length === 0 ? (
              <Alert severity="info" sx={{ my: 2 }}>
                No examinations found for this branch. Click "Create Examination" to start scheduling tests.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {examinations.map((exam) => (
                  <Grid item xs={12} key={exam.id}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          gap: 1.5,
                          mb: 2
                        }}
                      >
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="h6" fontWeight={700} color="primary.main">
                              {exam.name}
                            </Typography>
                            <Chip
                              label={exam.isPublished ? 'PUBLISHED' : 'DRAFT'}
                              color={exam.isPublished ? 'success' : 'default'}
                              size="small"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Academic Year: <strong>{exam.academicYear?.name || '2026–2027'}</strong> | Window:{' '}
                            {new Date(exam.startDate).toLocaleDateString()} — {new Date(exam.endDate).toLocaleDateString()}
                          </Typography>
                        </Box>

                        {hasPermission('exams.manage') && (
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setSelectedExamForSchedule(exam.id);
                              setOpenAddScheduleDialog(true);
                            }}
                            sx={{ borderRadius: 2, fontWeight: 700 }}
                          >
                            Add Paper Schedule
                          </Button>
                        )}
                      </Box>

                      {/* Schedules Table */}
                      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
                        Scheduled Papers ({exam.schedules?.length || 0})
                      </Typography>

                      {exam.schedules && exam.schedules.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Max Marks</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Passing Marks</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {exam.schedules.map((s) => (
                                <TableRow key={s.id} hover>
                                  <TableCell sx={{ fontWeight: 600 }}>{s.class?.name}</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>{s.subject?.name}</TableCell>
                                  <TableCell>{new Date(s.examDate).toLocaleDateString()}</TableCell>
                                  <TableCell>{s.startTime} — {s.endTime}</TableCell>
                                  <TableCell align="center">{s.maxMarks}</TableCell>
                                  <TableCell align="center">{s.passingMarks}</TableCell>
                                  <TableCell align="center">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                      <Button
                                        size="small"
                                        variant="text"
                                        startIcon={<GradingIcon />}
                                        onClick={() => {
                                          setMarkExamId(exam.id);
                                          setMarkClassId(s.classId);
                                          setMarkScheduleId(s.id);
                                          setActiveTab(1); // switch to mark entry
                                        }}
                                        sx={{ fontWeight: 700 }}
                                      >
                                        Enter Marks
                                      </Button>

                                      {hasPermission('exams.manage') && (
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => deleteScheduleMutation.mutate(s.id)}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, textAlign: 'center', backgroundColor: '#fbfcfd' }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            No subject papers scheduled yet. Click "Add Paper Schedule" to configure exam dates.
                          </Typography>
                        </Paper>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: BATCH MARK ENTRY MATRIX                                 */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 1 && (
          <CardContent sx={{ p: 3 }}>
            {/* Filter Toolbar */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, backgroundColor: '#f8fafc' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Examination</InputLabel>
                    <Select
                      value={markExamId}
                      label="Select Examination"
                      onChange={(e) => setMarkExamId(e.target.value)}
                    >
                      {examinations.map((exam) => (
                        <MenuItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={markClassId}
                      label="Class"
                      onChange={(e) => {
                        setMarkClassId(e.target.value);
                        const selected = classes.find((c: any) => c.id === e.target.value);
                        if (selected?.sections?.length > 0) {
                          setMarkSectionId(selected.sections[0].id);
                        }
                      }}
                    >
                      {classes.map((c: any) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={2.5}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={markSectionId}
                      label="Section"
                      onChange={(e) => setMarkSectionId(e.target.value)}
                    >
                      {(classes.find((c: any) => c.id === markClassId)?.sections || []).map((sec: any) => (
                        <MenuItem key={sec.id} value={sec.id}>
                          Section {sec.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subject Paper Schedule</InputLabel>
                    <Select
                      value={markScheduleId}
                      label="Subject Paper Schedule"
                      onChange={(e) => setMarkScheduleId(e.target.value)}
                    >
                      {examSchedulesForClass.map((sched) => (
                        <MenuItem key={sched.id} value={sched.id}>
                          {sched.subject?.name} (Max: {sched.maxMarks} | {new Date(sched.examDate).toLocaleDateString()})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Mark Sheet Content */}
            {loadingSheet ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : !markSheet ? (
              <Alert severity="info">
                Please select an examination, class, section, and scheduled paper to open the mark entry grid.
              </Alert>
            ) : (
              <Box>
                {/* KPI Header Bar */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ENROLLED
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {markSheet.summary.totalStudents}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        MARKED
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {markSheet.summary.markedCount}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ABSENT
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="error.main">
                        {markSheet.summary.absentCount}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        CLASS AVERAGE
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="secondary.main">
                        {markSheet.summary.classAverage}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        HIGHEST MARK
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        {markSheet.summary.highestMark} / {markSheet.examSchedule.maxMarks}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        textAlign: 'center',
                        backgroundColor: markSheet.examSchedule.isLocked ? '#fff8e1' : '#f1f8e9'
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        LOCK STATUS
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
                        {markSheet.examSchedule.isLocked ? (
                          <Chip icon={<LockIcon />} label="LOCKED" color="warning" size="small" sx={{ fontWeight: 800 }} />
                        ) : (
                          <Chip icon={<LockOpenIcon />} label="OPEN" color="success" size="small" sx={{ fontWeight: 800 }} />
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Grid Action Toolbar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleQuickFillPassing}
                    disabled={markSheet.examSchedule.isLocked}
                    sx={{ borderRadius: 2 }}
                  >
                    Auto-Fill Minimum Passing Marks ({markSheet.examSchedule.passingMarks})
                  </Button>

                  <Stack direction="row" spacing={1.5}>
                    {hasPermission('marks.lock') && (
                      <Button
                        variant="outlined"
                        color={markSheet.examSchedule.isLocked ? 'success' : 'warning'}
                        startIcon={markSheet.examSchedule.isLocked ? <LockOpenIcon /> : <LockIcon />}
                        onClick={handleToggleLock}
                        disabled={lockMarksMutation.isPending}
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                      >
                        {markSheet.examSchedule.isLocked ? 'Unlock Paper' : 'Lock & Finalize'}
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveMarks}
                      disabled={markSheet.examSchedule.isLocked || saveMarksMutation.isPending}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 700,
                        px: 3,
                        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
                      }}
                    >
                      {saveMarksMutation.isPending ? 'Saving...' : 'Save Marks'}
                    </Button>
                  </Stack>
                </Box>

                {/* Marks Entry Table */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, width: 80 }}>Roll #</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Admission No</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 120 }}>
                          Absent?
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 140 }}>
                          Marks ({markSheet.examSchedule.maxMarks})
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>
                          Grade
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>
                          Status
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Teacher Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {markSheet.entries.map((student) => {
                        const local = markEntriesState[student.studentId] || {
                          marks: null,
                          isAbsent: false,
                          remarks: ''
                        };

                        const dynamic = getDynamicGrade(
                          local.marks,
                          local.isAbsent,
                          markSheet.examSchedule.maxMarks
                        );
                        const gradeStyle = getGradeColor(dynamic.grade);
                        const isFailing =
                          !local.isAbsent &&
                          local.marks !== null &&
                          local.marks < markSheet.examSchedule.passingMarks;

                        return (
                          <TableRow key={student.studentId} hover>
                            <TableCell sx={{ fontWeight: 700 }}>
                              #{student.rollNumber || '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              {student.studentName}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>
                              {student.admissionNumber}
                            </TableCell>
                            <TableCell align="center">
                              <Checkbox
                                checked={local.isAbsent}
                                disabled={markSheet.examSchedule.isLocked}
                                onChange={(e) => {
                                  setMarkEntriesState({
                                    ...markEntriesState,
                                    [student.studentId]: {
                                      ...local,
                                      isAbsent: e.target.checked,
                                      marks: e.target.checked ? null : local.marks
                                    }
                                  });
                                }}
                                color="error"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                disabled={local.isAbsent || markSheet.examSchedule.isLocked}
                                value={local.marks ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  setMarkEntriesState({
                                    ...markEntriesState,
                                    [student.studentId]: {
                                      ...local,
                                      marks: val
                                    }
                                  });
                                }}
                                inputProps={{
                                  min: 0,
                                  max: markSheet.examSchedule.maxMarks,
                                  style: { textAlign: 'center', fontWeight: 700 }
                                }}
                                sx={{
                                  width: 100,
                                  '& input': {
                                    color: isFailing ? 'error.main' : 'inherit'
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.25,
                                  borderRadius: 1,
                                  backgroundColor: gradeStyle.bg,
                                  color: gradeStyle.color,
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}
                              >
                                {dynamic.grade}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {dynamic.status === 'PASS' ? (
                                <Chip label="PASS" color="success" size="small" sx={{ fontWeight: 700, height: 22 }} />
                              ) : dynamic.status === 'FAIL' ? (
                                <Chip label="FAIL" color="error" size="small" sx={{ fontWeight: 700, height: 22 }} />
                              ) : dynamic.status === 'ABSENT' ? (
                                <Chip label="ABSENT" color="default" size="small" sx={{ fontWeight: 700, height: 22 }} />
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Pending
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                disabled={markSheet.examSchedule.isLocked}
                                placeholder="Add observations..."
                                value={local.remarks}
                                onChange={(e) => {
                                  setMarkEntriesState({
                                    ...markEntriesState,
                                    [student.studentId]: {
                                      ...local,
                                      remarks: e.target.value
                                    }
                                  });
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: REPORT CARDS & CLASS LEADERBOARD                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 2 && (
          <CardContent sx={{ p: 3 }}>
            {/* Filter Bar */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2.5, backgroundColor: '#f8fafc' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Examination</InputLabel>
                    <Select
                      value={reportExamId}
                      label="Select Examination"
                      onChange={(e) => setReportExamId(e.target.value)}
                    >
                      {examinations.map((exam) => (
                        <MenuItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class</InputLabel>
                    <Select
                      value={reportClassId}
                      label="Class"
                      onChange={(e) => {
                        setReportClassId(e.target.value);
                        const selected = classes.find((c: any) => c.id === e.target.value);
                        if (selected?.sections?.length > 0) {
                          setReportSectionId(selected.sections[0].id);
                        }
                      }}
                    >
                      {classes.map((c: any) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Section</InputLabel>
                    <Select
                      value={reportSectionId}
                      label="Section"
                      onChange={(e) => setReportSectionId(e.target.value)}
                    >
                      {(classes.find((c: any) => c.id === reportClassId)?.sections || []).map((sec: any) => (
                        <MenuItem key={sec.id} value={sec.id}>
                          Section {sec.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {loadingSummary ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : !classSummary ? (
              <Alert severity="info">
                Select an examination, class, and section to view student rankings and report cards.
              </Alert>
            ) : (
              <Box>
                {/* Performance KPI Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={2.4}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        APPEARED
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {classSummary.classStats.totalStudents}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2.4}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PASSED
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="success.main">
                        {classSummary.classStats.passedStudents}
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2.4}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PASS RATE
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {classSummary.classStats.passPercentage}%
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2.4}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        CLASS AVERAGE
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="secondary.main">
                        {classSummary.classStats.classAveragePercentage}%
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={2.4}>
                    <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        TOP SCORE
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="warning.main">
                        {classSummary.classStats.highestScorePercentage}%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Merit List Table */}
                <Typography variant="subtitle1" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                  Class Merit Ranking List
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 700, width: 80 }}>
                          Rank
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Roll #</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Admission No</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Total Scored
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Percentage
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Overall Grade
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Result
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          Report Card
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classSummary.students.map((student) => {
                        const gradeStyle = getGradeColor(student.overallGrade);
                        const isTopThree = student.classRank <= 3;

                        return (
                          <TableRow key={student.studentId} hover>
                            <TableCell align="center">
                              {student.classRank === 1 ? (
                                <Chip
                                  icon={<TrophyIcon sx={{ color: '#ffb300 !important' }} />}
                                  label="#1"
                                  size="small"
                                  sx={{ fontWeight: 800, backgroundColor: '#fff8e1', color: '#b78103' }}
                                />
                              ) : student.classRank === 2 ? (
                                <Chip
                                  icon={<TrophyIcon sx={{ color: '#90a4ae !important' }} />}
                                  label="#2"
                                  size="small"
                                  sx={{ fontWeight: 800, backgroundColor: '#eceff1', color: '#455a64' }}
                                />
                              ) : student.classRank === 3 ? (
                                <Chip
                                  icon={<TrophyIcon sx={{ color: '#bcaaa4 !important' }} />}
                                  label="#3"
                                  size="small"
                                  sx={{ fontWeight: 800, backgroundColor: '#efebe9', color: '#5d4037' }}
                                />
                              ) : (
                                <Typography variant="body2" fontWeight={600} color="text.secondary">
                                  #{student.classRank}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>
                              #{student.rollNumber || '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {student.studentName}
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary' }}>
                              {student.admissionNumber}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {student.totalMarksObtained} / {student.totalMaxMarks}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {student.percentage}%
                            </TableCell>
                            <TableCell align="center">
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  px: 1.5,
                                  py: 0.25,
                                  borderRadius: 1,
                                  backgroundColor: gradeStyle.bg,
                                  color: gradeStyle.color,
                                  fontWeight: 800,
                                  fontSize: '0.85rem'
                                }}
                              >
                                {student.overallGrade}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {student.status === 'PASSED' ? (
                                <Chip label="PASSED" color="success" size="small" sx={{ fontWeight: 700, height: 22 }} />
                              ) : (
                                <Chip label="FAILED" color="error" size="small" sx={{ fontWeight: 700, height: 22 }} />
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<ViewIcon />}
                                onClick={() => setSelectedStudentForReport(student.studentId)}
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)'
                                }}
                              >
                                View Report Card
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </CardContent>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: GRADING SCALES REFERENCE                                */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 3 && (
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
              School Grading System & Marks Thresholds
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The standard 7-point scale used across Rainbow English Medium Primary School to evaluate academic performance.
            </Typography>

            {gradingSystems.map((gs) => (
              <Box key={gs.id} sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {gs.name}
                  </Typography>
                  {gs.isDefault && (
                    <Chip label="DEFAULT SCALE" color="primary" size="small" sx={{ fontWeight: 700, height: 22 }} />
                  )}
                </Box>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Grade Letter</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Min Percentage (%)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Max Percentage (%)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Grade Point (GPA)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Performance Descriptor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gs.gradeScales?.map((scale) => {
                        const style = getGradeColor(scale.name);
                        return (
                          <TableRow key={scale.id} hover>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'inline-block',
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 1,
                                  backgroundColor: style.bg,
                                  color: style.color,
                                  fontWeight: 800,
                                  fontSize: '0.9rem'
                                }}
                              >
                                {scale.name}
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>{scale.minPercentage}%</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>{scale.maxPercentage}%</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: 'primary.main' }}>
                              {scale.gradePoint ? Number(scale.gradePoint).toFixed(1) : '-'}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>
                              {scale.remarks || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </CardContent>
        )}
      </Card>

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: CREATE EXAMINATION                                    */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={openCreateExamDialog}
        onClose={() => setOpenCreateExamDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Create New Examination Assessment
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Examination Title"
              fullWidth
              required
              placeholder="e.g. Term 2 Midterm Assessment 2026"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={examStartDate}
                  onChange={(e) => setExamStartDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={examEndDate}
                  onChange={(e) => setExamEndDate(e.target.value)}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              control={
                <Switch
                  checked={examPublished}
                  onChange={(e) => setExamPublished(e.target.checked)}
                  color="primary"
                />
              }
              label="Publish to Teachers & Students immediately"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenCreateExamDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!examName || createExamMutation.isPending}
            onClick={() => {
              createExamMutation.mutate({
                name: examName,
                academicYearId: examYearId,
                startDate: examStartDate,
                endDate: examEndDate,
                isPublished: examPublished
              });
            }}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {createExamMutation.isPending ? 'Creating...' : 'Create Exam'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* DIALOG: ADD PAPER SCHEDULE                                     */}
      {/* ------------------------------------------------------------- */}
      <Dialog
        open={openAddScheduleDialog}
        onClose={() => setOpenAddScheduleDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Add Paper Timetable Schedule
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Class</InputLabel>
              <Select
                value={schedClassId}
                label="Select Class"
                onChange={(e) => setSchedClassId(e.target.value)}
              >
                {classes.map((c: any) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Select Subject</InputLabel>
              <Select
                value={schedSubjectId}
                label="Select Subject"
                onChange={(e) => setSchedSubjectId(e.target.value)}
              >
                {subjects.map((s: any) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Exam Date"
              type="date"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={schedDate}
              onChange={(e) => setSchedDate(e.target.value)}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  fullWidth
                  size="small"
                  placeholder="09:30 AM"
                  value={schedStartTime}
                  onChange={(e) => setSchedStartTime(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  fullWidth
                  size="small"
                  placeholder="11:30 AM"
                  value={schedEndTime}
                  onChange={(e) => setSchedEndTime(e.target.value)}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Maximum Marks"
                  type="number"
                  fullWidth
                  size="small"
                  value={schedMaxMarks}
                  onChange={(e) => setSchedMaxMarks(Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Passing Marks"
                  type="number"
                  fullWidth
                  size="small"
                  value={schedPassingMarks}
                  onChange={(e) => setSchedPassingMarks(Number(e.target.value))}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpenAddScheduleDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!schedClassId || !schedSubjectId || createScheduleMutation.isPending}
            onClick={() => {
              createScheduleMutation.mutate({
                examId: selectedExamForSchedule,
                payload: {
                  classId: schedClassId,
                  subjectId: schedSubjectId,
                  examDate: schedDate,
                  startTime: schedStartTime,
                  endTime: schedEndTime,
                  maxMarks: schedMaxMarks,
                  passingMarks: schedPassingMarks
                }
              });
            }}
            sx={{ borderRadius: 2, fontWeight: 700, px: 3 }}
          >
            {createScheduleMutation.isPending ? 'Adding...' : 'Add Schedule'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------- */}
      {/* REPORT CARD PRINT MODAL                                        */}
      {/* ------------------------------------------------------------- */}
      {selectedStudentForReport && (
        <ReportCardModal
          open={Boolean(selectedStudentForReport)}
          onClose={() => setSelectedStudentForReport(null)}
          examinationId={reportExamId}
          studentId={selectedStudentForReport}
        />
      )}
    </Box>
  );
};
