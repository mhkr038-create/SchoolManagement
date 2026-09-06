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
import { Campaign as AnnounceIcon } from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  classes: any[];
  onSuccess: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  open,
  onClose,
  classes,
  onSuccess
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'TEACHERS' | 'STUDENTS' | 'PARENTS' | 'CLASS'>('ALL');
  const [targetClassId, setTargetClassId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/announcements', {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        targetClassId: targetAudience === 'CLASS' ? targetClassId : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined
      });
      setTitle('');
      setContent('');
      setTargetAudience('ALL');
      setTargetClassId('');
      setExpiresAt('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to post announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnnounceIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Broadcast School Announcement
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Announcement Title"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Annual Sports Day Schedule & Bus Timings"
            />

            <FormControl fullWidth required>
              <InputLabel>Target Audience</InputLabel>
              <Select
                value={targetAudience}
                label="Target Audience"
                onChange={(e) => setTargetAudience(e.target.value as any)}
              >
                <MenuItem value="ALL">All School (Staff, Students & Parents)</MenuItem>
                <MenuItem value="TEACHERS">Teachers & Staff Only</MenuItem>
                <MenuItem value="PARENTS">Parents & Guardians</MenuItem>
                <MenuItem value="STUDENTS">Student Body</MenuItem>
                <MenuItem value="CLASS">Specific Class Notice</MenuItem>
              </Select>
            </FormControl>

            {targetAudience === 'CLASS' && (
              <FormControl fullWidth required>
                <InputLabel>Target Class</InputLabel>
                <Select
                  value={targetClassId}
                  label="Target Class"
                  onChange={(e) => setTargetClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <TextField
              label="Message Body / Circular Content"
              fullWidth
              required
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the full announcement text, agenda, circular details..."
            />

            <TextField
              label="Expiry / Event Date (Optional)"
              type="date"
              fullWidth
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="The announcement will remain pinned until this date"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving || !title.trim() || !content.trim() || (targetAudience === 'CLASS' && !targetClassId)}
            startIcon={saving ? <CircularProgress size={20} /> : <AnnounceIcon />}
            sx={{ px: 3, fontWeight: 700 }}
          >
            {saving ? 'Broadcasting...' : 'Publish Announcement'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};