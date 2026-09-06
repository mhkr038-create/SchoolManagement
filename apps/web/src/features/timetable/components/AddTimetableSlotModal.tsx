import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Typography,
  Alert,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as ConflictIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { Room } from '@school/types';

interface AddTimetableSlotModalProps {
  open: boolean;
  onClose: () => void;
  academicYearId: string;
  classId: string;
  sectionId: string;
  subjects: any[];
  teachers: any[];
  rooms: Room[];
  initialDayOfWeek?: number;
  initialStartTime?: string;
  initialEndTime?: string;
  onSuccess: () => void;
}

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export const AddTimetableSlotModal: React.FC<AddTimetableSlotModalProps> = ({
  open,
  onClose,
  academicYearId,
  classId,
  sectionId,
  subjects,
  teachers,
  rooms,
  initialDayOfWeek = 1,
  initialStartTime = '08:30',
  initialEndTime = '09:15',
  onSuccess
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDayOfWeek);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialDayOfWeek) setDayOfWeek(initialDayOfWeek);
    if (initialStartTime) setStartTime(initialStartTime);
    if (initialEndTime) setEndTime(initialEndTime);
    if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id);
    if (teachers.length > 0 && !teacherId) setTeacherId(teachers[0].id);
    setError(null);
  }, [open, initialDayOfWeek, initialStartTime, initialEndTime, subjects, teachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setError('Start time must be strictly before end time');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/timetable/entries', {
        academicYearId,
        classId,
        sectionId,
        subjectId,
        teacherId,
        roomId: roomId || undefined,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Timetable conflict detected';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle fontWeight={700}>
          Assign Timetable Period
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert
              severity="error"
              icon={<ConflictIcon />}
              sx={{ mb: 2.5 }}
            >
              <strong>Conflict Detected:</strong> {error}
            </Alert>
          )}

          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            {/* Day of Week */}
            <FormControl fullWidth required>
              <InputLabel>Day of the Week</InputLabel>
              <Select
                value={dayOfWeek}
                label="Day of the Week"
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
              >
                {DAYS.map((d) => (
                  <MenuItem key={d.value} value={d.value}>
                    {d.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Time range */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
              <TextField
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
              />
            </Box>

            {/* Subject */}
            <FormControl fullWidth required>
              <InputLabel>Subject</InputLabel>
              <Select
                value={subjectId}
                label="Subject"
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Teacher */}
            <FormControl fullWidth required>
              <InputLabel>Teacher</InputLabel>
              <Select
                value={teacherId}
                label="Teacher"
                onChange={(e) => setTeacherId(e.target.value)}
              >
                {teachers.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} {t.email ? `(${t.email})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Room */}
            <FormControl fullWidth>
              <InputLabel>Classroom / Lab (Optional)</InputLabel>
              <Select
                value={roomId}
                label="Classroom / Lab (Optional)"
                onChange={(e) => setRoomId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Auto (Default Classroom)</em>
                </MenuItem>
                {rooms.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name} ({r.capacity} seats)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !subjectId || !teacherId}
            startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {saving ? 'Validating & Saving...' : 'Confirm Period Slot'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};