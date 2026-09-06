import React from 'react';
import {
  Box,
  Paper,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Typography,
  Chip,
  Stack,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  CurrencyRupee as RupeeIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import type { FeeInvoice } from '@school/types';

interface InvoicesTableTabProps {
  invoices: FeeInvoice[];
  loading: boolean;
  isSuperAdmin: boolean;
  classes: any[];
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedClassId: string;
  setSelectedClassId: (v: string) => void;
  selectedStatus: string;
  setSelectedStatus: (v: string) => void;
  page: number;
  setPage: (v: number) => void;
  totalPages: number;
  onPayClick: (inv: FeeInvoice) => void;
  onReceiptClick: (receiptId: string) => void;
  onSwitchToGenerator: () => void;
}

export const InvoicesTableTab: React.FC<InvoicesTableTabProps> = ({
  invoices,
  loading,
  isSuperAdmin,
  classes,
  searchQuery,
  setSearchQuery,
  selectedClassId,
  setSelectedClassId,
  selectedStatus,
  setSelectedStatus,
  page,
  setPage,
  totalPages,
  onPayClick,
  onReceiptClick,
  onSwitchToGenerator
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <Box>
      {/* Filters Bar */}
      <Paper sx={{ p: 2, mb: 2.5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search student, admission #, invoice #..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Class</InputLabel>
              <Select
                value={selectedClassId}
                label="Filter by Class"
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All Classes</MenuItem>
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
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="UNPAID">Unpaid (Full Due)</MenuItem>
                <MenuItem value="PARTIAL">Partial Paid</MenuItem>
                <MenuItem value="PAID">Fully Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onSwitchToGenerator}
              fullWidth
            >
              Generate
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Invoices Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Class & Section</TableCell>
              {isSuperAdmin && <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>}
              <TableCell align="right" sx={{ fontWeight: 700 }}>Total Fee</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Paid</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Balance Due</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary" fontWeight={600}>
                    No fee invoices found matching the current filters.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1.5 }}
                    onClick={onSwitchToGenerator}
                  >
                    Generate Invoices in Bulk
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary">
                      {inv.invoiceNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Due: {inv.dueDate}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {inv.student?.firstName} {inv.student?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Adm #: {inv.student?.admissionNumber}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {inv.student?.currentClass?.name || 'Class'}{' '}
                      {inv.student?.currentSection?.name ? `(${inv.student.currentSection.name})` : ''}
                    </Typography>
                  </TableCell>

                  {isSuperAdmin && (
                    <TableCell>
                      <Chip
                        label={inv.student?.school?.name || 'Main Campus'}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  )}

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      {formatINR(inv.totalAmount)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      {formatINR(inv.paidAmount)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      color={inv.balanceAmount > 0 ? 'error.main' : 'text.primary'}
                    >
                      {formatINR(inv.balanceAmount)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={inv.status}
                      size="small"
                      color={
                        inv.status === 'PAID'
                          ? 'success'
                          : inv.status === 'PARTIAL'
                          ? 'warning'
                          : 'error'
                      }
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {inv.status !== 'PAID' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<RupeeIcon />}
                          onClick={() => onPayClick(inv)}
                          sx={{ textTransform: 'none', fontWeight: 700, py: 0.5 }}
                        >
                          Collect
                        </Button>
                      )}

                      {inv.allocations && inv.allocations.length > 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<ReceiptIcon />}
                          onClick={() => {
                            const receiptId =
                              inv.allocations?.[0]?.payment?.receipt?.id ||
                              inv.allocations?.[0]?.payment?.id;
                            if (receiptId) onReceiptClick(receiptId);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600, py: 0.5 }}
                        >
                          Receipt
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};