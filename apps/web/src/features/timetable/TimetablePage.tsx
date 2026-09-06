import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Stack,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  MeetingRoom as RoomIcon,
  Person as TeacherIcon,
  Print as PrintIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { ManageRoomsModal } from './components/ManageRoomsModal';
import { AddTimetableSlotModal } from './components/AddTimetableSlotModal';
import type { Room, TimetableEntry } from '@school/types';

const DAYS = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' }
];

export const TimetablePage: React.FC = () => {
  const { user, school, availableSchools } = useAuthStore();
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
  const queryClient = useQueryClient();

  const [selectedBranch, setSelectedBranch] = useState<string>(
    isSuperAdmin ? 'ALL' : (school?.id || '')
  );

  const [viewMode, setViewMode] = useState<'CLASS' | 'TEACHER'>('CLASS');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Modals state
  const [openRoomsModal, setOpenRoomsModal] = useState(false);
  const [openAddSlotModal, setOpenAddSlotModal] = useState(false);
  const [slotDay, setSlotDay] = useState<number>(1);

  // 1. Fetch Academic Years
  const { data: academicYears = [] } = useQuery<any[]>({
    queryKey: ['academics-years'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/years');
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });
  const currentYear = academicYears.find((y) => y.isCurrent) || academicYears[0];

  // 2. Fetch Classes with Sections
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['academics-classes', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes', {
        params: { schoolId: selectedBranch !== 'ALL' ? selectedBranch : undefined }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // Auto-select initial class and section
  React.useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
      if (classes[0].sections?.length > 0) {
        setSelectedSectionId(classes[0].sections[0].id);
      }
    }
  }, [classes]);

  // Update section when class changes
  const activeClass = classes.find((c) => c.id === selectedClassId);
  const sections = activeClass?.sections || [];
  React.useEffect(() => {
    if (sections.length > 0 && !sections.some((s: any) => s.id === selectedSectionId)) {
      setSelectedSectionId(sections[0].id);
    }
  }, [selectedClassId, sections]);

  // 3. Fetch Subjects
  const { data: subjects = [] } = useQuery<any[]>({
    queryKey: ['academics-subjects'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/subjects');
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 4. Fetch Users (Teachers)
  const { data: usersData = [] } = useQuery<any[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data?.data?.users || res.data?.users || res.data?.data || res.data || [];
    }
  });
  const teachers = usersData.filter(
    (u: any) => u.userType === 'TEACHER' || u.userType === 'STAFF' || u.roles?.some((r: any) => r.name === 'Teacher')
  );

  React.useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers]);

  // 5. Fetch Rooms
  const { data: rooms = [], isLoading: loadingRooms, refetch: refetchRooms } = useQuery<Room[]>({
    queryKey: ['timetable-rooms', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/timetable/rooms', {
        params: { schoolId: selectedBranch }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 6. Fetch Timetable Entries (Class vs Teacher)
  const {
    data: timetableEntries = [],
    isLoading: loadingTimetable,
    refetch: refetchTimetable
  } = useQuery<TimetableEntry[]>({
    queryKey: [
      'timetable-schedule',
      viewMode,
      selectedSectionId,
      selectedTeacherId,
      currentYear?.id
    ],
    enabled: viewMode === 'CLASS' ? !!selectedSectionId : !!selectedTeacherId,
    queryFn: async () => {
      const url =
        viewMode === 'CLASS'
          ? `/timetable/section/${selectedSectionId}`
          : `/timetable/teacher/${selectedTeacherId}`;
      const res = await apiClient.get(url, {
        params: { academicYearId: currentYear?.id }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  const handleDeleteSlot = async (entryId: string) => {
    if (!confirm('Delete this timetable slot?')) return;
    try {
      await apiClient.delete(`/timetable/entries/${entryId}`);
      refetchTimetable();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete period');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Class Timetable & Scheduling
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Weekly class matrices, teacher workloads, room allocations, and clash prevention
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
            variant="outlined"
            startIcon={<RoomIcon />}
            onClick={() => setOpenRoomsModal(true)}
          >
            Rooms ({rooms.length})
          </Button>

          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Print
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetchTimetable()}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Control Bar: Mode Toggle + Dropdowns */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <ButtonGroup fullWidth variant="outlined">
              <Button
                variant={viewMode === 'CLASS' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('CLASS')}
                startIcon={<ScheduleIcon />}
                sx={{ fontWeight: 700 }}
              >
                Class Schedule
              </Button>
              <Button
                variant={viewMode === 'TEACHER' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('TEACHER')}
                startIcon={<TeacherIcon />}
                sx={{ fontWeight: 700 }}
              >
                Teacher Schedule
              </Button>
            </ButtonGroup>
          </Grid>

          {viewMode === 'CLASS' ? (
            <>
              <Grid item xs={6} md={3}>
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

              <Grid item xs={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select
                    value={selectedSectionId}
                    label="Section"
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                  >
                    {sections.map((s: any) => (
                      <MenuItem key={s.id} value={s.id}>
                        Section {s.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<AddIcon />}
                  disabled={!selectedSectionId}
                  onClick={() => {
                    setSlotDay(1);
                    setOpenAddSlotModal(true);
                  }}
                  sx={{ fontWeight: 700 }}
                >
                  Assign Period
                </Button>
              </Grid>
            </>
          ) : (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Teacher</InputLabel>
                <Select
                  value={selectedTeacherId}
                  label="Select Teacher"
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                >
                  {teachers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} {t.email ? `(${t.email})` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Printable Classroom Header */}
      <Box sx={{ display: 'none', '@media print': { display: 'block', mb: 3 } }}>
        <Typography variant="h5" fontWeight={800} align="center">
          {school?.name || 'School ERP'} - Weekly Timetable
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary">
          {viewMode === 'CLASS'
            ? `${activeClass?.name || ''} - Section ${sections.find((s: any) => s.id === selectedSectionId)?.name || ''}`
            : `Teacher: ${teachers.find((t) => t.id === selectedTeacherId)?.firstName} ${teachers.find((t) => t.id === selectedTeacherId)?.lastName}`}
        </Typography>
        <Divider sx={{ my: 1.5 }} />
      </Box>

      {/* 6-Day Weekly Matrix (Monday to Saturday) */}
      <Grid container spacing={2}>
        {DAYS.map(({ day, name }) => {
          const dayEntries = timetableEntries
            .filter((e) => e.dayOfWeek === day)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <Grid item xs={12} md={4} lg={2} key={day}>
              <Paper
                sx={{
                  p: 1.5,
                  height: '100%',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Day Header */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                    pb: 1,
                    borderBottom: '2px solid #e2e8f0'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} color="primary">
                    {name}
                  </Typography>
                  <Chip
                    label={`${dayEntries.length} slot${dayEntries.length === 1 ? '' : 's'}`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                  />
                </Box>

                {/* Slots List */}
                <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
                  {loadingTimetable ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : dayEntries.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        No periods scheduled
                      </Typography>
                    </Box>
                  ) : (
                    dayEntries.map((entry) => (
                      <Card
                        key={entry.id}
                        variant="outlined"
                        sx={{
                          bgcolor: '#f8fafc',
                          borderColor: '#cbd5e1',
                          '&:hover': { borderColor: 'primary.main', bgcolor: '#f1f5f9' },
                          position: 'relative'
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Chip
                              label={`${entry.startTime} - ${entry.endTime}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.7rem', height: 22, mb: 0.5 }}
                            />
                            {viewMode === 'CLASS' && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteSlot(entry.id)}
                                sx={{ p: 0.25, mt: -0.5, mr: -0.5 }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>

                          <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                            {entry.subject?.name || 'Subject'}
                          </Typography>

                          {viewMode === 'CLASS' ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <TeacherIcon sx={{ fontSize: 14 }} />
                              {entry.teacher?.firstName} {entry.teacher?.lastName}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <SchoolIcon sx={{ fontSize: 14 }} />
                              {entry.class?.name} ({entry.section?.name})
                            </Typography>
                          )}

                          {entry.room && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <RoomIcon sx={{ fontSize: 14 }} />
                              {entry.room.name}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Stack>

                {/* Quick Add Slot for this Day */}
                {viewMode === 'CLASS' && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSlotDay(day);
                      setOpenAddSlotModal(true);
                    }}
                    sx={{ mt: 1.5, textTransform: 'none', py: 0.5, fontSize: '0.75rem' }}
                    fullWidth
                  >
                    Add Period
                  </Button>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Modals */}
      <ManageRoomsModal
        open={openRoomsModal}
        onClose={() => setOpenRoomsModal(false)}
        rooms={rooms}
        loading={loadingRooms}
        onSuccess={() => {
          refetchRooms();
          refetchTimetable();
        }}
      />

      <AddTimetableSlotModal
        open={openAddSlotModal}
        onClose={() => setOpenAddSlotModal(false)}
        academicYearId={currentYear?.id || ''}
        classId={selectedClassId}
        sectionId={selectedSectionId}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        initialDayOfWeek={slotDay}
        onSuccess={() => refetchTimetable()}
      />
    </Box>
  );
};