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
import { Add as AddIcon } from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';

interface CreateAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  classes: any[];
  subjects: any[];
  initialClassId?: string;
  onSuccess: () => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  open,
  onClose,
  classes,
  subjects,
  initialClassId,
  onSuccess
}) => {
  const [classId, setClassId] = useState(initialClassId || classes[0]?.id || '');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('2026-10-20');
  const [maxMarks, setMaxMarks] = useState<number | string>(25);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeClass = classes.find((c) => c.id === classId);
  const sections = activeClass?.sections || [];

  React.useEffect(() => {
    if (initialClassId) setClassId(initialClassId);
  }, [initialClassId]);

  React.useEffect(() => {
    if (sections.length > 0 && !sections.some((s: any) => s.id === sectionId)) {
      setSectionId(sections[0].id);
    }
  }, [classId, sections]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/assignments', {
        classId,
        sectionId,
        subjectId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: new Date(dueDate).toISOString(),
        maxMarks: Number(maxMarks) || 20
      });
      setTitle('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle fontWeight={700}>
          Create New Homework Assignment
        </DialogTitle>

        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Class</InputLabel>
                <Select
                  value={classId}
                  label="Class"
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Section</InputLabel>
                <Select
                  value={sectionId}
                  label="Section"
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  {sections.map((s: any) => (
                    <MenuItem key={s.id} value={s.id}>Section {s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <FormControl fullWidth required>
              <InputLabel>Subject</InputLabel>
              <Select
                value={subjectId}
                label="Subject"
                onChange={(e) => setSubjectId(e.target.value)}
              >
                {subjects.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Assignment Title"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4 Exercises: Fractions & Decimals"
            />

            <TextField
              label="Instructions / Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for students..."
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label="Due Date"
                type="date"
                fullWidth
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Max Marks"
                type="number"
                fullWidth
                required
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !title.trim() || !classId || !sectionId || !subjectId}
            startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {saving ? 'Creating...' : 'Create & Assign'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};