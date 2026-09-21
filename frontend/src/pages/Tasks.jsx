import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Drawer,
  TextField,
  MenuItem,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
} from '@mui/material';
import {
  Assignment as TasksIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Event as EventIcon,
  ContactPhone as ContactIcon,
  Business as AccountIcon,
  PriorityHigh as PriorityIcon,
  NotificationsActive as ReminderIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import api from '../api';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getInitialFormData = () => ({
  id: null,
  task_owner_id: '',
  task_owner_name: 'AJAY A',
  subject: '',
  due_date: getTodayString(),
  contact_name: '',
  account_name: '',
  status: 'Not Started',
  priority: 'High',
  reminder: false,
  repeat_task: false,
  description: '',
});

const formatDateString = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Drawer Form State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const [drawerError, setDrawerError] = useState('');

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks/index.php');
      setTasks(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [uRes, cRes, lRes] = await Promise.all([
        api.get('/users/index.php').catch(() => ({ data: { data: [] } })),
        api.get('/contacts/index.php').catch(() => ({ data: { data: [] } })),
        api.get('/leads/index.php').catch(() => ({ data: { data: [] } })),
      ]);
      setUsers(uRes.data.data || []);
      setContacts(cRes.data.data || []);
      setLeads(lRes.data.data || []);
    } catch (err) {
      // Silently handle
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchLookups();
  }, []);

  const handleOpenAdd = () => {
    setFormData(getInitialFormData());
    setDrawerError('');
    setOpenDrawer(true);
  };

  const handleOpenEdit = (t) => {
    setFormData({
      id: t.id,
      task_owner_id: t.task_owner_id || '',
      task_owner_name: t.task_owner_name || 'AJAY A',
      subject: t.subject || '',
      due_date: t.due_date || getTodayString(),
      contact_name: t.contact_name || '',
      account_name: t.account_name || '',
      status: t.status || 'Not Started',
      priority: t.priority || 'High',
      reminder: Boolean(t.reminder),
      repeat_task: Boolean(t.repeat_task),
      description: t.description || '',
    });
    setDrawerError('');
    setOpenDrawer(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setDrawerError('');

    if (!formData.subject.trim()) {
      setDrawerError('Task Subject is required.');
      return;
    }

    try {
      if (formData.id) {
        await api.put('/tasks/index.php', formData);
        setSuccess('Task updated successfully.');
      } else {
        await api.post('/tasks/index.php', formData);
        setSuccess('Task created successfully.');
      }
      setOpenDrawer(false);
      fetchTasks();
    } catch (err) {
      setDrawerError(err.response?.data?.error || 'Failed to save task.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/tasks/index.php?id=${deleteId}`);
      setSuccess('Task deleted successfully.');
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task.');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = search.toLowerCase();
      return (
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.task_owner_name && t.task_owner_name.toLowerCase().includes(q)) ||
        (t.contact_name && t.contact_name.toLowerCase().includes(q)) ||
        (t.account_name && t.account_name.toLowerCase().includes(q)) ||
        (t.status && t.status.toLowerCase().includes(q)) ||
        (t.priority && t.priority.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    });
  }, [tasks, search]);

  const contactOptions = useMemo(() => {
    const set = new Set();
    contacts.forEach((c) => c.name && set.add(c.name));
    leads.forEach((l) => l.name && set.add(l.name));
    return Array.from(set);
  }, [contacts, leads]);

  const accountOptions = useMemo(() => {
    const set = new Set();
    contacts.forEach((c) => c.business_name && set.add(c.business_name));
    leads.forEach((l) => l.business_name && set.add(l.business_name));
    return Array.from(set);
  }, [contacts, leads]);

  const getStatusChip = (status) => {
    let color = '#64748b';
    let bgcolor = '#f1f5f9';
    if (status === 'Completed') {
      color = '#16a34a';
      bgcolor = '#dcfce7';
    } else if (status === 'In Progress') {
      color = '#2563eb';
      bgcolor = '#dbeafe';
    } else if (status === 'Deferred' || status === 'Waiting on someone else') {
      color = '#d97706';
      bgcolor = '#fef3c7';
    }
    return <Chip label={status} size="small" sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22, color, bgcolor }} />;
  };

  const getPriorityChip = (priority) => {
    let color = '#16a34a';
    let bgcolor = '#dcfce7';
    if (priority === 'High' || priority === 'Highest') {
      color = '#ef4444';
      bgcolor = '#fef2f2';
    }
    return <Chip label={priority} size="small" sx={{ fontWeight: 800, fontSize: '0.72rem', height: 22, color, bgcolor }} />;
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Top Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TasksIcon sx={{ color: '#0c1f54', fontSize: 30 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54', letterSpacing: '-0.02em' }}>
              Tasks Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Track tasks, assign owners, set due dates & reminders
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 260, bgcolor: '#ffffff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{
              fontWeight: 800,
              bgcolor: '#0c1f54',
              color: '#ffffff',
              px: 2.5,
              py: 0.8,
              borderRadius: '8px',
              textTransform: 'none',
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(12, 31, 84, 0.15)',
              '&:hover': { bgcolor: '#07153d' },
            }}
          >
            Create Task
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: '8px' }}>{success}</Alert>}

      {/* Main Tasks Table */}
      <Card sx={{ border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: '#ffffff', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 950 }} size="medium">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow sx={{ '& th': { fontWeight: 800, color: '#0c1f54', fontSize: '0.82rem', py: 1.8 } }}>
                <TableCell>Subject</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Task Owner</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="center">Reminder</TableCell>
                <TableCell align="center">Repeat</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#0c1f54' }} />
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No tasks found. Click "Create Task" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((t) => (
                  <TableRow key={t.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                      {t.subject}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {formatDateString(t.due_date)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54', fontSize: '0.82rem' }}>
                      {t.task_owner_name || 'AJAY A'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                      {t.contact_name || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                      {t.account_name || '-'}
                    </TableCell>
                    <TableCell>{getStatusChip(t.status)}</TableCell>
                    <TableCell>{getPriorityChip(t.priority)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t.reminder ? 'Yes' : 'No'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: t.reminder ? '#e0f2fe' : '#f1f5f9',
                          color: t.reminder ? '#0284c7' : '#64748b',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t.repeat_task ? 'Yes' : 'No'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          bgcolor: t.repeat_task ? '#fef3c7' : '#f1f5f9',
                          color: t.repeat_task ? '#d97706' : '#64748b',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.82rem', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.description || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Edit Task">
                          <IconButton size="small" onClick={() => handleOpenEdit(t)} sx={{ color: '#0c1f54' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Task">
                          <IconButton size="small" onClick={() => setDeleteId(t.id)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Side Drawer: "Create Task" matching exact screenshot layout and occupying 50% screen width (50vw) */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: '50vw' },
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            boxShadow: '-6px 0 30px rgba(0, 0, 0, 0.2)',
            p: 3.5,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0c1f54' }}>
            {formData.id ? 'Edit Task' : 'Create Task'}
          </Typography>
          <IconButton onClick={() => setOpenDrawer(false)} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {drawerError && (
          <Alert severity="error" onClose={() => setDrawerError('')} sx={{ mb: 2.5, borderRadius: '6px' }}>
            {drawerError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', mt: 0.5 }}>
            Task Information
          </Typography>

          {/* Task Owner */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Task Owner
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.task_owner_name}
                onChange={(e) => setFormData({ ...formData, task_owner_name: e.target.value })}
                InputProps={{
                  disableUnderline: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <PersonIcon fontSize="small" sx={{ color: '#64748b' }} />
                    </InputAdornment>
                  ),
                  style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' },
                }}
              >
                <MenuItem value="AJAY A">AJAY A</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.full_name || u.username}>
                    {u.full_name || u.username} ({u.role})
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          {/* Subject Field (Red indicator line under label) */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Subject
              </Typography>
              <Box sx={{ width: 24, height: 3, bgcolor: '#ff5252', borderRadius: 1 }} />
              <TextField
                variant="standard"
                fullWidth
                placeholder="Enter task subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              />
            </Box>
          </Box>

          {/* Due Date */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Due Date
              </Typography>
              <TextField
                type="date"
                variant="standard"
                fullWidth
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              />
            </Box>
          </Box>

          {/* Contact (Search magnifying glass) */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Contact
              </Typography>
              <Autocomplete
                freeSolo
                fullWidth
                options={contactOptions}
                value={formData.contact_name}
                onInputChange={(e, newValue) => setFormData({ ...formData, contact_name: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    placeholder="Search or enter contact name"
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                      style: { fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' },
                    }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Account (Search magnifying glass) */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Account
              </Typography>
              <Autocomplete
                freeSolo
                fullWidth
                options={accountOptions}
                value={formData.account_name}
                onInputChange={(e, newValue) => setFormData({ ...formData, account_name: newValue || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    placeholder="Search or enter account business name"
                    InputProps={{
                      ...params.InputProps,
                      disableUnderline: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                        </InputAdornment>
                      ),
                      style: { fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' },
                    }}
                  />
                )}
              />
            </Box>
          </Box>

          {/* Status */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Status
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Deferred">Deferred</MenuItem>
                <MenuItem value="Waiting on someone else">Waiting on someone else</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Priority */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Priority
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              >
                <MenuItem value="Highest">Highest</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Reminder Toggle */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Reminder
              </Typography>
              <Switch
                checked={formData.reminder}
                onChange={(e) => setFormData({ ...formData, reminder: e.target.checked })}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0c1f54' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0c1f54' } }}
              />
            </Box>
          </Box>

          {/* Repeat Toggle */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Repeat
              </Typography>
              <Switch
                checked={formData.repeat_task}
                onChange={(e) => setFormData({ ...formData, repeat_task: e.target.checked })}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0c1f54' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0c1f54' } }}
              />
            </Box>
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', mt: 1 }}>
            Description Information
          </Typography>

          {/* Description */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b' }}>
                Description
              </Typography>
              <TextField
                multiline
                rows={3}
                variant="standard"
                placeholder="Enter task details or notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontSize: '0.9rem', color: '#0f172a' } }}
              />
            </Box>
          </Box>

          {/* Save / Cancel Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setOpenDrawer(false)}
              sx={{ textTransform: 'none', fontWeight: 700, color: '#64748b', borderColor: '#cbd5e1' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 800,
                bgcolor: '#0c1f54',
                color: '#ffffff',
                px: 3,
                '&:hover': { bgcolor: '#07153d' },
              }}
            >
              {formData.id ? 'Update Task' : 'Save Task'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0c1f54' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#334155' }}>
            Are you sure you want to delete this task? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ fontWeight: 700, color: '#64748b' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" sx={{ fontWeight: 800, bgcolor: '#ef4444', color: '#ffffff', '&:hover': { bgcolor: '#dc2626' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
