import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  InputAdornment,
  TablePagination
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { StatusBadge } from '../../components/ui/StatusBadge';

export const UsersListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Welcome123!');
  const [userType, setUserType] = useState('TEACHER');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Users
  const { data: usersResponse, isLoading, error } = useQuery({
    queryKey: ['users', page + 1, rowsPerPage, search, userTypeFilter],
    queryFn: async () => {
      const res: any = await apiClient.get('/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
          userType: userTypeFilter || undefined
        }
      });
      return res.data || res;
    }
  });

  // Fetch Roles for Selection
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res: any = await apiClient.get('/rbac/roles');
      return res.data || res;
    }
  });

  const roles = Array.isArray(rolesResponse) ? rolesResponse : [];
  const users = usersResponse?.data || [];
  const totalItems = usersResponse?.meta?.totalItems || 0;

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: async (payload: any) => {
      return apiClient.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setOpenModal(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create user';
      setFormError(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPassword('Welcome123!');
    setUserType('TEACHER');
    setSelectedRoleId('');
    setFormError(null);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    createUserMutation.mutate({
      firstName,
      lastName,
      email,
      phone,
      password,
      userType,
      roleIds: selectedRoleId ? [selectedRoleId] : []
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            User Directory & Access Control
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage school administrators, teachers, staff, parents, and student accounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          Add New User
        </Button>
      </Box>

      {/* Filter Toolbar */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or email..."
            size="small"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Filter Role Type</InputLabel>
            <Select
              value={userTypeFilter}
              label="Filter Role Type"
              onChange={(e) => { setUserTypeFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">All Account Types</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
              <MenuItem value="SCHOOL_ADMIN">School Admin</MenuItem>
              <MenuItem value="TEACHER">Teacher</MenuItem>
              <MenuItem value="STAFF">Staff</MenuItem>
              <MenuItem value="PARENT">Parent</MenuItem>
              <MenuItem value="STUDENT">Student</MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card sx={{ borderRadius: 3 }}>
        {isLoading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress size={36} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            Error loading users list. Please try again.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Account Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Assigned Roles</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                        No users matching your criteria found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u: any) => (
                      <TableRow key={u.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, fontSize: '0.85rem' }}>
                              {u.firstName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {u.firstName} {u.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {u.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={u.userType} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {u.roles && u.roles.length > 0 ? (
                              u.roles.map((r: string) => (
                                <Chip key={r} label={r} size="small" color="primary" sx={{ fontSize: '0.75rem' }} />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">None</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={u.status} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{u.phone || '-'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalItems}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Card>

      {/* Create User Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New User</DialogTitle>
        <Box component="form" onSubmit={handleCreateUser}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                size="small"
                fullWidth
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                label="Last Name"
                size="small"
                fullWidth
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Box>

            <TextField
              label="Email Address"
              type="email"
              size="small"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Phone Number"
              size="small"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <TextField
              label="Initial Password"
              size="small"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="The user will be prompted to change on first login"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl size="small" fullWidth required>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={userType}
                  label="Account Type"
                  onChange={(e) => setUserType(e.target.value)}
                >
                  <MenuItem value="TEACHER">Teacher</MenuItem>
                  <MenuItem value="STAFF">Staff / Administrator</MenuItem>
                  <MenuItem value="PARENT">Parent</MenuItem>
                  <MenuItem value="STUDENT">Student</MenuItem>
                  <MenuItem value="SCHOOL_ADMIN">School Admin</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>Assign Role</InputLabel>
                <Select
                  value={selectedRoleId}
                  label="Assign Role"
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  <MenuItem value="">Default Permissions</MenuItem>
                  {roles.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? <CircularProgress size={24} /> : 'Save User'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
