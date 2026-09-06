import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Typography,
  Alert,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  MeetingRoom as RoomIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { Room } from '@school/types';

interface ManageRoomsModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  loading: boolean;
  onSuccess: () => void;
}

export const ManageRoomsModal: React.FC<ManageRoomsModalProps> = ({
  open,
  onClose,
  rooms,
  loading,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | string>(40);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/timetable/rooms', {
        name: name.trim(),
        capacity: Number(capacity) || 40
      });
      setName('');
      setCapacity(40);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add room');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Delete room "${roomName}"?`)) return;
    try {
      await apiClient.delete(`/timetable/rooms/${roomId}`);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RoomIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Manage School Rooms & Labs
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Add room form */}
        <Box component="form" onSubmit={handleAddRoom} sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Add New Room / Resource
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              label="Room / Lab Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Room 204 or Physics Lab"
              required
              sx={{ flexGrow: 1 }}
            />
            <TextField
              size="small"
              type="number"
              label="Capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              sx={{ width: 100 }}
              required
            />
            <Button
              type="submit"
              variant="contained"
              disabled={saving || !name.trim()}
              startIcon={<AddIcon />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add
            </Button>
          </Stack>
        </Box>

        {/* Rooms table */}
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Existing Rooms ({rooms.length})
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Room Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No rooms registered yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{room.name}</TableCell>
                    <TableCell>{room.capacity} seats</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};