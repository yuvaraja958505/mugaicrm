import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  Button,
  Drawer,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
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
} from '@mui/material';
import {
  Groups as MeetingsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Repeat as RepeatIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import api from '../api';

const getInitialFormData = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  return {
    id: null,
    title: 'New Meeting',
    venue: 'Client location',
    location: '',
    all_day: false,
    from_date: todayStr,
    from_time: '02:00',
    to_date: todayStr,
    to_time: '03:00',
    host_id: '',
    host_name: 'AJAY A',
    participants: 'None',
    related_to: 'None',
    repeat_frequency: 'None',
    description: '',
  };
};

const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return '-';
  try {
    const combinedStr = timeStr ? `${dateStr}T${timeStr}` : dateStr;
    const d = new Date(combinedStr);
    if (isNaN(d.getTime())) {
      return `${dateStr} ${timeStr || ''}`;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  } catch (e) {
    return `${dateStr} ${timeStr || ''}`;
  }
};

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Drawer / Form State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const [drawerError, setDrawerError] = useState('');

  // Participant Input Mode State
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [newParticipantText, setNewParticipantText] = useState('');

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings/index.php');
      setMeetings(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch meetings list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/index.php');
      setUsers(res.data.data || []);
    } catch (err) {
      // Handled silently
    }
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData(getInitialFormData());
    setDrawerError('');
    setAddingParticipant(false);
    setNewParticipantText('');
    setOpenDrawer(true);
  };

  const handleOpenEdit = (m) => {
    let from_date = '';
    let from_time = '';
    let to_date = '';
    let to_time = '';

    if (m.from_datetime) {
      const parts = m.from_datetime.split(' ');
      from_date = parts[0] || '';
      from_time = parts[1] ? parts[1].substring(0, 5) : '';
    }
    if (m.to_datetime) {
      const parts = m.to_datetime.split(' ');
      to_date = parts[0] || '';
      to_time = parts[1] ? parts[1].substring(0, 5) : '';
    }

    setFormData({
      id: m.id,
      title: m.title || '',
      venue: m.venue || 'Client location',
      location: m.location || '',
      all_day: Boolean(m.all_day),
      from_date,
      from_time,
      to_date,
      to_time,
      host_id: m.host_id || '',
      host_name: m.host_name || 'AJAY A',
      participants: m.participants || 'None',
      related_to: m.related_to || 'None',
      repeat_frequency: m.repeat_frequency || 'None',
      description: m.description || '',
    });
    setDrawerError('');
    setAddingParticipant(false);
    setNewParticipantText('');
    setOpenDrawer(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setDrawerError('');

    if (!formData.title.trim()) {
      setDrawerError('Meeting Title is required.');
      return;
    }
    if (!formData.from_date) {
      setDrawerError('From Date is required.');
      return;
    }
    if (!formData.to_date) {
      setDrawerError('To Date is required.');
      return;
    }

    const from_datetime = `${formData.from_date} ${formData.from_time || '00:00'}:00`;
    const to_datetime = `${formData.to_date} ${formData.to_time || '00:00'}:00`;

    const payload = {
      id: formData.id,
      title: formData.title,
      venue: formData.venue,
      location: formData.location,
      all_day: formData.all_day,
      from_datetime,
      to_datetime,
      host_id: formData.host_id,
      host_name: formData.host_name,
      participants: formData.participants,
      related_to: formData.related_to,
      repeat_frequency: formData.repeat_frequency,
      description: formData.description,
    };

    try {
      if (formData.id) {
        await api.put('/meetings/index.php', payload);
        setSuccess('Meeting updated successfully.');
      } else {
        await api.post('/meetings/index.php', payload);
        setSuccess('Meeting created successfully.');
      }
      setOpenDrawer(false);
      fetchMeetings();
    } catch (err) {
      setDrawerError(err.response?.data?.error || 'Failed to save meeting details.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/meetings/index.php?id=${deleteId}`);
      setSuccess('Meeting deleted successfully.');
      fetchMeetings();
    } catch (err) {
      setError('Failed to delete meeting.');
    } finally {
      setDeleteId(null);
    }
  };

  const handleAddParticipant = () => {
    if (!newParticipantText.trim()) return;
    let current = formData.participants;
    if (!current || current === 'None') {
      current = newParticipantText.trim();
    } else {
      current += `, ${newParticipantText.trim()}`;
    }
    setFormData({ ...formData, participants: current });
    setNewParticipantText('');
    setAddingParticipant(false);
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const q = search.toLowerCase();
      return (
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.venue && m.venue.toLowerCase().includes(q)) ||
        (m.host_name && m.host_name.toLowerCase().includes(q)) ||
        (m.participants && m.participants.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.related_to && m.related_to.toLowerCase().includes(q))
      );
    });
  }, [meetings, search]);

  return (
    <Box sx={{ pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MeetingsIcon sx={{ color: '#0c1f54', fontSize: 30 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54', letterSpacing: '-0.02em' }}>
              Meetings Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Manage client & internal team meeting information
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            placeholder="Search meetings..."
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
            Create Meeting
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: '8px' }}>{success}</Alert>}

      {/* Main Meetings Data Table */}
      <Card sx={{ border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: '#ffffff', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 1000 }} size="medium">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow sx={{ '& th': { fontWeight: 800, color: '#0c1f54', fontSize: '0.82rem', py: 1.8 } }}>
                <TableCell>Title</TableCell>
                <TableCell>Venue & Location</TableCell>
                <TableCell>All Day</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Participants</TableCell>
                <TableCell>Related To</TableCell>
                <TableCell>Repeat</TableCell>
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
              ) : filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No meetings found. Click "Create Meeting" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((m) => {
                  const fromParts = (m.from_datetime || '').split(' ');
                  const toParts = (m.to_datetime || '').split(' ');

                  return (
                    <TableRow key={m.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem' }}>
                        {m.title}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem' }}>
                            {m.venue || 'Client location'}
                          </Typography>
                          {m.location && (
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                              {m.location}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.all_day ? 'Yes' : 'No'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            height: 20,
                            bgcolor: m.all_day ? '#e0f2fe' : '#f1f5f9',
                            color: m.all_day ? '#0369a1' : '#64748b',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(fromParts[0], fromParts[1])}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(toParts[0], toParts[1])}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0c1f54', fontSize: '0.82rem' }}>
                        {m.host_name || 'AJAY A'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                        {m.participants || 'None'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                        {m.related_to || 'None'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                        {m.repeat_frequency || 'None'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: '#64748b', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.description || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Edit Meeting">
                            <IconButton size="small" onClick={() => handleOpenEdit(m)} sx={{ color: '#0c1f54' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Meeting">
                            <IconButton size="small" onClick={() => setDeleteId(m.id)} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Side Drawer: "Meeting Information" matching exact layout from screenshot */}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0c1f54' }}>
            Meeting Information
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
          {/* Title Field (Red indicator line) */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5, position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Title
              </Typography>
              <Box sx={{ width: 24, height: 3, bgcolor: '#ff5252', borderRadius: 1 }} />
              <TextField
                variant="standard"
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="New Meeting"
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              />
            </Box>
          </Box>

          {/* Meeting Venue Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Meeting Venue
              </Typography>
              <Box sx={{ width: 24, height: 3, bgcolor: '#ff5252', borderRadius: 1 }} />
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              >
                <MenuItem value="Client location">Client location</MenuItem>
                <MenuItem value="Office">Office</MenuItem>
                <MenuItem value="Online">Online</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Location Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Location
              </Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="Enter location address or link"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' } }}
              />
            </Box>
          </Box>

          {/* All day Checkbox */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                All day
              </Typography>
              <Checkbox
                checked={formData.all_day}
                onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
                size="small"
                sx={{ p: 0.5, color: '#cbd5e1', '&.Mui-checked': { color: '#0c1f54' } }}
              />
            </Box>
          </Box>

          {/* From Date & Time */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                From
              </Typography>
              <Box sx={{ width: 24, height: 3, bgcolor: '#ff5252', borderRadius: 1 }} />
              <TextField
                type="date"
                variant="standard"
                value={formData.from_date}
                onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
                sx={{ mr: 2 }}
              />
              <TextField
                type="time"
                variant="standard"
                value={formData.from_time}
                onChange={(e) => setFormData({ ...formData, from_time: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
              />
            </Box>
          </Box>

          {/* To Date & Time */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                To
              </Typography>
              <Box sx={{ width: 24, height: 3, bgcolor: '#ff5252', borderRadius: 1 }} />
              <TextField
                type="date"
                variant="standard"
                value={formData.to_date}
                onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
                sx={{ mr: 2 }}
              />
              <TextField
                type="time"
                variant="standard"
                value={formData.to_time}
                onChange={(e) => setFormData({ ...formData, to_time: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
              />
            </Box>
          </Box>

          {/* Host Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Host
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.host_name}
                onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
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

          {/* Participants Field (+ Add) */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Participants
              </Typography>

              {addingParticipant ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                  <TextField
                    variant="standard"
                    size="small"
                    placeholder="Enter participant name"
                    value={newParticipantText}
                    onChange={(e) => setNewParticipantText(e.target.value)}
                    InputProps={{ disableUnderline: true, style: { fontSize: '0.88rem' } }}
                    autoFocus
                  />
                  <IconButton size="small" onClick={handleAddParticipant} sx={{ color: '#16a34a' }}>
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setAddingParticipant(false)} sx={{ color: '#ef4444' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    {formData.participants || 'None'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon fontSize="small" />}
                    onClick={() => setAddingParticipant(true)}
                    sx={{
                      fontWeight: 800,
                      color: '#2563eb',
                      textTransform: 'none',
                      p: 0,
                      minWidth: 0,
                      fontSize: '0.9rem',
                      '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                    }}
                  >
                    Add
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Related To Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Related To
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.related_to}
                onChange={(e) => setFormData({ ...formData, related_to: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Contact">Contact</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
                <MenuItem value="Opportunity">Opportunity</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Repeat Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 120 }}>
                Repeat
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.repeat_frequency}
                onChange={(e) => setFormData({ ...formData, repeat_frequency: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Daily">Daily</MenuItem>
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Monthly">Monthly</MenuItem>
              </TextField>
              <IconButton size="small" sx={{ color: '#2563eb' }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Description Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b' }}>
                Description
              </Typography>
              <TextField
                multiline
                rows={3}
                variant="standard"
                placeholder="Add meeting notes, agenda, or remarks..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontSize: '0.9rem', color: '#0f172a' } }}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
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
              {formData.id ? 'Update Meeting' : 'Save Meeting'}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0c1f54' }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#334155' }}>
            Are you sure you want to delete this meeting entry? This action cannot be undone.
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
