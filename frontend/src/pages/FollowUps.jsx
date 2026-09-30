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
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  Switch,
  FormControlLabel,
  Paper,
  Autocomplete,
  Avatar,
  Grid,
  Badge,
} from '@mui/material';
import {
  EventRepeat as FollowUpIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  PostAdd as PostAddIcon,
  Add as AddIcon,
  Call as CallIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Comment as ChatIcon,
  PendingActions as NextIcon,
  NotificationsActive as NotificationsActiveIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import api from '../api';

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getInitials = (name) => {
  if (!name) return 'L';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const parseNoteHeader = (rawNotes) => {
  if (!rawNotes) return null;
  const match = rawNotes.match(/^\[(.*?)\]\s*([\s\S]*)/);
  if (match) {
    const rawContent = match[2].split('-------------------')[0].trim();
    return {
      header: match[1],
      content: rawContent,
    };
  }
  return {
    header: null,
    content: rawNotes.split('-------------------')[0].trim(),
  };
};

export default function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  // Drawer State
  const [openDrawer, setOpenDrawer] = useState(false);
  const [isManualAdd, setIsManualAdd] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadHistory, setLeadHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  const [formData, setFormData] = useState({
    lead_id: '',
    next_followup_required: true,
    next_followup_date: getTodayString(),
    next_followup_time: '',
    notes: '',
    status: 'In Progress',
  });

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/followup/index.php');
      setFollowups(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch follow-ups list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLeads = async () => {
    try {
      const res = await api.get('/followup/index.php?all_leads=1');
      setAllLeads(res.data.data || []);
    } catch (err) {
      // Handled silently
    }
  };

  useEffect(() => {
    fetchFollowups();
    fetchAllLeads();
  }, []);

  const fetchHistoryForLead = async (leadId) => {
    if (!leadId) {
      setLeadHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await api.get(`/followup/index.php?lead_id=${leadId}`);
      setLeadHistory(res.data.data || []);
    } catch (err) {
      setLeadHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [activeTab, setActiveTab] = useState('all');

  // Categorize follow-ups into 4 distinct sections: Yesterday, Today, Tomorrow (1-Day Reminder), Upcoming
  const { yesterdayFollowups, todayFollowups, tomorrowFollowups, upcomingFollowups } = useMemo(() => {
    const q = search.toLowerCase();
    const todayStr = getTodayString();
    const tomorrowStr = getTomorrowString();

    const filtered = followups.filter((f) => {
      return (
        (f.name || '').toLowerCase().includes(q) ||
        (f.contact || '').toLowerCase().includes(q) ||
        (f.business_name || '').toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q)
      );
    });

    const yesterday = [];
    const today = [];
    const tomorrow = [];
    const upcoming = [];

    filtered.forEach((f) => {
      if (!f.next_followup_date || f.next_followup_date < todayStr) {
        yesterday.push(f);
      } else if (f.next_followup_date === todayStr) {
        today.push(f);
      } else if (f.next_followup_date === tomorrowStr) {
        tomorrow.push(f);
      } else {
        upcoming.push(f);
      }
    });

    return {
      yesterdayFollowups: yesterday,
      todayFollowups: today,
      tomorrowFollowups: tomorrow,
      upcomingFollowups: upcoming,
    };
  }, [followups, search]);

  const handleOpenEdit = (lead) => {
    setIsManualAdd(false);
    setSelectedLead(lead);
    setLeadHistory(lead.history || []);
    setDrawerError('');
    setFormData({
      lead_id: lead.id,
      next_followup_required: Boolean(lead.next_followup_required),
      next_followup_date: lead.next_followup_date || getTodayString(),
      next_followup_time: lead.next_followup_time || '',
      notes: '',
      status: lead.status || 'In Progress',
    });
    setOpenDrawer(true);
  };

  const handleOpenManualAdd = () => {
    setIsManualAdd(true);
    setSelectedLead(null);
    setLeadHistory([]);
    setDrawerError('');
    setFormData({
      lead_id: '',
      next_followup_required: true,
      next_followup_date: getTodayString(),
      next_followup_time: '',
      notes: '',
      status: 'In Progress',
    });
    setOpenDrawer(true);
  };

  const handleLeadSelectInDrawer = (leadObj) => {
    if (leadObj) {
      setSelectedLead(leadObj);
      setFormData((prev) => ({
        ...prev,
        lead_id: leadObj.id,
        status: leadObj.status || 'In Progress',
        next_followup_date: leadObj.next_followup_date || getTodayString(),
        next_followup_time: leadObj.next_followup_time || '',
      }));
      fetchHistoryForLead(leadObj.id);
    } else {
      setSelectedLead(null);
      setLeadHistory([]);
      setFormData((prev) => ({ ...prev, lead_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDrawerError('');
    setError('');
    setSuccess('');

    if (!formData.lead_id) {
      setDrawerError('Please select a lead for this follow-up.');
      return;
    }

    try {
      await api.post('/followup/index.php', {
        id: formData.lead_id,
        ...formData,
      });
      setSuccess(`Follow-up saved for ${selectedLead?.name || 'Lead'}.`);
      setOpenDrawer(false);
      fetchFollowups();
      fetchAllLeads();
    } catch (err) {
      setDrawerError(err.response?.data?.error || 'Failed to save follow-up details.');
    }
  };

  const renderFollowupItem = (f, categoryKey) => {
    const historyLogs = f.history || [];
    const noteObj = parseNoteHeader(f.notes);
    const isTomorrow = categoryKey === 'tomorrow' || f.next_followup_date === getTomorrowString();
    const isToday = categoryKey === 'today' || f.next_followup_date === getTodayString();
    const isYesterday = categoryKey === 'yesterday' || (f.next_followup_date && f.next_followup_date < getTodayString());

    let avatarBg = '#0c1f54';
    let cardBorderLeft = '3px solid #0c1f54';
    let cardBg = '#ffffff';

    if (isTomorrow) {
      avatarBg = '#d97706';
      cardBorderLeft = '3px solid #d97706';
      cardBg = '#fffdfa';
    } else if (isToday) {
      avatarBg = '#16a34a';
      cardBorderLeft = '3px solid #16a34a';
    } else if (isYesterday) {
      avatarBg = '#ef4444';
      cardBorderLeft = '3px solid #ef4444';
      cardBg = '#fff5f5';
    } else {
      avatarBg = '#2563eb';
      cardBorderLeft = '3px solid #2563eb';
    }

    return (
      <Box
        key={f.id}
        sx={{
          p: 2,
          px: 2.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.2,
          borderBottom: '1px solid #f1f5f9',
          bgcolor: cardBg,
          borderLeft: cardBorderLeft,
        }}
      >
        {/* Top Header: Lead Info & Update button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: avatarBg, width: 34, height: 34, fontSize: '0.85rem', fontWeight: 700 }}>
              {(f.name || 'L').charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', lineHeight: 1.2 }}>
                {f.name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {f.business_name ? `${f.business_name} • ` : ''}{f.contact}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditIcon sx={{ fontSize: 14 }} />}
              onClick={() => handleOpenEdit(f)}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                color: '#0c1f54',
                borderColor: '#cbd5e1',
                '&:hover': { borderColor: '#0c1f54', bgcolor: '#f8fafc' }
              }}
            >
              Update
            </Button>
          </Box>
        </Box>

        {/* Date & Time Chips Line */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
          <Chip
            icon={isYesterday ? <WarningIcon sx={{ fontSize: 12 }} /> : isTomorrow ? <NotificationsActiveIcon sx={{ fontSize: 12 }} /> : <EventIcon sx={{ fontSize: 12 }} />}
            label={f.next_followup_date || 'Not set'}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 800,
              bgcolor: isYesterday ? '#ef4444' : isTomorrow ? '#d97706' : '#0c1f54',
              color: '#ffffff',
              '& .MuiChip-icon': { color: '#ffffff' },
            }}
          />

          {f.next_followup_time && (
            <Chip
              icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
              label={f.next_followup_time}
              size="small"
              variant="outlined"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 800,
                borderColor: isYesterday ? '#ef4444' : isTomorrow ? '#d97706' : '#0c1f54',
                color: isYesterday ? '#ef4444' : isTomorrow ? '#d97706' : '#0c1f54',
              }}
            />
          )}

          {/* Category Trigger Badge */}
          {isTomorrow && (
            <Chip
              icon={<NotificationsActiveIcon sx={{ fontSize: 12 }} />}
              label="🔔 REMINDER: 1 DAY BEFORE"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.66rem',
                fontWeight: 900,
                bgcolor: '#fffbeb',
                color: '#b45309',
                border: '1px solid #fde68a',
                '& .MuiChip-icon': { color: '#b45309' },
              }}
            />
          )}
          {isToday && (
            <Chip
              label="DUE TODAY"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.66rem',
                fontWeight: 900,
                bgcolor: '#f0fdf4',
                color: '#15803d',
                border: '1px solid #bbf7d0',
              }}
            />
          )}
          {isYesterday && (
            <Chip
              label="OVERDUE (YESTERDAY)"
              size="small"
              sx={{
                height: 22,
                fontSize: '0.66rem',
                fontWeight: 900,
                bgcolor: '#fef2f2',
                color: '#ef4444',
                border: '1px solid #fca5a5',
              }}
            />
          )}

          {historyLogs.length > 0 && (
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem' }}>
              • {historyLogs.length} Log{historyLogs.length > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Discussion Note Snippet Preview Line */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.6, bgcolor: '#f8fafc', p: 1, px: 1.2, borderRadius: '6px', borderLeft: cardBorderLeft }}>
          <ChatIcon sx={{ fontSize: 14, color: '#64748b', mt: 0.2, flexShrink: 0 }} />
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.82rem',
              color: '#334155',
              fontWeight: 500,
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {noteObj && noteObj.content ? noteObj.content : 'No discussion remarks recorded yet.'}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Top Header Bar & Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FollowUpIcon sx={{ color: '#0c1f54', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54', letterSpacing: '-0.02em' }}>
              Lead Follow-Up
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              Categorized sections for Yesterday, Today, Tomorrow (1-Day Reminder), and Upcoming
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TextField
            placeholder="Search follow-ups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 240, bgcolor: '#ffffff', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
            onClick={handleOpenManualAdd}
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
            Add Follow-Up
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3, borderRadius: '8px' }}>{success}</Alert>}

      {/* Category Filter Pills / Tabs */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant={activeTab === 'all' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('all')}
          sx={{
            fontWeight: 800,
            borderRadius: '20px',
            textTransform: 'none',
            bgcolor: activeTab === 'all' ? '#0c1f54' : '#ffffff',
            color: activeTab === 'all' ? '#ffffff' : '#334155',
            borderColor: '#cbd5e1',
          }}
        >
          All Sections
        </Button>

        <Button
          size="small"
          variant={activeTab === 'tomorrow' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('tomorrow')}
          startIcon={<NotificationsActiveIcon sx={{ fontSize: 16 }} />}
          sx={{
            fontWeight: 800,
            borderRadius: '20px',
            textTransform: 'none',
            bgcolor: activeTab === 'tomorrow' ? '#d97706' : '#ffffff',
            color: activeTab === 'tomorrow' ? '#ffffff' : '#b45309',
            borderColor: '#fde68a',
            '&:hover': { bgcolor: activeTab === 'tomorrow' ? '#b45309' : '#fffbeb' },
          }}
        >
          Tomorrow (1-Day Reminder) ({tomorrowFollowups.length})
        </Button>

        <Button
          size="small"
          variant={activeTab === 'today' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('today')}
          startIcon={<EventIcon sx={{ fontSize: 16 }} />}
          sx={{
            fontWeight: 800,
            borderRadius: '20px',
            textTransform: 'none',
            bgcolor: activeTab === 'today' ? '#16a34a' : '#ffffff',
            color: activeTab === 'today' ? '#ffffff' : '#15803d',
            borderColor: '#bbf7d0',
            '&:hover': { bgcolor: activeTab === 'today' ? '#15803d' : '#f0fdf4' },
          }}
        >
          Today ({todayFollowups.length})
        </Button>

        <Button
          size="small"
          variant={activeTab === 'upcoming' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('upcoming')}
          startIcon={<NextIcon sx={{ fontSize: 16 }} />}
          sx={{
            fontWeight: 800,
            borderRadius: '20px',
            textTransform: 'none',
            bgcolor: activeTab === 'upcoming' ? '#3730a3' : '#ffffff',
            color: activeTab === 'upcoming' ? '#ffffff' : '#3730a3',
            borderColor: '#c7d2fe',
            '&:hover': { bgcolor: activeTab === 'upcoming' ? '#312e81' : '#eef2ff' },
          }}
        >
          Upcoming ({upcomingFollowups.length})
        </Button>

        <Button
          size="small"
          variant={activeTab === 'yesterday' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('yesterday')}
          startIcon={<WarningIcon sx={{ fontSize: 16 }} />}
          sx={{
            fontWeight: 800,
            borderRadius: '20px',
            textTransform: 'none',
            bgcolor: activeTab === 'yesterday' ? '#ef4444' : '#ffffff',
            color: activeTab === 'yesterday' ? '#ffffff' : '#b91c1c',
            borderColor: '#fca5a5',
            '&:hover': { bgcolor: activeTab === 'yesterday' ? '#dc2626' : '#fff5f5' },
          }}
        >
          Yesterday / Overdue ({yesterdayFollowups.length})
        </Button>
      </Box>

      {/* 4 Categorized Sections Grid Layout */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={30} sx={{ color: '#0c1f54' }} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Section 1: Tomorrow (1-Day Reminder System Triggered) */}
          {(activeTab === 'all' || activeTab === 'tomorrow') && (
            <Grid item xs={12} md={activeTab === 'all' ? 6 : 12}>
              <Card sx={{ border: '1px solid #fde68a', borderRadius: '14px', boxShadow: '0 4px 20px rgba(217, 119, 6, 0.05)', bgcolor: '#ffffff', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#fffbeb', borderBottom: '1px solid #fde68a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon sx={{ color: '#d97706', fontSize: 22 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#b45309', lineHeight: 1.2 }}>
                        Tomorrow (1-Day Reminder)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 600 }}>
                        Triggered 1 day before scheduled follow-up
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={tomorrowFollowups.length}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#fef3c7', color: '#b45309', height: 22 }}
                  />
                </Box>

                <CardContent sx={{ p: 0, flexGrow: 1, overflowY: 'auto', maxHeight: 600 }}>
                  {tomorrowFollowups.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No follow-ups scheduled for tomorrow.
                      </Typography>
                    </Box>
                  ) : (
                    tomorrowFollowups.map((f) => renderFollowupItem(f, 'tomorrow'))
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Section 2: Today's Follow-Ups */}
          {(activeTab === 'all' || activeTab === 'today') && (
            <Grid item xs={12} md={activeTab === 'all' ? 6 : 12}>
              <Card sx={{ border: '1px solid #bbf7d0', borderRadius: '14px', boxShadow: '0 4px 20px rgba(22, 163, 74, 0.05)', bgcolor: '#ffffff', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EventIcon sx={{ color: '#16a34a', fontSize: 22 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#15803d', lineHeight: 1.2 }}>
                        Today's Follow-Ups
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600 }}>
                        Scheduled for connect today ({getTodayString()})
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={todayFollowups.length}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', height: 22 }}
                  />
                </Box>

                <CardContent sx={{ p: 0, flexGrow: 1, overflowY: 'auto', maxHeight: 600 }}>
                  {todayFollowups.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No follow-ups scheduled for today.
                      </Typography>
                    </Box>
                  ) : (
                    todayFollowups.map((f) => renderFollowupItem(f, 'today'))
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Section 3: Upcoming Follow-Ups */}
          {(activeTab === 'all' || activeTab === 'upcoming') && (
            <Grid item xs={12} md={activeTab === 'all' ? 6 : 12}>
              <Card sx={{ border: '1px solid #c7d2fe', borderRadius: '14px', boxShadow: '0 4px 20px rgba(37, 99, 235, 0.05)', bgcolor: '#ffffff', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#eef2ff', borderBottom: '1px solid #c7d2fe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NextIcon sx={{ color: '#3730a3', fontSize: 22 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#3730a3', lineHeight: 1.2 }}>
                        Upcoming (Future)
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#3730a3', fontWeight: 600 }}>
                        Future scheduled follow-ups
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={upcomingFollowups.length}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#e0e7ff', color: '#3730a3', height: 22 }}
                  />
                </Box>

                <CardContent sx={{ p: 0, flexGrow: 1, overflowY: 'auto', maxHeight: 600 }}>
                  {upcomingFollowups.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No future upcoming follow-ups.
                      </Typography>
                    </Box>
                  ) : (
                    upcomingFollowups.map((f) => renderFollowupItem(f, 'upcoming'))
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Section 4: Yesterday / Overdue Follow-Ups */}
          {(activeTab === 'all' || activeTab === 'yesterday') && (
            <Grid item xs={12} md={activeTab === 'all' ? 6 : 12}>
              <Card sx={{ border: '1px solid #fca5a5', borderRadius: '14px', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.05)', bgcolor: '#ffffff', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#fff5f5', borderBottom: '1px solid #fca5a5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon sx={{ color: '#ef4444', fontSize: 22 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#b91c1c', lineHeight: 1.2 }}>
                        Yesterday / Overdue
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                        Missed or past follow-up tasks
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={yesterdayFollowups.length}
                    size="small"
                    sx={{ fontWeight: 800, bgcolor: '#fef2f2', color: '#b91c1c', height: 22 }}
                  />
                </Box>

                <CardContent sx={{ p: 0, flexGrow: 1, overflowY: 'auto', maxHeight: 600 }}>
                  {yesterdayFollowups.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        No missed or overdue follow-ups! Great job 🎉
                      </Typography>
                    </Box>
                  ) : (
                    yesterdayFollowups.map((f) => renderFollowupItem(f, 'yesterday'))
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Add / Update Follow-Up Side Popup Drawer */}
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
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box
            sx={{
              p: 2.5,
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #e2e8f0',
              bgcolor: '#f8fafc',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0c1f54' }}>
                {isManualAdd ? 'Add Manual Follow-Up' : 'Update Follow-Up'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {selectedLead ? `${selectedLead.name} (${selectedLead.contact})` : 'Select lead and schedule follow-up'}
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenDrawer(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Form Body */}
          <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {drawerError && (
              <Alert severity="error" onClose={() => setDrawerError('')} sx={{ fontWeight: 600 }}>
                {drawerError}
              </Alert>
            )}

            {/* Select Lead (Dropdown for Manual Add mode) */}
            {isManualAdd ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 0.6 }}>
                  Select Lead <span style={{ color: '#e53e3e' }}>*</span>
                </Typography>
                <Autocomplete
                  size="small"
                  options={allLeads}
                  getOptionLabel={(option) => `${option.name} (${option.contact})${option.business_name ? ` - ${option.business_name}` : ''}`}
                  value={selectedLead}
                  onChange={(e, val) => handleLeadSelectInDrawer(val)}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search lead by name or mobile number..."
                      size="small"
                      fullWidth
                      required
                    />
                  )}
                />
              </Box>
            ) : null}

            {/* Schedule Section Box */}
            <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '8px', p: 2, bgcolor: '#ffffff' }}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={formData.next_followup_required}
                    onChange={(e) => setFormData({ ...formData, next_followup_required: e.target.checked })}
                  />
                }
                label={
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0c1f54' }}>
                    Schedule Next Follow-Up
                  </Typography>
                }
              />

              {formData.next_followup_required && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
                  <TextField
                    type="date"
                    label="Date"
                    InputLabelProps={{ shrink: true }}
                    value={formData.next_followup_date || ''}
                    onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    type="time"
                    label="Time"
                    InputLabelProps={{ shrink: true }}
                    value={formData.next_followup_time || ''}
                    onChange={(e) => setFormData({ ...formData, next_followup_time: e.target.value })}
                    fullWidth
                    size="small"
                  />
                </Box>
              )}
            </Box>

            <TextField
              select
              label="Lead Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              fullWidth
              size="small"
            >
              <MenuItem value="New">New</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Follow-Up Scheduled">Follow-Up Scheduled</MenuItem>
              <MenuItem value="Won">Won</MenuItem>
              <MenuItem value="Lost">Lost</MenuItem>
              <MenuItem value="Not Interested">Not Interested</MenuItem>
            </TextField>

            {/* New Note Input Field */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0c1f54', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <PostAddIcon sx={{ fontSize: 18, color: '#0c1f54' }} /> Add Follow-Up Note & Remarks
              </Typography>
              <TextField
                placeholder="Type new discussion remarks for this follow-up call/meeting..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                fullWidth
                size="small"
                required
              />
            </Box>

            {/* Previous Follow-Up History Timeline */}
            {loadingHistory ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : leadHistory.length > 0 ? (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <HistoryIcon sx={{ fontSize: 18, color: '#64748b' }} /> Previous Follow-Up History ({leadHistory.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                  {leadHistory.map((log) => (
                    <Paper
                      key={log.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: '#f8fafc',
                        borderColor: '#e2e8f0',
                        borderRadius: '8px',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0c1f54' }}>
                          👤 {log.creator_name || 'System User'} • {log.created_at}
                        </Typography>
                        {log.status && (
                          <Chip label={log.status} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ fontSize: '0.82rem', color: '#334155', whiteSpace: 'pre-line' }}>
                        {log.notes}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>
            ) : selectedLead ? (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No previous follow-up history logs recorded for this lead yet.
              </Typography>
            ) : null}
          </Box>

          {/* Drawer Actions */}
          <Box
            sx={{
              p: 2.5,
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justify: 'flex-end',
              gap: 1.5,
              bgcolor: '#f8fafc',
            }}
          >
            <Button onClick={() => setOpenDrawer(false)} variant="outlined" color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                fontWeight: 700,
                bgcolor: '#0c1f54',
                color: '#ffffff',
                '&:hover': { bgcolor: '#07153d' },
              }}
            >
              Save Follow-Up
            </Button>
          </Box>
        </form>
      </Drawer>
    </Box>
  );
}
