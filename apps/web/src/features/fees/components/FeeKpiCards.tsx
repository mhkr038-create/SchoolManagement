import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  CurrencyRupee as RupeeIcon,
  TrendingUp as TrendingUpIcon,
  ErrorOutline as UnpaidIcon
} from '@mui/icons-material';
import type { FeeStats } from '@school/types';

interface FeeKpiCardsProps {
  stats: FeeStats | undefined;
}

export const FeeKpiCards: React.FC<FeeKpiCardsProps> = ({ stats }) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <Grid container spacing={2.5} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" fontWeight={700} color="primary" textTransform="uppercase">
                Total Invoiced
              </Typography>
              <WalletIcon color="primary" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              {formatINR(stats?.totalInvoiced || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats?.totalInvoices || 0} Invoices Issued
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" fontWeight={700} color="success.main" textTransform="uppercase">
                Total Collected
              </Typography>
              <RupeeIcon color="success" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="success.main">
              {formatINR(stats?.totalCollected || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats?.paidInvoices || 0} Paid | {stats?.partialInvoices || 0} Partial
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#fff1f2', border: '1px solid #fecdd3' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" fontWeight={700} color="error.main" textTransform="uppercase">
                Outstanding Dues
              </Typography>
              <UnpaidIcon color="error" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="error.main">
              {formatINR(stats?.totalOutstanding || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats?.unpaidInvoices || 0} Invoices Pending
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" fontWeight={700} color="secondary" textTransform="uppercase">
                Collection Rate
              </Typography>
              <TrendingUpIcon color="secondary" />
            </Box>
            <Typography variant="h5" fontWeight={800} color="secondary">
              {stats?.collectionRate || 0}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recovery vs Total Invoiced
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};