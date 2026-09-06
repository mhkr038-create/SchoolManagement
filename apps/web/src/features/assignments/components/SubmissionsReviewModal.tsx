import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
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
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Stack
} from '@mui/material';
import {
  Close as CloseIcon,
  AssignmentTurnedIn as GradeIcon,
  CheckCircle as GradedIcon,
  HourglassEmpty as PendingIcon,
  Send as SubmitIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { Assignment } from '@school/types';

interface SubmissionsReviewModalProps {
  open: boolean;
  onClose: () => void;
  assignmentId: string;
  onSuccess: () => void;
}

export const SubmissionsReviewModal: React.FC<SubmissionsReviewModalProps> = ({
  open,
  onClose,
  assignmentId,
  onSuccess
}) => {
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline grading state map: submissionId -> { marks, feedback }
  const [gradingState, setGradingState] = useState<Record<string, { marks: number | string; feedback: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/assignments/${assignmentId}`);
      const data = res.data?.data !== undefined ? res.data.data : (res.data || res);
      setAssignment(data);

      // Pre-fill grading state
      const initial: Record<string, { marks: number | string; feedback: string }> = {};
      (data.roster || []).forEach((row: any) => {
        if (row.id && !row.id.startsWith('pending-')) {
          initial[row.id] = {
            marks: row.marksAwarded ?? '',
            feedback: row.feedback || ''
          };
        }
      });
      setGradingState(initial);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open && assignmentId) {
      fetchDetails();
    }
  }, [open, assignmentId]);

  const handleSaveGrade = async (submissionId: string) => {
    const entry = gradingState[submissionId];
    if (!entry || entry.marks === '') {
      alert('Please enter a mark before saving');
      return;
    }

    setSavingId(submissionId);
    try {
      await apiClient.post(`/assignments/submissions/${submissionId}/grade`, {
        marksAwarded: Number(entry.marks),
        feedback: entry.feedback?.trim() || undefined
      });
      await fetchDetails();
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save grade');
    } finally {
      setSavingId(null);
    }
  };

  const handleMockSubmit = async (studentId: string) => {
    try {
      await apiClient.post(`/assignments/submit?studentId=${studentId}`, {
        assignmentId,
        submissionText: 'Completed homework exercises and attached diagram sketches.'
      });
      await fetchDetails();
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Submission failed');
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="primary">
            Submissions & Grading Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {assignment?.title} ({assignment?.class?.name} - {assignment?.section?.name}) | Max Marks: {assignment?.maxMarks || 20}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Progress metrics */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8fafc' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, textAlign: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Enrolled Students</Typography>
                  <Typography variant="h6" fontWeight={700}>{assignment?.stats?.totalStudents || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Submitted</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">{assignment?.stats?.submittedCount || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Graded</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">{assignment?.stats?.gradedCount || 0}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Pending</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">{assignment?.stats?.pendingCount || 0}</Typography>
                </Box>
              </Box>
            </Paper>

            {/* Submissions Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Submission</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 120 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Feedback</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: 100 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(assignment?.roster || []).map((row: any) => {
                    const isPending = row.status === 'PENDING';
                    const isSaving = savingId === row.id;

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {row.student?.firstName} {row.student?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Adm: {row.student?.admissionNumber}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            color={
                              row.status === 'GRADED'
                                ? 'success'
                                : row.status === 'SUBMITTED'
                                ? 'primary'
                                : row.status === 'LATE'
                                ? 'warning'
                                : 'default'
                            }
                            sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                          />
                        </TableCell>

                        <TableCell>
                          {row.submissionText ? (
                            <Typography variant="caption" color="text.primary">
                              {row.submissionText}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              — No submission yet —
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {!isPending ? (
                            <TextField
                              size="small"
                              type="number"
                              placeholder={`0 - ${assignment?.maxMarks}`}
                              value={gradingState[row.id]?.marks ?? ''}
                              onChange={(e) => {
                                setGradingState({
                                  ...gradingState,
                                  [row.id]: {
                                    ...gradingState[row.id],
                                    marks: e.target.value
                                  }
                                });
                              }}
                              inputProps={{ min: 0, max: assignment?.maxMarks || 100 }}
                              sx={{ width: 90 }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          {!isPending ? (
                            <TextField
                              size="small"
                              placeholder="Remarks..."
                              value={gradingState[row.id]?.feedback ?? ''}
                              onChange={(e) => {
                                setGradingState({
                                  ...gradingState,
                                  [row.id]: {
                                    ...gradingState[row.id],
                                    feedback: e.target.value
                                  }
                                });
                              }}
                              fullWidth
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>

                        <TableCell align="center">
                          {!isPending ? (
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disabled={isSaving}
                              onClick={() => handleSaveGrade(row.id)}
                              sx={{ textTransform: 'none', py: 0.5, fontWeight: 700, minWidth: 64 }}
                            >
                              {isSaving ? '...' : row.status === 'GRADED' ? 'Update' : 'Grade'}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<SubmitIcon />}
                              onClick={() => handleMockSubmit(row.studentId)}
                              sx={{ textTransform: 'none', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                            >
                              Submit
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};