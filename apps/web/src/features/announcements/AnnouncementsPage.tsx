import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Stack,
  IconButton,
  CircularProgress,
  Avatar,
  Divider
} from '@mui/material';
import {
  Campaign as AnnounceIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Class as ClassIcon,
  CalendarToday as CalendarIcon,
  NotificationsActive as AlertIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { CreateAnnouncementModal } from './components/CreateAnnouncementModal';
import type { Announcement } from '@school/types';

export const AnnouncementsPage: React.FC = () => {
  const { user, school, availableSchools } = useAuthStore();
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.roles?.some((r: any) => (r.name || r) === 'SUPER_ADMIN');
  const queryClient = useQueryClient();

  const [selectedBranch, setSelectedBranch] = useState<string>(
    isSuperAdmin ? 'ALL' : (school?.id || '')
  );

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // 1. Fetch Classes for class targeting
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['academics-classes', selectedBranch],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes', {
        params: { schoolId: selectedBranch !== 'ALL' ? selectedBranch : undefined }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  // 2. Fetch Announcements
  const {
    data: announcementsData,
    isLoading: loadingAnnouncements,
    refetch: refetchAnnouncements
  } = useQuery({
    queryKey: ['announcements-list', selectedBranch, activeTab, searchQuery],
    queryFn: async () => {
      const res = await apiClient.get('/announcements', {
        params: {
          schoolId: selectedBranch,
          targetAudience: activeTab !== 'ALL' ? activeTab : undefined,
          search: searchQuery.trim() || undefined
        }
      });
      return res.data?.data !== undefined ? res.data.data : (res.data || res);
    }
  });

  const announcements: Announcement[] = announcementsData?.items || [];

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete announcement "${title}"?`)) return;
    try {
      await apiClient.delete(`/announcements/${id}`);
      refetchAnnouncements();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to delete announcement');
    }
  };

  const getAudienceChip = (aud: string) => {
    switch (aud) {
      case 'ALL':
        return <Chip icon={<SchoolIcon />} label="All School" size="small" color="primary" sx={{ fontWeight: 700 }} />;
      case 'TEACHERS':
        return <Chip icon={<PeopleIcon />} label="Teachers Only" size="small" color="warning" sx={{ fontWeight: 700 }} />;
      case 'PARENTS':
        return <Chip icon={<PeopleIcon />} label="Parents Bulletin" size="small" color="secondary" sx={{ fontWeight: 700 }} />;
      case 'STUDENTS':
        return <Chip icon={<SchoolIcon />} label="Student Body" size="small" color="info" sx={{ fontWeight: 700 }} />;
      case 'CLASS':
        return <Chip icon={<ClassIcon />} label="Class Notice" size="small" color="success" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={aud} size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Announcements & Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Broadcast school circulars, holiday notices, and class updates with automatic in-app alerts
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSuperAdmin && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Campus / Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Campus / Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
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
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateModal(true)}
            sx={{ fontWeight: 700 }}
          >
            Post Announcement
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetchAnnouncements()}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Filter Tabs & Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab value="ALL" label="All Notices" />
              <Tab value="ALL" label="School-Wide" />
              <Tab value="TEACHERS" label="Faculty & Staff" />
              <Tab value="PARENTS" label="Parents" />
              <Tab value="CLASS" label="Class Circulars" />
            </Tabs>
          </Grid>

          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search circulars by keywords or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Announcements Feed */}
      <Stack spacing={2.5}>
        {loadingAnnouncements ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : announcements.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <AlertIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              No announcements published yet for this category.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpenCreateModal(true)}
              sx={{ mt: 2 }}
            >
              Broadcast an Announcement
            </Button>
          </Paper>
        ) : (
          announcements.map((ann) => (
            <Card
              key={ann.id}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                '&:hover': { borderColor: 'primary.main', boxShadow: 2 }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 700 }}>
                      {ann.author?.firstName?.[0] || 'A'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {ann.author?.firstName} {ann.author?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Published on {ann.publishedAt.split('T')[0]}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getAudienceChip(ann.targetAudience)}
                    {ann.targetClass && (
                      <Chip
                        label={ann.targetClass.name}
                        size="small"
                        variant="outlined"
                        color="success"
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(ann.id, ann.title)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mb: 1 }}>
                  {ann.title}
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {ann.content}
                </Typography>

                {ann.expiresAt && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2, color: 'text.secondary' }}>
                    <CalendarIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={600}>
                      Active until: {ann.expiresAt}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {/* Modal */}
      <CreateAnnouncementModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        classes={classes}
        onSuccess={() => refetchAnnouncements()}
      />
    </Box>
  );
};