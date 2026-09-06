import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  Payment as PaymentIcon,
  CurrencyRupee as RupeeIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { FeeKpiCards } from './components/FeeKpiCards';
import { InvoicesTableTab } from './components/InvoicesTableTab';
import { FeeStructuresTab } from './components/FeeStructuresTab';
import { BulkInvoiceGeneratorTab } from './components/BulkInvoiceGeneratorTab';
import { FeeCategoriesTab } from './components/FeeCategoriesTab';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { PrintableReceiptModal } from './components/PrintableReceiptModal';
import type {
  FeeInvoice,
  FeeStats,
  FeeStructure,
  FeeCategory,
  ReceiptDetails
} from '@school/types';

export const FeesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, school, availableSchools } = useAuthStore();
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
  const queryClient = useQueryClient();

  const [selectedBranch, setSelectedBranch] = useState<string>(
    isSuperAdmin ? 'ALL' : (school?.id || '')
  );

  // Invoices Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [page, setPage] = useState(1);

  // Generator pre-selection
  const [genClassId, setGenClassId] = useState('');
  const [genStructId, setGenStructId] = useState('');

  // Modals state
  const [payingInvoice, setPayingInvoice] = useState<FeeInvoice | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptDetails | null>(null);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);

  // 1. Stats Query
  const { data: stats, refetch: refetchStats } = useQuery<FeeStats>({
    queryKey: ['fee-stats', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/fees/stats', {
        params: { schoolId: selectedBranch }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 2. Classes Query
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['academics-classes', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes', {
        params: { schoolId: selectedBranch !== 'ALL' ? selectedBranch : undefined }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 3. Academic Years Query
  const { data: academicYears = [] } = useQuery<any[]>({
    queryKey: ['academics-years'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/years');
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 4. Invoices Query
  const { data: invoicesData, isLoading: loadingInvoices, refetch: refetchInvoices } = useQuery({
    queryKey: ['fee-invoices', selectedBranch, selectedClassId, selectedStatus, searchQuery, page],
    queryFn: async () => {
      const res = await apiClient.get('/fees/invoices', {
        params: {
          schoolId: selectedBranch,
          classId: selectedClassId !== 'ALL' ? selectedClassId : undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
          page,
          limit: 15
        }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 5. Structures Query
  const { data: feeStructures = [], isLoading: loadingStructures, refetch: refetchStructures } = useQuery<FeeStructure[]>({
    queryKey: ['fee-structures', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/fees/structures', {
        params: { schoolId: selectedBranch }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 6. Categories Query
  const { data: categories = [], isLoading: loadingCategories, refetch: refetchCategories } = useQuery<FeeCategory[]>({
    queryKey: ['fee-categories', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/fees/categories', {
        params: { schoolId: selectedBranch }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  const invoices = invoicesData?.items || [];
  const totalPages = invoicesData?.meta?.totalPages || 1;

  const handleOpenReceipt = async (receiptId: string) => {
    try {
      const res = await apiClient.get(`/fees/receipts/${receiptId}`);
      const data = res.data?.data !== undefined ? res.data.data : (res.data || res);
      setActiveReceipt(data);
      setOpenReceiptModal(true);
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to fetch receipt');
    }
  };

  const handleRefreshAll = () => {
    refetchStats();
    refetchInvoices();
    refetchStructures();
    refetchCategories();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Fee Management & Billing
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Fee structures, student billing, multi-mode payment collection, and instant official receipts
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSuperAdmin && (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Campus / Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Campus / Branch"
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">
                  <em>All Campuses (Consolidated)</em>
                </MenuItem>
                {(availableSchools || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshAll}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* KPI Financial Overview Cards */}
      <FeeKpiCards stats={stats} />

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<ReceiptIcon />} iconPosition="start" label="Student Invoices & Payments" />
          <Tab icon={<WalletIcon />} iconPosition="start" label="Class Fee Structures" />
          <Tab icon={<PaymentIcon />} iconPosition="start" label="Bulk Invoice Generator" />
          <Tab icon={<RupeeIcon />} iconPosition="start" label="Fee Heads / Categories" />
        </Tabs>
      </Paper>

      {/* Tab 1: Invoices */}
      {activeTab === 0 && (
        <InvoicesTableTab
          invoices={invoices}
          loading={loadingInvoices}
          isSuperAdmin={isSuperAdmin}
          classes={classes}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedClassId={selectedClassId}
          setSelectedClassId={setSelectedClassId}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          onPayClick={(inv) => setPayingInvoice(inv)}
          onReceiptClick={handleOpenReceipt}
          onSwitchToGenerator={() => setActiveTab(2)}
        />
      )}

      {/* Tab 2: Structures */}
      {activeTab === 1 && (
        <FeeStructuresTab
          feeStructures={feeStructures}
          loading={loadingStructures}
          classes={classes}
          academicYears={academicYears}
          categories={categories}
          onSuccess={refetchStructures}
          onGenerateForStructure={(cId, sId) => {
            setGenClassId(cId);
            setGenStructId(sId);
            setActiveTab(2);
          }}
        />
      )}

      {/* Tab 3: Bulk Generator */}
      {activeTab === 2 && (
        <BulkInvoiceGeneratorTab
          classes={classes}
          academicYears={academicYears}
          feeStructures={feeStructures}
          initialClassId={genClassId}
          initialStructureId={genStructId}
          onSuccess={() => {
            refetchInvoices();
            refetchStats();
            refetchStructures();
          }}
        />
      )}

      {/* Tab 4: Categories */}
      {activeTab === 3 && (
        <FeeCategoriesTab
          categories={categories}
          loading={loadingCategories}
          onSuccess={refetchCategories}
        />
      )}

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={!!payingInvoice}
        invoice={payingInvoice}
        onClose={() => setPayingInvoice(null)}
        onSuccess={(receipt) => {
          refetchInvoices();
          refetchStats();
          setActiveReceipt(receipt);
          setOpenReceiptModal(true);
        }}
      />

      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        open={openReceiptModal}
        onClose={() => {
          setOpenReceiptModal(false);
          setActiveReceipt(null);
        }}
        receiptData={activeReceipt}
      />
    </Box>
  );
};