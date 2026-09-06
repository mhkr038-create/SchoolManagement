import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { FeeCategory } from '@school/types';

interface FeeCategoriesTabProps {
  categories: FeeCategory[];
  loading: boolean;
  onSuccess: () => void;
}

export const FeeCategoriesTab: React.FC<FeeCategoriesTabProps> = ({
  categories,
  loading,
  onSuccess
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/fees/categories', {
        name: name.trim(),
        description: description.trim() || undefined
      });
      setName('');
      setDescription('');
      setOpenModal(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create fee head');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: FeeCategory) => {
    if (!confirm(`Delete fee category "${cat.name}"?`)) return;
    try {
      await apiClient.delete(`/fees/categories/${cat.id}`);
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700}>
          Fee Heads & Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setError(null);
            setOpenModal(true);
          }}
        >
          Add Fee Head
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Fee Head Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No fee categories defined yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                  <TableCell>{cat.description || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(cat)}
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

      {/* Modal: Add Category */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={700}>Add New Fee Head</DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Fee Head Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tuition Fee, Transport Fee, Lab Fee"
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save Fee Head'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};