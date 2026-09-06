import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { FeeStructure } from '@school/types';

interface BulkInvoiceGeneratorTabProps {
  classes: any[];
  academicYears: any[];
  feeStructures: FeeStructure[];
  initialClassId?: string;
  initialStructureId?: string;
  onSuccess: () => void;
}

export const BulkInvoiceGeneratorTab: React.FC<BulkInvoiceGeneratorTabProps> = ({
  classes,
  academicYears,
  feeStructures,
  initialClassId,
  initialStructureId,
  onSuccess
}) => {
  const [yearId, setYearId] = useState(academicYears[0]?.id || '');
  const [classId, setClassId] = useState(initialClassId || classes[0]?.id || '');
  const [structureId, setStructureId] = useState(initialStructureId || '');
  const [dueDate, setDueDate] = useState('2026-10-31');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialClassId) setClassId(initialClassId);
    if (initialStructureId) setStructureId(initialStructureId);
  }, [initialClassId, initialStructureId]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiClient.post('/fees/invoices/generate', {
        academicYearId: yearId,
        classId,
        feeStructureId: structureId,
        dueDate,
        title: title.trim() || undefined
      });
      const data = res.data?.data !== undefined ? res.data.data : (res.data || res);
      setResult(data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Invoice generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h6" fontWeight={800} color="primary" sx={{ mb: 1 }}>
        Bulk Student Fee Invoice Generator
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Generate student billing invoices in a single click for all enrolled students in a class.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
      {result && (
        <Alert severity="success" sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {result.message}
          </Typography>
          <Typography variant="caption">
            Generated: {result.generatedCount} | Already existed: {result.skippedCount} | Total class students: {result.totalStudents}
          </Typography>
        </Alert>
      )}

      <form onSubmit={handleGenerate}>
        <Stack spacing={2.5}>
          <FormControl fullWidth required>
            <InputLabel>Academic Year</InputLabel>
            <Select
              value={yearId}
              label="Academic Year"
              onChange={(e) => setYearId(e.target.value)}
            >
              {academicYears.map((y) => (
                <MenuItem key={y.id} value={y.id}>
                  {y.name} {y.isCurrent ? '(Current Year)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Target Class</InputLabel>
            <Select
              value={classId}
              label="Target Class"
              onChange={(e) => {
                setClassId(e.target.value);
                setStructureId('');
              }}
            >
              {classes.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth required>
            <InputLabel>Fee Structure Template</InputLabel>
            <Select
              value={structureId}
              label="Fee Structure Template"
              onChange={(e) => setStructureId(e.target.value)}
            >
              {feeStructures
                .filter((s) => !classId || s.classId === classId)
                .map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({formatINR(s.totalAmount)})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            label="Invoice Title / Description (Optional)"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Term 1 Comprehensive Fee 2026-27"
          />

          <TextField
            label="Payment Due Date"
            type="date"
            fullWidth
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Box sx={{ pt: 1 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !yearId || !classId || !structureId}
              startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{ px: 4, py: 1.5, fontWeight: 700 }}
            >
              {loading ? 'Generating Invoices...' : 'Generate Invoices for Enrolled Students'}
            </Button>
          </Box>
        </Stack>
      </form>
    </Paper>
  );
};