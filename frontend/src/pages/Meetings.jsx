import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Grid,
  Autocomplete,
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
  NotificationsActive as NotificationsActiveIcon,
  History as HistoryIcon,
  VideoCall as VideoCallIcon,
  AssignmentTurnedIn as OutcomeIcon,
  Update as RescheduleIcon,
  OpenInNew as OpenInNewIcon,
  FilterList as FilterIcon,
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
    meeting_type: 'Client Meeting',
    status: 'Scheduled',
    reminder: '15 minutes',
    venue: 'Client location',
    location: '',
    online_link: '',
    all_day: false,
    from_date: todayStr,
    from_time: '14:00',
    to_date: todayStr,
    to_time: '15:00',
    host_id: '',
    host_name: 'AJAY A',
    participants: 'None',
    related_to: 'None',
    related_id: null,
    related_name: '',
    repeat_frequency: 'None',
    description: '',
    outcome_notes: '',
    next_action: '',
    next_followup_date: '',
    next_followup_time: '',
    reschedule_reason: '',
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

const getStatusChipStyle = (status) => {
  switch (status) {
    case 'In Progress':
      return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' };
    case 'Completed':
      return { bg: '#dcfce7', color: '#15803d', border: '#86efac' };
    case 'Cancelled':
      return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
    case 'Rescheduled':
      return { bg: '#f3e8ff', color: '#6b21a8', border: '#d8b4fe' };
    case 'Scheduled':
    default:
      return { bg: '#e0e7ff', color: '#3730a3', border: '#a5b4fc' };
  }
};

const getTypeChipStyle = (type) => {
  switch (type) {
    case 'Online Meeting':
      return { bg: '#e0f2fe', color: '#0369a1' };
    case 'Office Meeting':
      return { bg: '#f1f5f9', color: '#334155' };
    case 'Site Visit':
      return { bg: '#fef2f2', color: '#991b1b' };
    case 'Follow-up Meeting':
      return { bg: '#fdf4ff', color: '#86198f' };
    case 'Internal Meeting':
      return { bg: '#f0fdf4', color: '#166534' };
    case 'Client Meeting':
    default:
      return { bg: '#eff6ff', color: '#1e40af' };
  }
};

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  // Drawer / Form State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const [drawerError, setDrawerError] = useState('');

  // Reschedule Modal State
  const [rescheduleMeeting, setRescheduleMeeting] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    from_date: '',
    from_time: '10:00',
    to_date: '',
    to_time: '11:00',
    reason: '',
  });

  // History Log Modal State
  const [historyMeeting, setHistoryMeeting] = useState(null);
  const [meetingLogs, setMeetingLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
    } catch (err) {}
  };

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads/index.php');
      setLeads(res.data.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    fetchLeads();
  }, []);

  // Notifications calculation for upcoming meetings matching reminder window
  const activeReminders = useMemo(() => {
    const now = new Date();
    return meetings.filter((m) => {
      if (m.status === 'Completed' || m.status === 'Cancelled' || !m.from_datetime) return false;
      const mTime = new Date(m.from_datetime.replace(' ', 'T')).getTime();
      const diffMinutes = Math.floor((mTime - now.getTime()) / (1000 * 60));
      return diffMinutes >= -15 && diffMinutes <= 60; // Due within 1 hour or starting now
    });
  }, [meetings]);

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
      meeting_type: m.meeting_type || 'Client Meeting',
      status: m.status || 'Scheduled',
      reminder: m.reminder || '15 minutes',
      venue: m.venue || 'Client location',
      location: m.location || '',
      online_link: m.online_link || '',
      all_day: Boolean(m.all_day),
      from_date,
      from_time,
      to_date,
      to_time,
      host_id: m.host_id || '',
      host_name: m.host_name || 'AJAY A',
      participants: m.participants || 'None',
      related_to: m.related_to || 'None',
      related_id: m.related_id || null,
      related_name: m.related_name || '',
      repeat_frequency: m.repeat_frequency || 'None',
      description: m.description || '',
      outcome_notes: m.outcome_notes || '',
      next_action: m.next_action || '',
      next_followup_date: m.next_followup_date || '',
      next_followup_time: m.next_followup_time || '',
      reschedule_reason: m.reschedule_reason || '',
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
      ...formData,
      from_datetime,
      to_datetime,
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

  // Open Reschedule Modal
  const handleOpenReschedule = (m) => {
    const parts = (m.from_datetime || '').split(' ');
    setRescheduleMeeting(m);
    setRescheduleData({
      from_date: parts[0] || '',
      from_time: parts[1] ? parts[1].substring(0, 5) : '10:00',
      to_date: parts[0] || '',
      to_time: '11:00',
      reason: '',
    });
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleMeeting || !rescheduleData.from_date) return;
    try {
      const from_datetime = `${rescheduleData.from_date} ${rescheduleData.from_time || '10:00'}:00`;
      const to_datetime = `${rescheduleData.to_date || rescheduleData.from_date} ${rescheduleData.to_time || '11:00'}:00`;

      await api.put('/meetings/index.php', {
        id: rescheduleMeeting.id,
        status: 'Rescheduled',
        from_datetime,
        to_datetime,
        reschedule_reason: rescheduleData.reason,
      });

      setSuccess(`Meeting "${rescheduleMeeting.title}" successfully rescheduled.`);
      setRescheduleMeeting(null);
      fetchMeetings();
    } catch (err) {
      setError('Failed to reschedule meeting.');
    }
  };

  // Open History Log Modal
  const handleOpenHistory = async (m) => {
    setHistoryMeeting(m);
    setLoadingLogs(true);
    try {
      const res = await api.get(`/meetings/index.php?action=history&meeting_id=${m.id}`);
      setMeetingLogs(res.data.data || []);
    } catch (err) {
      setMeetingLogs([]);
    } finally {
      setLoadingLogs(false);
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
      const matchesSearch =
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.venue && m.venue.toLowerCase().includes(q)) ||
        (m.host_name && m.host_name.toLowerCase().includes(q)) ||
        (m.participants && m.participants.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.related_to && m.related_to.toLowerCase().includes(q)) ||
        (m.related_name && m.related_name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
      const matchesType = typeFilter === 'All' || m.meeting_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [meetings, search, statusFilter, typeFilter]);

  return (
    <Box sx={{ pb: 5 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MeetingsIcon sx={{ color: '#0c1f54', fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54', letterSpacing: '-0.02em' }}>
              Meetings Schedule
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Schedule, track, and record outcomes for all client & internal meetings
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 220, bgcolor: '#ffffff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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

      {/* Active Upcoming Meeting Reminders Banner */}
      {activeReminders.length > 0 && (
        <Alert
          severity="warning"
          icon={<NotificationsActiveIcon sx={{ color: '#b45309' }} />}
          sx={{ mb: 3, borderRadius: '10px', border: '1px solid #fcd34d', bgcolor: '#fffbeb' }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400e', mb: 0.5 }}>
            🔔 Live Meeting Reminders ({activeReminders.length} Upcoming / Starting Soon)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {activeReminders.map((r) => (
              <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  • <strong>{r.title}</strong> ({r.meeting_type}) at {r.from_datetime} (Host: {r.host_name})
                </Typography>
                {r.online_link && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<VideoCallIcon />}
                    href={r.online_link.startsWith('http') ? r.online_link : `https://${r.online_link}`}
                    target="_blank"
                    sx={{ py: 0.2, fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', borderColor: '#38bdf8' }}
                  >
                    Join Online Meeting
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: '8px' }}>{success}</Alert>}

      {/* Status & Type Filter Chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Status Filter:
        </Typography>
        {['All', 'Scheduled', 'In Progress', 'Completed', 'Rescheduled', 'Cancelled'].map((st) => (
          <Chip
            key={st}
            label={st}
            size="small"
            clickable
            onClick={() => setStatusFilter(st)}
            sx={{
              fontWeight: 700,
              fontSize: '0.78rem',
              bgcolor: statusFilter === st ? '#0c1f54' : '#ffffff',
              color: statusFilter === st ? '#ffffff' : '#475569',
              border: statusFilter === st ? '1px solid #0c1f54' : '1px solid #cbd5e1',
              '&:hover': { bgcolor: statusFilter === st ? '#07153d' : '#f8fafc' },
            }}
          />
        ))}

        <Box sx={{ width: 1, bgcolor: '#cbd5e1', height: 20, mx: 0.5 }} />

        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Type Filter:
        </Typography>
        {['All', 'Client Meeting', 'Online Meeting', 'Office Meeting', 'Site Visit', 'Follow-up Meeting', 'Internal Meeting'].map((tp) => (
          <Chip
            key={tp}
            label={tp}
            size="small"
            clickable
            onClick={() => setTypeFilter(tp)}
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              bgcolor: typeFilter === tp ? '#2563eb' : '#ffffff',
              color: typeFilter === tp ? '#ffffff' : '#475569',
              border: typeFilter === tp ? '1px solid #2563eb' : '1px solid #cbd5e1',
              '&:hover': { bgcolor: typeFilter === tp ? '#1d4ed8' : '#f8fafc' },
            }}
          />
        ))}
      </Box>

      {/* Main Meetings Data Table */}
      <Card sx={{ border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: '#ffffff', overflow: 'hidden' }}>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 1100 }} size="medium">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow sx={{ '& th': { fontWeight: 800, color: '#0c1f54', fontSize: '0.82rem', py: 1.8 } }}>
                <TableCell>Meeting Title & Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Venue & Location</TableCell>
                <TableCell>From Date/Time</TableCell>
                <TableCell>Host & Participants</TableCell>
                <TableCell>Related To</TableCell>
                <TableCell>Outcome / Next Action</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#0c1f54' }} />
                  </TableCell>
                </TableRow>
              ) : filteredMeetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#64748b' }}>
                    No meetings found. Click "Create Meeting" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMeetings.map((m) => {
                  const fromParts = (m.from_datetime || '').split(' ');
                  const stStyle = getStatusChipStyle(m.status);
                  const tpStyle = getTypeChipStyle(m.meeting_type);

                  return (
                    <TableRow key={m.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                            {m.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Chip
                              label={m.meeting_type || 'Client Meeting'}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 20,
                                bgcolor: tpStyle.bg,
                                color: tpStyle.color,
                              }}
                            />
                            {m.reminder && m.reminder !== 'None' && (
                              <Chip
                                icon={<NotificationsActiveIcon sx={{ fontSize: 11 }} />}
                                label={m.reminder}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20, borderColor: '#cbd5e1' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={m.status || 'Scheduled'}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            bgcolor: stStyle.bg,
                            color: stStyle.color,
                            border: `1px solid ${stStyle.border}`,
                          }}
                        />
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
                          {m.online_link && (
                            <Button
                              size="small"
                              startIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />}
                              href={m.online_link.startsWith('http') ? m.online_link : `https://${m.online_link}`}
                              target="_blank"
                              sx={{ p: 0, minWidth: 0, justifyContent: 'flex-start', fontSize: '0.72rem', fontWeight: 800, color: '#2563eb' }}
                            >
                              Join Meeting
                            </Button>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDateTime(fromParts[0], fromParts[1])}
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.82rem' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#0c1f54' }}>
                            Host: {m.host_name || 'AJAY A'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                            With: {m.participants || 'None'}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                        {m.related_to && m.related_to !== 'None' ? `${m.related_to}: ${m.related_name || ''}` : 'None'}
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.82rem', color: '#475569', maxWidth: 200 }}>
                        {m.outcome_notes ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CheckIcon sx={{ fontSize: 12 }} /> {m.outcome_notes}
                            </Typography>
                            {m.next_action && (
                              <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
                                Next: {m.next_action}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            No outcome recorded yet
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="Edit Meeting Details / Outcome">
                            <IconButton size="small" onClick={() => handleOpenEdit(m)} sx={{ color: '#0c1f54' }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Reschedule Meeting">
                            <IconButton size="small" onClick={() => handleOpenReschedule(m)} sx={{ color: '#6b21a8' }}>
                              <RescheduleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Meeting History Logs">
                            <IconButton size="small" onClick={() => handleOpenHistory(m)} sx={{ color: '#0284c7' }}>
                              <HistoryIcon fontSize="small" />
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
            width: { xs: '100%', sm: 580, md: 640 },
            boxSizing: 'border-box',
            bgcolor: '#ffffff',
            boxShadow: '-6px 0 30px rgba(0, 0, 0, 0.2)',
            p: 3.5,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 1.5, borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0c1f54' }}>
            {formData.id ? 'Edit Meeting Details' : 'Schedule New Meeting'}
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

        <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
          {/* Title Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Title
              </Typography>
              <Box sx={{ width: 24, height: 3, bgcolor: '#ff5252', borderRadius: 1 }} />
              <TextField
                variant="standard"
                fullWidth
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Meeting title..."
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' } }}
              />
            </Box>
          </Box>

          {/* Meeting Type */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Meeting Type
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.meeting_type}
                onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
              >
                <MenuItem value="Client Meeting">Client Meeting</MenuItem>
                <MenuItem value="Online Meeting">Online Meeting</MenuItem>
                <MenuItem value="Office Meeting">Office Meeting</MenuItem>
                <MenuItem value="Site Visit">Site Visit</MenuItem>
                <MenuItem value="Follow-up Meeting">Follow-up Meeting</MenuItem>
                <MenuItem value="Internal Meeting">Internal Meeting</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Meeting Status */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Meeting Status
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
              >
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="Rescheduled">Rescheduled</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Meeting Reminder */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Reminder Threshold
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.reminder}
                onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="5 minutes">5 minutes before</MenuItem>
                <MenuItem value="15 minutes">15 minutes before</MenuItem>
                <MenuItem value="30 minutes">30 minutes before</MenuItem>
                <MenuItem value="1 hour">1 hour before</MenuItem>
                <MenuItem value="1 day">1 day before</MenuItem>
              </TextField>
            </Box>
          </Box>

          {/* Meeting Venue & Online Link */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Venue
              </Typography>
              <TextField
                select
                variant="standard"
                fullWidth
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
              >
                <MenuItem value="Client location">Client location</MenuItem>
                <MenuItem value="Office">Office</MenuItem>
                <MenuItem value="Online">Online meeting (Meet / Zoom / Teams)</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Box>
          </Box>

          {(formData.venue === 'Online' || formData.meeting_type === 'Online Meeting' || formData.online_link) && (
            <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5, bgcolor: '#f0f9ff', p: 1.5, borderRadius: '6px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VideoCallIcon sx={{ color: '#0284c7' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369a1', minWidth: 130 }}>
                  Online Meeting Link
                </Typography>
                <TextField
                  variant="standard"
                  fullWidth
                  placeholder="Paste Google Meet, Zoom, or Teams URL..."
                  value={formData.online_link}
                  onChange={(e) => setFormData({ ...formData, online_link: e.target.value })}
                  InputProps={{ disableUnderline: true, style: { fontWeight: 600, color: '#0f172a', fontSize: '0.88rem' } }}
                />
              </Box>
            </Box>
          )}

          {/* Location Address */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Location / Address
              </Typography>
              <TextField
                variant="standard"
                fullWidth
                placeholder="Enter address or landmark..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' } }}
              />
            </Box>
          </Box>

          {/* From Date & Time */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                From Date & Time
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                To Date & Time
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
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

          {/* Participants */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
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
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
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
                      fontSize: '0.85rem',
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
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', minWidth: 140 }}>
                Related To
              </Typography>
              <TextField
                select
                variant="standard"
                value={formData.related_to}
                onChange={(e) => setFormData({ ...formData, related_to: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' } }}
                sx={{ width: 140 }}
              >
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Lead">Lead</MenuItem>
                <MenuItem value="Company">Company</MenuItem>
                <MenuItem value="Contact">Contact</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
              </TextField>

              {formData.related_to === 'Lead' && (
                <Autocomplete
                  size="small"
                  options={leads}
                  getOptionLabel={(opt) => `${opt.name} (${opt.contact})${opt.business_name ? ` - ${opt.business_name}` : ''}`}
                  value={leads.find((l) => l.id === formData.related_id) || null}
                  onChange={(e, val) =>
                    setFormData({
                      ...formData,
                      related_id: val ? val.id : null,
                      related_name: val ? `${val.name} (${val.business_name || val.contact})` : '',
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select lead..." variant="standard" size="small" fullWidth />
                  )}
                  sx={{ flexGrow: 1 }}
                />
              )}
            </Box>
          </Box>

          {/* Description Field */}
          <Box sx={{ borderBottom: '1px solid #e2e8f0', pb: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b' }}>
                Agenda / Description
              </Typography>
              <TextField
                multiline
                rows={2}
                variant="standard"
                placeholder="Add meeting agenda or notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                InputProps={{ disableUnderline: true, style: { fontSize: '0.9rem', color: '#0f172a' } }}
              />
            </Box>
          </Box>

          {/* Meeting Outcome, Next Action & Next Follow-Up Date (Auto-highlighted when Completed) */}
          <Box
            sx={{
              p: 2,
              borderRadius: '10px',
              border: formData.status === 'Completed' ? '2px solid #22c55e' : '1px solid #cbd5e1',
              bgcolor: formData.status === 'Completed' ? '#f0fdf4' : '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.8,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <OutcomeIcon sx={{ color: formData.status === 'Completed' ? '#15803d' : '#475569' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: formData.status === 'Completed' ? '#15803d' : '#1e293b' }}>
                Meeting Outcome & Follow-Up Actions
              </Typography>
            </Box>

            <TextField
              label="Meeting Discussion / Outcome Notes"
              multiline
              rows={2}
              placeholder="Record key discussions, client decisions, and meeting results..."
              value={formData.outcome_notes}
              onChange={(e) => setFormData({ ...formData, outcome_notes: e.target.value })}
              size="small"
              fullWidth
            />

            <TextField
              label="Next Action to be Taken"
              placeholder="What needs to be done next..."
              value={formData.next_action}
              onChange={(e) => setFormData({ ...formData, next_action: e.target.value })}
              size="small"
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                type="date"
                label="Next Follow-Up Date"
                InputLabelProps={{ shrink: true }}
                value={formData.next_followup_date}
                onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                type="time"
                label="Next Follow-Up Time"
                InputLabelProps={{ shrink: true }}
                value={formData.next_followup_time}
                onChange={(e) => setFormData({ ...formData, next_followup_time: e.target.value })}
                size="small"
                fullWidth
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 1 }}>
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

      {/* Reschedule Meeting Dialog Modal */}
      <Dialog open={Boolean(rescheduleMeeting)} onClose={() => setRescheduleMeeting(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', gap: 1 }}>
          <RescheduleIcon /> Reschedule Meeting
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
            Meeting: {rescheduleMeeting?.title}
          </Typography>

          <TextField
            type="date"
            label="New From Date"
            InputLabelProps={{ shrink: true }}
            value={rescheduleData.from_date}
            onChange={(e) => setRescheduleData({ ...rescheduleData, from_date: e.target.value, to_date: e.target.value })}
            size="small"
            fullWidth
            required
          />

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              type="time"
              label="New Start Time"
              InputLabelProps={{ shrink: true }}
              value={rescheduleData.from_time}
              onChange={(e) => setRescheduleData({ ...rescheduleData, from_time: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              type="time"
              label="New End Time"
              InputLabelProps={{ shrink: true }}
              value={rescheduleData.to_time}
              onChange={(e) => setRescheduleData({ ...rescheduleData, to_time: e.target.value })}
              size="small"
              fullWidth
            />
          </Box>

          <TextField
            label="Reason for Rescheduling"
            placeholder="e.g. Client requested postponement..."
            multiline
            rows={2}
            value={rescheduleData.reason}
            onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
            size="small"
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setRescheduleMeeting(null)} sx={{ fontWeight: 700, color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveReschedule}
            variant="contained"
            sx={{ fontWeight: 800, bgcolor: '#6b21a8', color: '#ffffff', '&:hover': { bgcolor: '#581c87' } }}
          >
            Confirm Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Log Modal */}
      <Dialog open={Boolean(historyMeeting)} onClose={() => setHistoryMeeting(null)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#f0f9ff', color: '#0369a1', display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon /> Meeting Activity & History Log
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3, maxHeight: '70vh' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
            {historyMeeting?.title} (Type: {historyMeeting?.meeting_type || 'Client Meeting'})
          </Typography>

          {loadingLogs ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : meetingLogs.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No previous history logs found for this meeting.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {meetingLogs.map((log, idx) => {
                let badgeBg = '#e0f2fe';
                let badgeColor = '#0369a1';
                if (log.action_type === 'Rescheduled') {
                  badgeBg = '#f3e8ff';
                  badgeColor = '#6b21a8';
                } else if (log.action_type === 'Completed') {
                  badgeBg = '#dcfce7';
                  badgeColor = '#15803d';
                } else if (log.action_type === 'Cancelled') {
                  badgeBg = '#fee2e2';
                  badgeColor = '#b91c1c';
                }

                return (
                  <Box
                    key={log.id || idx}
                    sx={{
                      p: 2,
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${badgeColor}`,
                      bgcolor: '#ffffff',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Chip
                        label={log.action_type}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.72rem', bgcolor: badgeBg, color: badgeColor }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        {log.created_at}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700, display: 'block', mb: 0.5 }}>
                      By: {log.user_name || 'System'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#0f172a', bgcolor: '#f8fafc', p: 1, borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                      {log.notes}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryMeeting(null)} sx={{ fontWeight: 700, color: '#0c1f54' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
