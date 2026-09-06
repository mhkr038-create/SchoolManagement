import React, { useState } from 'react';
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
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  MenuBook as SubjectIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';

export const AcademicsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const [tabIndex, setTabIndex] = useState(0);

  // Dialog States
  const [openClassModal, setOpenClassModal] = useState(false);
  const [openSectionModal, setOpenSectionModal] = useState(false);
  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Class Form
  const [className, setClassName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [classOrder, setClassOrder] = useState(1);

  // Section Form
  const [sectionName, setSectionName] = useState('A');
  const [sectionCapacity, setSectionCapacity] = useState(40);

  // Subject Form
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectType, setSubjectType] = useState('THEORY');

  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: classesResponse, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const res: any = await apiClient.get('/academics/classes');
      return res.data || res;
    }
  });

  const { data: subjectsResponse, isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res: any = await apiClient.get('/academics/subjects');
      return res.data || res;
    }
  });

  const { data: yearsResponse } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const res: any = await apiClient.get('/academics/years');
      return res.data || res;
    }
  });

  const classes = Array.isArray(classesResponse) ? classesResponse : [];
  const subjects = Array.isArray(subjectsResponse) ? subjectsResponse : [];
  const years = Array.isArray(yearsResponse) ? yearsResponse : [];

  // Mutations
  const createClassMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/academics/classes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setOpenClassModal(false);
      setClassName('');
      setClassCode('');
      setFormError(null);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create class')
  });

  const createSectionMutation = useMutation({
    mutationFn: ({ classId, data }: any) => apiClient.post(`/academics/classes/${classId}/sections`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setOpenSectionModal(false);
      setSectionName('');
      setFormError(null);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create section')
  });

  const createSubjectMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/academics/subjects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setOpenSubjectModal(false);
      setSubjectName('');
      setSubjectCode('');
      setFormError(null);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create subject')
  });

  const handleOpenAddSection = (classId: string) => {
    setSelectedClassId(classId);
    setSectionName('');
    setSectionCapacity(40);
    setFormError(null);
    setOpenSectionModal(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Academics & Curriculum Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage primary classes, sections, syllabus curriculum, and academic calendar
          </Typography>
        </Box>
        {hasPermission('academics.manage') && (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {tabIndex === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { setFormError(null); setOpenClassModal(true); }}
              >
                Add Class
              </Button>
            )}
            {tabIndex === 1 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { setFormError(null); setOpenSubjectModal(true); }}
              >
                Add Subject
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, newTab) => setTabIndex(newTab)}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}
        >
          <Tab icon={<SchoolIcon />} iconPosition="start" label="Classes & Sections" />
          <Tab icon={<SubjectIcon />} iconPosition="start" label="Curriculum & Subjects" />
          <Tab icon={<CalendarIcon />} iconPosition="start" label="Academic Calendar" />
        </Tabs>

        {/* TAB 0: Classes & Sections */}
        {tabIndex === 0 && (
          <Box sx={{ p: 3 }}>
            {loadingClasses ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
            ) : classes.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>No classes configured yet.</Typography>
            ) : (
              <Grid container spacing={2.5}>
                {classes.map((cls: any) => (
                  <Grid item xs={12} sm={6} md={4} key={cls.id}>
                    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {cls.name}
                          </Typography>
                          <Chip label={cls.code || `CLS-${cls.displayOrder}`} size="small" variant="outlined" />
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                          Total Enrolled: <strong>{cls._count?.studentEnrollments || 0} students</strong>
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Sections ({cls.sections?.length || 0}):
                          </Typography>
                          {hasPermission('academics.manage') && (
                            <Button size="small" onClick={() => handleOpenAddSection(cls.id)}>
                              + Section
                            </Button>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {cls.sections?.map((sec: any) => (
                            <Chip
                              key={sec.id}
                              label={`Sec ${sec.name} (${sec._count?.studentEnrollments || 0}/${sec.capacity})`}
                              color="primary"
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 1: Subjects */}
        {tabIndex === 1 && (
          <Box sx={{ p: 3 }}>
            {loadingSubjects ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
            ) : subjects.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>No subjects configured yet.</Typography>
            ) : (
              <Grid container spacing={2}>
                {subjects.map((sub: any) => (
                  <Grid item xs={12} sm={6} md={4} key={sub.id}>
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 2,
                            bgcolor: '#eff6ff',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <SubjectIcon />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {sub.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Code: <strong>{sub.code}</strong>
                          </Typography>
                        </Box>
                        <Chip
                          label={sub.type}
                          size="small"
                          color={sub.type === 'THEORY' ? 'primary' : sub.type === 'PRACTICAL' ? 'secondary' : 'default'}
                          variant="outlined"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 2: Academic Calendar */}
        {tabIndex === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              {years.map((y: any) => (
                <Grid item xs={12} md={6} key={y.id}>
                  <Card sx={{ borderRadius: 3, border: y.isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" fontWeight={700}>
                          {y.name}
                        </Typography>
                        {y.isCurrent && <Chip label="CURRENT ACTIVE YEAR" color="primary" size="small" sx={{ fontWeight: 700 }} />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Start Date: <strong>{new Date(y.startDate).toLocaleDateString()}</strong> | End Date: <strong>{new Date(y.endDate).toLocaleDateString()}</strong>
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Add Class Dialog */}
      <Dialog open={openClassModal} onClose={() => setOpenClassModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Class</DialogTitle>
        <Box component="form" onSubmit={(e) => {
          e.preventDefault();
          createClassMutation.mutate({ name: className, code: classCode, displayOrder: classOrder });
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Class Name (e.g. Class 6, UKG)"
              size="small"
              required
              fullWidth
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
            <TextField
              label="Class Code (e.g. CLS-6)"
              size="small"
              fullWidth
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
            />
            <TextField
              label="Display Order"
              type="number"
              size="small"
              fullWidth
              value={classOrder}
              onChange={(e) => setClassOrder(Number(e.target.value))}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenClassModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createClassMutation.isPending}>
              {createClassMutation.isPending ? <CircularProgress size={24} /> : 'Save Class'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={openSectionModal} onClose={() => setOpenSectionModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Section to Class</DialogTitle>
        <Box component="form" onSubmit={(e) => {
          e.preventDefault();
          createSectionMutation.mutate({
            classId: selectedClassId,
            data: { name: sectionName, capacity: sectionCapacity }
          });
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Section Name (e.g. A, B, C)"
              size="small"
              required
              fullWidth
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
            />
            <TextField
              label="Max Capacity"
              type="number"
              size="small"
              fullWidth
              value={sectionCapacity}
              onChange={(e) => setSectionCapacity(Number(e.target.value))}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenSectionModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createSectionMutation.isPending}>
              {createSectionMutation.isPending ? <CircularProgress size={24} /> : 'Save Section'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Add Subject Dialog */}
      <Dialog open={openSubjectModal} onClose={() => setOpenSubjectModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Subject</DialogTitle>
        <Box component="form" onSubmit={(e) => {
          e.preventDefault();
          createSubjectMutation.mutate({ name: subjectName, code: subjectCode, type: subjectType });
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Subject Name (e.g. Science)"
              size="small"
              required
              fullWidth
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
            />
            <TextField
              label="Subject Code (e.g. SCI-PRI)"
              size="small"
              required
              fullWidth
              value={subjectCode}
              onChange={(e) => setSubjectCode(e.target.value)}
            />
            <FormControl size="small" fullWidth required>
              <InputLabel>Subject Type</InputLabel>
              <Select
                value={subjectType}
                label="Subject Type"
                onChange={(e) => setSubjectType(e.target.value)}
              >
                <MenuItem value="THEORY">Theory</MenuItem>
                <MenuItem value="PRACTICAL">Practical / Lab</MenuItem>
                <MenuItem value="ACTIVITY">Activity / Co-curricular</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenSubjectModal(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createSubjectMutation.isPending}>
              {createSubjectMutation.isPending ? <CircularProgress size={24} /> : 'Save Subject'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
