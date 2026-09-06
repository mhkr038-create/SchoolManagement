import React, { useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import {
  Print as PrintIcon,
  Close as CloseIcon,
  CheckCircle as PaidIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import type { ReceiptDetails } from '@school/types';

interface PrintableReceiptModalProps {
  open: boolean;
  onClose: () => void;
  receiptData: ReceiptDetails | null;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  open,
  onClose,
  receiptData
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Official Fee Payment Receipt
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box
          ref={printAreaRef}
          sx={{
            p: 3,
            bgcolor: '#ffffff',
            borderRadius: 2,
            border: '1px solid #e0e0e0',
            '@media print': {
              border: 'none',
              p: 0
            }
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <SchoolIcon sx={{ fontSize: 36 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {receiptData.school.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {receiptData.school.address || 'Central Campus, Bangalore, Karnataka'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Campus Code: {receiptData.school.code} {receiptData.school.phone && `| Tel: ${receiptData.school.phone}`}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                icon={<PaidIcon />}
                label="PAYMENT RECEIVED"
                color="success"
                size="small"
                sx={{ fontWeight: 700, mb: 0.5 }}
              />
              <Typography variant="h6" fontWeight={800} color="primary">
                {receiptData.receiptNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Date: {receiptData.paymentDate}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          {/* Student & Payment Metadata */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 3 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Student Information
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>
                {receiptData.student.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Admission No: <strong>{receiptData.student.admissionNumber}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class & Section: <strong>{receiptData.student.className} {receiptData.student.sectionName ? `(${receiptData.student.sectionName})` : ''}</strong>
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                Transaction Details
              </Typography>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.5 }}>
                Mode: {receiptData.paymentMethod}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reference: <strong>{receiptData.paymentReference}</strong>
              </Typography>
              {receiptData.transactionId && (
                <Typography variant="body2" color="text.secondary">
                  Txn / UTR ID: <strong>{receiptData.transactionId}</strong>
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Cashier / Collector: <strong>{receiptData.collector.name}</strong>
              </Typography>
            </Paper>
          </Box>

          {/* Fee Breakdown Table */}
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Invoice: {receiptData.invoice.title} ({receiptData.invoice.invoiceNumber})
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fee Head / Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receiptData.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell align="right">{formatINR(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totals & Balance Summary */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ width: 280 }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Total Invoice Amount:</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatINR(receiptData.invoice.totalAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                  <Typography variant="subtitle2" fontWeight={700}>Amount Paid Today:</Typography>
                  <Typography variant="subtitle2" fontWeight={800}>{formatINR(receiptData.amountPaid)}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: receiptData.balanceRemaining > 0 ? 'error.main' : 'text.primary' }}>
                  <Typography variant="body2" fontWeight={700}>Remaining Balance Due:</Typography>
                  <Typography variant="body2" fontWeight={800}>{formatINR(receiptData.balanceRemaining)}</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>

          {receiptData.notes && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
              Notes: {receiptData.notes}
            </Typography>
          )}

          {/* Signatures */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 4, pt: 2 }}>
            <Box sx={{ textAlign: 'center', width: 200 }}>
              <Box sx={{ height: 40 }} />
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Parent / Guardian Signature
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', width: 200 }}>
              <Typography variant="caption" color="primary" fontWeight={700}>
                AUTHORIZED SIGNATURE
              </Typography>
              <Box sx={{ height: 24 }} />
              <Divider sx={{ mb: 1 }} />
              <Typography variant="caption" color="text.secondary">
                For {receiptData.school.name}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ px: 3, fontWeight: 700 }}
        >
          Print Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};