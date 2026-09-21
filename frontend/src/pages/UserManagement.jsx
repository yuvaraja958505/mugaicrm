import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Drawer,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd as AddUserIcon,
  Shield as AdminIcon,
  Badge as SalesIcon,
  Code as DevIcon,
  Brush as UiIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [drawerError, setDrawerError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'sales',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/index.php');
      setUsers(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch system users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditUser(null);
    setDrawerError('');
    setFormData({
      username: '',
      password: '',
      full_name: '',
      role: 'sales',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setDrawerError('');
    setFormData({
      username: user.username,
      password: '', // Blank by default when editing
      full_name: user.full_name,
      role: user.role,
    });
    setOpenDialog(true);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete user account "${user.full_name}" (@${user.username})?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/index.php?id=${user.id}`);
      setSuccess(`User account @${user.username} deleted successfully.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user account.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setDrawerError('');
    setError('');
    setSuccess('');
    try {
      if (editUser) {
        await api.put('/users/index.php', {
          id: editUser.id,
          ...formData,
        });
        setSuccess(`User account @${formData.username} updated successfully.`);
      } else {
        await api.post('/users/index.php', formData);
        setSuccess(`User @${formData.username} created successfully.`);
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (err) {
      setDrawerError(err.response?.data?.error || `Failed to ${editUser ? 'update' : 'create'} user account.`);
    }
  };


  const getRoleChip = (role) => {
    switch (role) {
      case 'admin':
        return <Chip icon={<AdminIcon fontSize="small" />} label="ADMIN" size="small" sx={{ fontWeight: 800, bgcolor: '#e0e7ff', color: '#0c1f54' }} />;
      case 'sales':
        return <Chip icon={<SalesIcon fontSize="small" />} label="SALES" size="small" sx={{ fontWeight: 800, bgcolor: '#dbeafe', color: '#1d4ed8' }} />;
      case 'developer':
        return <Chip icon={<DevIcon fontSize="small" />} label="DEVELOPER" size="small" sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d' }} />;
      case 'ui_ux':
        return <Chip icon={<UiIcon fontSize="small" />} label="UI/UX" size="small" sx={{ fontWeight: 800, bgcolor: '#f3e8ff', color: '#7e22ce' }} />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54' }}>
            User Accounts & Role Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Mugai portal users across Admin, Sales, Developer, and UI/UX roles
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<AddUserIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' }, px: 2.5 }}
          >
            Create New User
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>{success}</Alert>}

      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} color="inherit" />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Full Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Assigned Role</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Created At</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0c1f54' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>#{u.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{u.full_name}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#2563eb' }}>@{u.username}</TableCell>
                      <TableCell>{getRoleChip(u.role)}</TableCell>
                      <TableCell color="text.secondary">{u.created_at || 'System Default'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit User Account">
                          <IconButton size="small" onClick={() => handleOpenEdit(u)} sx={{ color: '#0c1f54', mr: 0.5 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User Account">
                          <IconButton size="small" onClick={() => handleDeleteUser(u)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit User Right Side Popup Drawer */}
      <Drawer
        anchor="right"
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480, md: 520 },
            bgcolor: '#ffffff',
            boxShadow: '-4px 0 24px rgba(12, 31, 84, 0.15)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <form onSubmit={handleFormSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0c1f54' }}>
              {editUser ? `Edit Account: ${editUser.full_name}` : 'Create New System Account'}
            </Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {drawerError && (
              <Alert severity="error" onClose={() => setDrawerError('')} sx={{ fontWeight: 600 }}>
                {drawerError}
              </Alert>
            )}

            <TextField
              label="Full Name"
              placeholder="e.g. Sarah Jenkins"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Username"
              helperText="Custom alphanumeric string, e.g. dev_sarah, sales_alex"
              placeholder="Username for login"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
              size="small"
            />

            <TextField
              type="password"
              label={editUser ? 'New Password (leave blank to keep current)' : 'Password'}
              placeholder={editUser ? 'Enter new password or leave blank' : 'Account password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editUser}
              fullWidth
              size="small"
            />

            <TextField
              select
              label="Select User Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              fullWidth
              size="small"
            >
              <MenuItem value="admin">Admin (Full Access & General Master)</MenuItem>
              <MenuItem value="sales">Sales (Leads & Attendance)</MenuItem>
              <MenuItem value="developer">Developer (Dashboard, Leads & Attendance)</MenuItem>
              <MenuItem value="ui_ux">UI/UX (Dashboard, Leads & Attendance)</MenuItem>
            </TextField>
          </Box>

          <Box sx={{ p: 2.5, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 1.5, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setOpenDialog(false)} variant="outlined" color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' } }}>
              {editUser ? 'Update User Account' : 'Create User'}
            </Button>
          </Box>
        </form>
      </Drawer>
    </Box>
  );
}

