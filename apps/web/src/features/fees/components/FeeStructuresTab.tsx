import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { FeeStructure, FeeCategory } from '@school/types';

interface FeeStructuresTabProps {
  feeStructures: FeeStructure[];
  loading: boolean;
  classes: any[];
  academicYears: any[];
  categories: FeeCategory[];
  onSuccess: () => void;
  onGenerateForStructure: (classId: string, structId: string) => void;
}

export const FeeStructuresTab: React.FC<FeeStructuresTabProps> = ({
  feeStructures,
  loading,
  classes,
  academicYears,
  categories,
  onSuccess,
  onGenerateForStructure
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [classId, setClassId] = useState('');
  const [yearId, setYearId] = useState('');
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('TERMLY');
  const [items, setItems] = useState<{ feeCategoryId: string; amount: number }[]>([
    { feeCategoryId: '', amount: 0 }
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleOpen = () => {
    if (classes.length > 0 && !classId) setClassId(classes[0].id);
    if (academicYears.length > 0 && !yearId) setYearId(academicYears[0].id);
    setError(null);
    setOpenModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(i => i.feeCategoryId && Number(i.amount) > 0);
    if (validItems.length === 0) {
      setError('Please add at least one fee head with an amount greater than zero');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/fees/structures', {
        classId,
        academicYearId: yearId,
        name: name.trim(),
        frequency,
        items: validItems.map(i => ({
          feeCategoryId: i.feeCategoryId,
          amount: Number(i.amount)
        }))
      });
      setName('');
      setItems([{ feeCategoryId: '', amount: 0 }]);
      setOpenModal(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create fee structure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700}>
          Class-wise Fee Structure Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Create Fee Structure
        </Button>
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          <Grid item xs={12} sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress />
          </Grid>
        ) : feeStructures.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>
                No fee structures defined yet. Click "Create Fee Structure" to configure class fees.
              </Typography>
            </Paper>
          </Grid>
        ) : (
          feeStructures.map((struct) => (
            <Grid item xs={12} md={6} key={struct.id}>
              <Card sx={{ height: '100%', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        {struct.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Class: <strong>{struct.class?.name || 'Class'}</strong> | {struct.frequency}
                      </Typography>
                    </Box>
                    <Chip
                      label={formatINR(struct.totalAmount)}
                      color="primary"
                      sx={{ fontWeight: 800, fontSize: '1rem', px: 1 }}
                    />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Fee Breakdown:
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {(struct.items || []).map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: '#f8fafc', p: 1, borderRadius: 1 }}>
                        <Typography variant="body2">
                          {item.feeCategory?.name || 'Fee Item'}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatINR(item.amount)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {struct._count?.invoices || 0} Invoices generated from this template
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onGenerateForStructure(struct.classId, struct.id)}
                    >
                      Generate Invoices
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Modal: Create Structure */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={700}>Create Class Fee Structure</DialogTitle>
          <DialogContent dividers>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth required>
                <InputLabel>Target Class</InputLabel>
                <Select
                  value={classId}
                  label="Target Class"
                  onChange={(e) => setClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={yearId}
                  label="Academic Year"
                  onChange={(e) => setYearId(e.target.value)}
                >
                  {academicYears.map((y) => (
                    <MenuItem key={y.id} value={y.id}>
                      {y.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Structure Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Class 2 Standard Term Fee 2026-27"
              />

              <FormControl fullWidth>
                <InputLabel>Billing Frequency</InputLabel>
                <Select
                  value={frequency}
                  label="Billing Frequency"
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <MenuItem value="TERMLY">Termly (3 times/year)</MenuItem>
                  <MenuItem value="ANNUAL">Annual (Once/year)</MenuItem>
                  <MenuItem value="MONTHLY">Monthly</MenuItem>
                  <MenuItem value="ONE_TIME">One-Time Admission Fee</MenuItem>
                </Select>
              </FormControl>

              <Typography variant="subtitle2" fontWeight={700} sx={{ pt: 1 }}>
                Fee Breakdown Items:
              </Typography>

              {items.map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Fee Head</InputLabel>
                    <Select
                      value={item.feeCategoryId}
                      label="Fee Head"
                      onChange={(e) => {
                        const next = [...items];
                        next[idx].feeCategoryId = e.target.value;
                        setItems(next);
                      }}
                    >
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    type="number"
                    label="Amount (₹)"
                    sx={{ width: 180 }}
                    value={item.amount || ''}
                    onChange={(e) => {
                      const next = [...items];
                      next[idx].amount = Number(e.target.value);
                      setItems(next);
                    }}
                    required
                  />

                  <IconButton
                    size="small"
                    color="error"
                    disabled={items.length === 1}
                    onClick={() => {
                      setItems(items.filter((_, i) => i !== idx));
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setItems([...items, { feeCategoryId: '', amount: 0 }])}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add Another Fee Head
              </Button>

              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">Total Structure Amount:</Typography>
                <Typography variant="h6" fontWeight={800} color="primary">
                  {formatINR(items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0))}
                </Typography>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving || !name.trim()}>
              {saving ? 'Creating...' : 'Create Structure'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};