import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  LinearProgress,
  Stack,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as GradedIcon,
  HourglassEmpty as PendingIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  CalendarToday as CalendarIcon,
  Person as TeacherIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { CreateAssignmentModal } from './components/CreateAssignmentModal';
import { SubmissionsReviewModal } from './components/SubmissionsReviewModal';
import type { Assignment, AssignmentStats } from '@school/types';

export const AssignmentsPage: React.FC = () => {
  const { user, school, availableSchools } = useAuthStore();
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
  const queryClient = useQueryClient();

  const [selectedBranch, setSelectedBranch] = useState<string>(
    isSuperAdmin ? 'ALL' : (school?.id || '')
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');

  // Modals state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [reviewingAssignmentId, setReviewingAssignmentId] = useState<string | null>(null);

  // 1. Stats
  const { data: stats, refetch: refetchStats } = useQuery<AssignmentStats>({
    queryKey: ['assignment-stats', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/assignments/stats', {
        params: { schoolId: selectedBranch }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 2. Classes
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['academics-classes', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes', {
        params: { schoolId: selectedBranch !== 'ALL' ? selectedBranch : undefined }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 3. Subjects
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['academics-subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 4. Assignments List
  const { data: assignmentsData, isLoading: loadingAssignments, refetch: refetchAssignments } = useQuery({
    queryKey: ['assignments-list', selectedBranch, selectedClassId, selectedSubjectId, searchQuery],
    queryFn: async () => {
      const res = await apiClient.get('/assignments', {
        params: {
          schoolId: selectedBranch,
          classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
          subjectId: selectedSubjectId !== 'ALL' ? selectedSubjectId : undefined,
          search: searchQuery.trim() || undefined
        }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  const assignments: Assignment[] = assignmentsData?.items || [];

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete assignment "${title}"?`)) return;
    try {
      await apiClient.delete(`/assignments/${id}`);
      refetchAssignments();
      refetchStats();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchAssignments();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Assignments & Homework
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Assign class homework, track student completion rates, and review submissions with feedback
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSuperAdmin && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Campus / Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Campus / Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="ALL">
                  <em>All Campuses (Consolidated)</em>
                </MenuItem>
                {(availableSchools || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateModal(true)}
            sx={{ fontWeight: 700 }}
          >
            Create Assignment
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="primary" textTransform="uppercase">
                  Active Homework
                </Typography>
                <AssignmentIcon color="primary" />
              </Box>
              <Typography variant="h5" fontWeight={800} color="text.primary">
                {stats?.activeAssignments || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ongoing & open for submission
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fff7ed', border: '1px solid #fed7aa' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="warning.main" textTransform="uppercase">
                  Awaiting Grading
                </Typography>
                <PendingIcon color="warning" />
              </Box>
              <Typography variant="h5" fontWeight={800} color="warning.main">
                {stats?.pendingGrading || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Submissions needing review
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="success.main" textTransform="uppercase">
                  Graded Submissions
                </Typography>
                <GradedIcon color="success" />
              </Box>
              <Typography variant="h5" fontWeight={800} color="success.main">
                {stats?.gradedThisWeek || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Evaluated with marks & feedback
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="secondary" textTransform="uppercase">
                  Average Score
                </Typography>
                <TrendingUpIcon color="secondary" />
              </Box>
              <Typography variant="h5" fontWeight={800} color="secondary">
                {stats?.averageClassScore || 0}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Overall class performance
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by assignment title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Class</InputLabel>
              <Select
                value={selectedClassId}
                label="Filter by Class"
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <MenuItem value="ALL">All Classes</MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Subject</InputLabel>
              <Select
                value={selectedSubjectId}
                label="Filter by Subject"
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <MenuItem value="ALL">All Subjects</MenuItem>
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Assignments Grid */}
      <Grid container spacing={3}>
        {loadingAssignments ? (
          <Grid item xs={12} sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress />
          </Grid>
        ) : assignments.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                No homework assignments found matching the current filters.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setOpenCreateModal(true)}
                sx={{ mt: 2 }}
              >
                Create Your First Assignment
              </Button>
            </Paper>
          </Grid>
        ) : (
          assignments.map((ass) => {
            const total = ass.stats?.totalStudents || 0;
            const submitted = ass.stats?.submittedCount || 0;
            const graded = ass.stats?.gradedCount || 0;
            const pct = total > 0 ? (submitted / total) * 100 : 0;

            return (
              <Grid item xs={12} md={6} lg={4} key={ass.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    '&:hover': { borderColor: 'primary.main', boxShadow: 2 }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={ass.subject?.name || 'Subject'}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 700 }}
                        />
                        <Chip
                          label={`${ass.class?.name || 'Class'} (${ass.section?.name || 'A'})`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(ass.id, ass.title)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 1, minHeight: 48 }}>
                      {ass.title}
                    </Typography>

                    {ass.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {ass.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" fontWeight={600}>
                        Due: {ass.dueDate}
                      </Typography>
                      <Typography variant="caption">•</Typography>
                      <Typography variant="caption" fontWeight={600}>
                        Max Marks: {ass.maxMarks || 20}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 2 }}>
                      <TeacherIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption">
                        Assigned by: {ass.teacher?.firstName} {ass.teacher?.lastName}
                      </Typography>
                    </Box>

                    {/* Progress */}
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700}>
                          Submissions: {submitted} / {total}
                        </Typography>
                        <Typography variant="caption" color="success.main" fontWeight={700}>
                          {graded} Graded
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => setReviewingAssignmentId(ass.id)}
                      sx={{ fontWeight: 700 }}
                    >
                      Review & Grade Submissions
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      {/* Modals */}
      <CreateAssignmentModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        classes={classes}
        subjects={subjects}
        onSuccess={() => {
          refetchAssignments();
          refetchStats();
        }}
      />

      <SubmissionsReviewModal
        open={!!reviewingAssignmentId}
        onClose={() => setReviewingAssignmentId(null)}
        assignmentId={reviewingAssignmentId || ''}
        onSuccess={() => {
          refetchAssignments();
          refetchStats();
        }}
      />
    </Box>
  );
};