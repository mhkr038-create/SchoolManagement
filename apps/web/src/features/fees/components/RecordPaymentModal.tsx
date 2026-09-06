import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Chip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CurrencyRupee as RupeeIcon
} from '@mui/icons-material';
import { apiClient } from '../../../services/api/apiClient';
import type { FeeInvoice, ReceiptDetails } from '@school/types';

interface RecordPaymentModalProps {
  open: boolean;
  onClose: () => void;
  invoice: FeeInvoice | null;
  onSuccess: (receipt: ReceiptDetails) => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  open,
  onClose,
  invoice,
  onSuccess
}) => {
  const [amount, setAmount] = useState<number | string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE'>('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.balanceAmount);
      setError(null);
      setTransactionId('');
      setNotes('');
    }
  }, [invoice]);

  if (!invoice) return null;

  const numAmount = Number(amount) || 0;
  const newBalance = Math.max(0, invoice.balanceAmount - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError('Payment amount must be greater than zero');
      return;
    }
    if (numAmount > invoice.balanceAmount + 0.01) {
      setError(`Payment amount cannot exceed remaining balance of ₹${invoice.balanceAmount}`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/fees/payments', {
        invoiceId: invoice.id,
        amount: numAmount,
        paymentMethod,
        transactionId: transactionId.trim() || undefined,
        notes: notes.trim() || undefined
      });

      const receipt = res.data?.data !== undefined ? res.data.data : (res.data || res);
      onSuccess(receipt);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <PaymentIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Collect Fee Payment
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Invoice overview summary card */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {invoice.title}
              </Typography>
              <Chip
                label={invoice.status}
                size="small"
                color={invoice.status === 'PAID' ? 'success' : invoice.status === 'PARTIAL' ? 'warning' : 'error'}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Student: <strong>{invoice.student?.firstName} {invoice.student?.lastName}</strong> ({invoice.student?.admissionNumber})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Invoice No: <strong>{invoice.invoiceNumber}</strong>
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, textAlign: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Fee</Typography>
                <Typography variant="subtitle2" fontWeight={700}>{formatINR(invoice.totalAmount)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Already Paid</Typography>
                <Typography variant="subtitle2" fontWeight={700} color="success.main">{formatINR(invoice.paidAmount)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Balance Due</Typography>
                <Typography variant="subtitle2" fontWeight={800} color="error.main">{formatINR(invoice.balanceAmount)}</Typography>
              </Box>
            </Box>
          </Box>

          <Stack spacing={2.5}>
            {/* Amount to Pay with Quick Button */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>
                  Amount to Collect (₹)
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setAmount(invoice.balanceAmount)}
                  sx={{ textTransform: 'none', py: 0 }}
                >
                  Pay Full Balance ({formatINR(invoice.balanceAmount)})
                </Button>
              </Box>
              <TextField
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary', fontWeight: 700 }}>₹</Typography>
                }}
                helperText={
                  numAmount > 0 ? (
                    `New Remaining Balance: ${formatINR(newBalance)} ${newBalance === 0 ? '(Fully Paid)' : ''}`
                  ) : ''
                }
              />
            </Box>

            {/* Payment Method */}
            <FormControl fullWidth required>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={paymentMethod}
                label="Payment Mode"
                onChange={(e) => setPaymentMethod(e.target.value as any)}
              >
                <MenuItem value="UPI">UPI (Google Pay / PhonePe / Paytm)</MenuItem>
                <MenuItem value="CASH">Cash Counter</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer / NEFT / IMPS</MenuItem>
                <MenuItem value="CHEQUE">Cheque / Demand Draft</MenuItem>
                <MenuItem value="ONLINE">Online Card / NetBanking Portal</MenuItem>
              </Select>
            </FormControl>

            {/* Reference / Transaction ID */}
            <TextField
              label="Transaction Ref / UTR / Cheque Number"
              fullWidth
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UPI-99882211 or CHQ-00129"
              helperText="Optional for cash payments, recommended for UPI/Bank/Cheque"
            />

            {/* Notes */}
            <TextField
              label="Remarks / Notes"
              fullWidth
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any remarks for the fee receipt..."
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || numAmount <= 0}
            startIcon={loading ? <CircularProgress size={20} /> : <RupeeIcon />}
            sx={{ fontWeight: 700, px: 3 }}
          >
            {loading ? 'Processing...' : `Confirm & Issue Receipt (${formatINR(numAmount)})`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};