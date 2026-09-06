import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  Paper,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as ActiveIcon,
  Apartment as BranchIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/apiClient';
import { useAuthStore } from '../../app/store/useAuthStore';
import { School } from '@school/types';

export const BranchSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, school: currentSchool, switchSchool, setAvailableSchools } = useAuthStore();

  // Fetch available schools for the user
  const { data: schoolsData, isLoading } = useQuery({
    queryKey: ['user-schools'],
    queryFn: async () => {
      const res: any = await apiClient.get('/schools');
      const list = res.data || res;
      if (Array.isArray(list)) {
        setAvailableSchools(list);
      }
      return Array.isArray(list) ? list : [];
    }
  });

  const schools: any[] = Array.isArray(schoolsData) ? schoolsData : [];

  const handleSelectSchool = (targetSchool: School) => {
    switchSchool(targetSchool);
    // Invalidate all active queries so dashboard, students, attendance refresh for the selected branch
    queryClient.invalidateQueries();
    navigate('/dashboard');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f5f9', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <SchoolIcon fontSize="large" />
          </Avatar>
          <Typography variant="h4" fontWeight={800} color="#0f172a" gutterBottom>
            Select School Campus
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, <strong>{user?.firstName} {user?.lastName}</strong>. Please select the branch you wish to manage.
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : schools.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h6" color="text.secondary">
              No school branches assigned to your account.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {schools.map((branch) => {
              const isCurrent = currentSchool?.id === branch.id;

              return (
                <Grid item xs={12} sm={6} key={branch.id}>
                  <Card
                    elevation={isCurrent ? 4 : 1}
                    sx={{
                      borderRadius: 3,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: isCurrent ? '2px solid' : '1px solid #e2e8f0',
                      borderColor: isCurrent ? 'primary.main' : '#e2e8f0',
                      position: 'relative',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: isCurrent ? 'primary.main' : 'grey.200', color: isCurrent ? '#fff' : 'text.secondary' }}>
                          <BranchIcon />
                        </Avatar>
                        <Stack direction="row" spacing={1}>
                          <Chip label={branch.code} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                          {isCurrent && (
                            <Chip label="Active" size="small" color="success" icon={<ActiveIcon />} sx={{ fontWeight: 700 }} />
                          )}
                        </Stack>
                      </Box>

                      <Typography variant="h6" fontWeight={700} gutterBottom sx={{ lineHeight: 1.3 }}>
                        {branch.name}
                      </Typography>

                      <Stack spacing={1.5} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <LocationIcon fontSize="small" color="action" sx={{ mt: 0.2 }} />
                          <Typography variant="body2" color="text.secondary">
                            {branch.address || 'Rainbow English Medium Primary School Campus'}
                          </Typography>
                        </Box>
                        {branch.phone && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {branch.phone}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {branch._count && (
                        <Box sx={{ mt: 3, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                          <Grid container spacing={1} textAlign="center">
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Classes
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {branch._count.classes || 8}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Enrolled
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                {branch._count.students || 0} Students
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ p: 2 }}>
                      <Button
                        fullWidth
                        variant={isCurrent ? 'contained' : 'outlined'}
                        color="primary"
                        endIcon={<ArrowIcon />}
                        onClick={() => handleSelectSchool(branch)}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      >
                        {isCurrent ? 'Continue in this Branch' : 'Select this Branch'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            color="inherit"
            size="small"
            onClick={() => navigate('/dashboard')}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            &larr; Return to Current Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
