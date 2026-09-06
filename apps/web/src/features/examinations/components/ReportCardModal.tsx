import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api/apiClient';
import type { ReportCardResponse } from '@school/types';

interface ReportCardModalProps {
  open: boolean;
  onClose: () => void;
  examinationId: string;
  studentId: string;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({
  open,
  onClose,
  examinationId,
  studentId
}) => {
  const { data, isLoading, error } = useQuery<ReportCardResponse>({
    queryKey: ['report-card', examinationId, studentId],
    queryFn: async () => {
      const res = await apiClient.get(
        `/examinations/${examinationId}/report-card/${studentId}`
      );
      return res.data.data;
    },
    enabled: open && Boolean(examinationId) && Boolean(studentId)
  });

  const handlePrint = () => {
    window.print();
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' };
      case 'B':
      case 'C':
        return { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' };
      case 'D':
      case 'E':
        return { bg: '#fff8e1', color: '#f57f17', border: '#ffe082' };
      default:
        return { bg: '#ffebee', color: '#c62828', border: '#ef9a9a' };
    }
  };

  const getResultColor = (result: string) => {
    if (result === 'DISTINCTION' || result === 'FIRST CLASS') return 'success';
    if (result === 'SECOND CLASS' || result === 'PASS') return 'primary';
    return 'error';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0,
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{ p: { xs: 2, sm: 4 } }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            Failed to load student report card. Please try again.
          </Alert>
        )}

        {data && (
          <Box id="printable-report-card">
            <style>
              {`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-report-card, #printable-report-card * {
                    visibility: visible;
                  }
                  #printable-report-card {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 20px;
                    margin: 0;
                    background: #fff !important;
                    color: #000 !important;
                    box-shadow: none !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}
            </style>

            {/* School Letterhead */}
            <Box
              sx={{
                textAlign: 'center',
                pb: 2.5,
                mb: 2.5,
                borderBottom: '2px solid #1a237e'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <SchoolIcon sx={{ color: '#1a237e', fontSize: 38 }} />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#1a237e',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase'
                  }}
                >
                  {data.school.name}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {data.school.address || 'Recognized Primary Educational Institution'}
                {data.school.phone && ` | Tel: ${data.school.phone}`}
                {data.school.email && ` | Email: ${data.school.email}`}
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  mt: 1.5,
                  px: 3,
                  py: 0.5,
                  borderRadius: 5,
                  backgroundColor: '#1a237e',
                  color: '#ffffff'
                }}
              >
                <Typography variant="subtitle2" fontWeight={700} sx={{ letterSpacing: 1 }}>
                  STUDENT OFFICIAL REPORT CARD — {data.examination.name.toUpperCase()}
                </Typography>
              </Box>
            </Box>

            {/* Student Credentials Grid */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                mb: 3,
                backgroundColor: '#f8fafd',
                borderColor: '#cfd8dc',
                borderRadius: 2
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ width: 140, color: 'text.secondary' }}>
                      Student Name:
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {data.student.fullName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ width: 140, color: 'text.secondary' }}>
                      Admission No:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {data.student.admissionNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ width: 140, color: 'text.secondary' }}>
                      Roll Number:
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      #{data.student.rollNumber || 'N/A'}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ width: 140, color: 'text.secondary' }}>
                      Class & Section:
                    </Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {data.student.className} — Section {data.student.sectionName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ width: 140, color: 'text.secondary' }}>
                      Academic Year:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {data.student.academicYear}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <Typography variant="body2" fontWeight={600} sx={{ width: 140, color: 'text.secondary' }}>
                      Class Standing:
                    </Typography>
                    <Chip
                      icon={<TrophyIcon sx={{ fontSize: '1rem !important' }} />}
                      label={`Rank ${data.summary.classRank} of ${data.summary.totalStudentsInClass}`}
                      size="small"
                      color="warning"
                      sx={{ fontWeight: 700, height: 24 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Subject Performance Breakdown Table */}
            <Typography variant="subtitle1" fontWeight={700} color="#1a237e" sx={{ mb: 1.5 }}>
              Academic Performance Breakdown
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Code</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Max Marks</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Pass Marks</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Marks Scored</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Percentage</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Grade</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.subjects.map((s) => {
                    const gradeStyle = getGradeColor(s.grade);
                    return (
                      <TableRow key={s.subjectId} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{s.subjectName}</TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary' }}>
                          {s.subjectCode}
                        </TableCell>
                        <TableCell align="center">{s.maxMarks}</TableCell>
                        <TableCell align="center">{s.passingMarks}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>
                          {s.isAbsent ? (
                            <Typography variant="caption" color="error.main" fontWeight={700}>
                              ABSENT
                            </Typography>
                          ) : (
                            s.marksObtained ?? '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {s.isAbsent ? '0%' : `${s.percentage}%`}
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
                              border: `1px solid ${gradeStyle.border}`,
                              fontWeight: 700,
                              fontSize: '0.8rem'
                            }}
                          >
                            {s.grade}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {s.status === 'PASS' ? (
                            <Chip
                              icon={<PassIcon sx={{ fontSize: '1rem !important' }} />}
                              label="PASS"
                              color="success"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          ) : (
                            <Chip
                              icon={<FailIcon sx={{ fontSize: '1rem !important' }} />}
                              label={s.status}
                              color="error"
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 22 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Performance Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fafbfc' }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL MARKS
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    {data.summary.totalObtainedMarks} / {data.summary.totalMaxMarks}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fafbfc' }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    AGGREGATE %
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="secondary.main">
                    {data.summary.aggregatePercentage}%
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fafbfc' }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    OVERALL GRADE
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="success.main">
                    {data.summary.overallGrade}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={3}>
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#fafbfc' }}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    FINAL RESULT
                  </Typography>
                  <Chip
                    label={data.summary.overallResult}
                    color={getResultColor(data.summary.overallResult)}
                    size="small"
                    sx={{ fontWeight: 800, mt: 0.5 }}
                  />
                </Paper>
              </Grid>
            </Grid>

            {/* Attendance & Behavioral Remarks */}
            <Box
              sx={{
                p: 2,
                mb: 4,
                borderLeft: '4px solid #1a237e',
                backgroundColor: '#f5f7fa',
                borderRadius: 1
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.primary">
                Attendance Standing: <strong>{data.summary.attendancePercentage || 95}%</strong> recorded presence during the academic term.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Teacher Remarks: Demonstrated exemplary dedication, strong analytical aptitude, and respectful conduct. Promoted to next curriculum milestone.
              </Typography>
            </Box>

            {/* Signature Blocks */}
            <Box sx={{ pt: 4, mt: 2 }}>
              <Grid container spacing={4} sx={{ textAlign: 'center' }}>
                <Grid item xs={4}>
                  <Divider sx={{ mb: 1, borderColor: '#90a4ae' }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    CLASS TEACHER
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Divider sx={{ mb: 1, borderColor: '#90a4ae' }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    EXAM CONTROLLER
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Divider sx={{ mb: 1, borderColor: '#90a4ae' }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    PRINCIPAL & SCHOOL SEAL
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f8fafc', borderTop: '1px solid #e0e0e0' }} className="no-print">
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          startIcon={<PrintIcon />}
          sx={{
            px: 3,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)'
          }}
        >
          Print / Save as PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};
