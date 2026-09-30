import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  TrendingUp as TrendingUpIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  EmojiEvents as WonIcon,
  BusinessCenter as BusinessIcon,
  Assignment as TaskIcon,
  Groups as MeetingIcon,
  ArrowForward as ArrowForwardIcon,
  Phone as PhoneIcon,
  CameraAlt as CameraIcon,
  NotificationsActive as NotificationIcon,
  Close as CloseIcon,
  Call as CallIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [openReminderDialog, setOpenReminderDialog] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/index.php');
      const dashData = res.data.data;
      setData(dashData);
      if (dashData?.reminder_followups && dashData.reminder_followups.length > 0) {
        setOpenReminderDialog(true);
      }
    } catch (err) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const metrics = data?.metrics || {};
  const leadSources = data?.lead_sources || [];
  const upcomingFollowups = data?.upcoming_followups || [];
  const reminderFollowups = data?.reminder_followups || [];
  const recentLeads = data?.recent_leads || [];

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'New':
        return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
      case 'In Progress':
        return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'Follow-Up Scheduled':
        return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
      case 'Won':
        return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
      case 'Lost':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
      case 'Not Interested':
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      default:
        return { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Top Banner Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.2 }}>
            Welcome back, <strong>{user?.full_name || 'User'}</strong>! ({user?.role?.toUpperCase() || 'SALES'})
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
          {reminderFollowups.length > 0 && (
            <Badge badgeContent={reminderFollowups.length} color="error">
              <Button
                variant="contained"
                startIcon={<NotificationIcon />}
                onClick={() => setOpenReminderDialog(true)}
                sx={{ fontWeight: 700, bgcolor: '#dc2626', color: '#ffffff', '&:hover': { bgcolor: '#b91c1c' }, px: 2 }}
              >
                Reminders ({reminderFollowups.length})
              </Button>
            </Badge>
          )}
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => navigate('/leads/add')}
            sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' }, px: 2 }}
          >
            + Create Lead
          </Button>
          <Button
            variant="outlined"
            startIcon={<CameraIcon />}
            onClick={() => navigate('/attendance')}
            sx={{ fontWeight: 700, borderColor: '#0c1f54', color: '#0c1f54', '&:hover': { bgcolor: '#f1f5f9' } }}
          >
            Punch In / Out
          </Button>
          <Button
            variant="outlined"
            startIcon={<EventIcon />}
            onClick={() => navigate('/followups')}
            sx={{ fontWeight: 700, borderColor: '#cbd5e1', color: '#334155', '&:hover': { bgcolor: '#f8fafc' } }}
          >
            Follow-Ups
          </Button>
        </Box>
      </Box>

      {/* Prominent Follow-Up Reminder Alert Banner */}
      {reminderFollowups.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '8px' }}>
          <CardContent sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: '#e11d48', color: '#ffffff', width: 40, height: 40 }}>
                <NotificationIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#9f1239' }}>
                  UPCOMING FOLLOW-UP REMINDER ({reminderFollowups.length} SCHEDULED)
                </Typography>
                <Typography variant="caption" sx={{ color: '#be123c', fontWeight: 600 }}>
                  You have <strong>{reminderFollowups.length}</strong> follow-up calls/meetings scheduled for Today or Tomorrow (1 day before reminder).
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              size="small"
              startIcon={<NotificationIcon />}
              onClick={() => setOpenReminderDialog(true)}
              sx={{ fontWeight: 800, bgcolor: '#e11d48', color: '#ffffff', '&:hover': { bgcolor: '#be123c' }, px: 2 }}
            >
              View Reminder Popup
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress size={32} sx={{ color: '#0c1f54' }} />
        </Box>
      ) : (
        <>
          {/* Top KPI Metrics Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 0.5 }}>
                      TOTAL LEADS
                    </Typography>
                    <Avatar sx={{ bgcolor: '#eff6ff', color: '#2563eb', width: 38, height: 38, borderRadius: '8px' }}>
                      <BusinessIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0c1f54', mb: 0.5 }}>
                    {metrics.total_leads || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Pipeline: <strong style={{ color: '#0c1f54' }}>₹{parseFloat(metrics.pipeline_value || 0).toLocaleString('en-IN')}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 0.5 }}>
                      DEALS WON
                    </Typography>
                    <Avatar sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 38, height: 38, borderRadius: '8px' }}>
                      <WonIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803d', mb: 0.5 }}>
                    {metrics.won_leads || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Closed Rev: <strong style={{ color: '#15803d' }}>₹{parseFloat(metrics.won_value || 0).toLocaleString('en-IN')}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 0.5 }}>
                      FOLLOW-UPS DUE
                    </Typography>
                    <Avatar sx={{ bgcolor: '#e0e7ff', color: '#4f46e5', width: 38, height: 38, borderRadius: '8px' }}>
                      <EventIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#3730a3', mb: 0.5 }}>
                    {metrics.followup_scheduled || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    In Progress: <strong style={{ color: '#b45309' }}>{metrics.in_progress_leads || 0}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', letterSpacing: 0.5 }}>
                      TODAY'S SCHEDULE
                    </Typography>
                    <Avatar sx={{ bgcolor: '#fef3c7', color: '#d97706', width: 38, height: 38, borderRadius: '8px' }}>
                      <MeetingIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#92400e', mb: 0.5 }}>
                    {metrics.today_meetings || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Pending Tasks: <strong style={{ color: '#0c1f54' }}>{metrics.pending_tasks || 0}</strong>
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Lead Pipeline Stages Summary Bar */}
          <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', mb: 2 }}>
                LEAD PIPELINE STAGES BREAKDOWN
              </Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#f0f9ff', border: '1px solid #bae6fd', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 800, display: 'block' }}>NEW</Typography>
                    <Typography variant="h6" sx={{ color: '#0284c7', fontWeight: 800 }}>{metrics.new_leads || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 800, display: 'block' }}>IN PROGRESS</Typography>
                    <Typography variant="h6" sx={{ color: '#d97706', fontWeight: 800 }}>{metrics.in_progress_leads || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#eef2ff', border: '1px solid #c7d2fe', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#3730a3', fontWeight: 800, display: 'block' }}>FOLLOW-UP</Typography>
                    <Typography variant="h6" sx={{ color: '#4f46e5', fontWeight: 800 }}>{metrics.followup_scheduled || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 800, display: 'block' }}>WON</Typography>
                    <Typography variant="h6" sx={{ color: '#16a34a', fontWeight: 800 }}>{metrics.won_leads || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#fef2f2', border: '1px solid #fca5a5', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 800, display: 'block' }}>LOST</Typography>
                    <Typography variant="h6" sx={{ color: '#dc2626', fontWeight: 800 }}>{metrics.lost_leads || 0}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ p: 1.5, borderRadius: '6px', bgcolor: '#f8fafc', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#475569', fontWeight: 800, display: 'block' }}>NOT INTERESTED</Typography>
                    <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 800 }}>{metrics.not_interested_leads || 0}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Main 2-Column Grid Area */}
          <Grid container spacing={3}>
            {/* Left Column: Upcoming Follow-ups & Recent Leads */}
            <Grid item xs={12} md={7}>
              {/* Upcoming Follow-Ups List */}
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54' }}>
                      UPCOMING FOLLOW-UPS
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/followups')}
                      sx={{ fontWeight: 700, color: '#0c1f54' }}
                    >
                      View All
                    </Button>
                  </Box>

                  {upcomingFollowups.length === 0 ? (
                    <Box sx={{ py: 3, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">No upcoming follow-ups scheduled.</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {upcomingFollowups.map((f) => {
                        const style = getStatusChipColor(f.status);
                        return (
                          <Box
                            key={f.id}
                            sx={{
                              p: 2,
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              bgcolor: '#ffffff',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 1,
                              '&:hover': { bgcolor: '#f8fafc' },
                            }}
                          >
                            <Box sx={{ minWidth: 180 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                                {f.name} {f.business_name ? `(${f.business_name})` : ''}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                📞 {f.contact}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                              <Chip
                                icon={<EventIcon sx={{ fontSize: 12 }} />}
                                label={f.next_followup_date || 'Set'}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                              />
                              {f.next_followup_time && (
                                <Chip
                                  icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                                  label={f.next_followup_time}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, borderColor: '#0c1f54', color: '#0c1f54' }}
                                />
                              )}
                              <Chip
                                label={f.status}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  bgcolor: style.bg,
                                  color: style.color,
                                  border: `1px solid ${style.border}`,
                                  height: 22,
                                  fontSize: '0.68rem',
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Recent Leads Added */}
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54' }}>
                      RECENT LEADS
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => navigate('/leads')}
                      sx={{ fontWeight: 700, color: '#0c1f54' }}
                    >
                      View Lead Master
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                          <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Lead / Business</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Contact</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Budget</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentLeads.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                              <Typography variant="caption" color="text.secondary">No leads created yet.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentLeads.map((l) => {
                            const style = getStatusChipColor(l.status);
                            return (
                              <TableRow key={l.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate('/leads')}>
                                <TableCell>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>{l.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{l.business_name}</Typography>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{l.contact}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>₹{parseFloat(l.expected_budget || 0).toLocaleString('en-IN')}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={l.status}
                                    size="small"
                                    sx={{
                                      fontWeight: 700,
                                      bgcolor: style.bg,
                                      color: style.color,
                                      border: `1px solid ${style.border}`,
                                      height: 22,
                                      fontSize: '0.68rem',
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column: Lead Sources & Quick Links */}
            <Grid item xs={12} md={5}>
              {/* Lead Sources Distribution */}
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', mb: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', mb: 2 }}>
                    LEAD SOURCE DISTRIBUTION
                  </Typography>

                  {leadSources.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No lead source data available.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                      {leadSources.map((ls, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0c1f54' }}>
                            {ls.source}
                          </Typography>
                          <Chip
                            label={`${ls.count} Leads`}
                            size="small"
                            sx={{ fontWeight: 800, bgcolor: '#0c1f54', color: '#ffffff', height: 22 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Quick Module Shortcuts */}
              <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', mb: 2 }}>
                    QUICK NAVIGATION
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/leads')}
                        sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, borderColor: '#cbd5e1', color: '#0c1f54', '&:hover': { bgcolor: '#f8fafc' } }}
                      >
                        <BusinessIcon />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Lead Master</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/followups')}
                        sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, borderColor: '#cbd5e1', color: '#0c1f54', '&:hover': { bgcolor: '#f8fafc' } }}
                      >
                        <EventIcon />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Follow-Ups</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/meetings')}
                        sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, borderColor: '#cbd5e1', color: '#0c1f54', '&:hover': { bgcolor: '#f8fafc' } }}
                      >
                        <MeetingIcon />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Meetings</Typography>
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/tasks')}
                        sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, borderColor: '#cbd5e1', color: '#0c1f54', '&:hover': { bgcolor: '#f8fafc' } }}
                      >
                        <TaskIcon />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>Tasks</Typography>
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* POPUP DIALOG FOR UPCOMING FOLLOW-UPS (1 DAY BEFORE & TODAY REMINDER) */}
      <Dialog
        open={openReminderDialog}
        onClose={() => setOpenReminderDialog(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '14px',
            border: '1px solid #fca5a5',
            maxHeight: '85vh',
            m: 2,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            bgcolor: '#fff1f2',
            color: '#9f1239',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            py: 2,
            px: 3,
            borderBottom: '1px solid #fecdd3',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <NotificationIcon sx={{ color: '#e11d48' }} />
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
              Follow-Up Reminders ({reminderFollowups.length})
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setOpenReminderDialog(false)} sx={{ color: '#9f1239' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 2 }}>
            The following follow-ups are scheduled for Today or Tomorrow (1 day before notification). Please connect with these clients!
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reminderFollowups.map((rem) => {
              const isToday = rem.due_badge === 'Today';
              const isTomorrow = rem.due_badge.includes('Tomorrow');
              const isOverdue = rem.due_badge === 'Overdue';

              let badgeBg = '#e0e7ff';
              let badgeColor = '#3730a3';
              if (isToday) {
                badgeBg = '#dcfce7';
                badgeColor = '#15803d';
              } else if (isTomorrow) {
                badgeBg = '#fef3c7';
                badgeColor = '#b45309';
              } else if (isOverdue) {
                badgeBg = '#fee2e2';
                badgeColor = '#b91c1c';
              }

              return (
                <Card
                  key={rem.id}
                  sx={{
                    border: '1px solid #cbd5e1',
                    boxShadow: 'none',
                    borderRadius: '8px',
                    bgcolor: '#ffffff',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#0c1f54', boxShadow: '0 2px 8px rgba(12, 31, 84, 0.08)' },
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0c1f54' }}>
                          {rem.name} {rem.business_name ? `(${rem.business_name})` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                          <CallIcon sx={{ fontSize: 13 }} /> {rem.contact} {rem.email ? `• ${rem.email}` : ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={rem.due_badge}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: badgeBg, color: badgeColor, height: 22, fontSize: '0.7rem' }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', my: 1 }}>
                      <Chip
                        icon={<EventIcon sx={{ fontSize: 12 }} />}
                        label={rem.next_followup_date || 'Set'}
                        size="small"
                        sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                      />
                      {rem.next_followup_time && (
                        <Chip
                          icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                          label={rem.next_followup_time}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.68rem', height: 22, borderColor: '#0c1f54', color: '#0c1f54' }}
                        />
                      )}
                    </Box>

                    {rem.notes && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          bgcolor: '#f8fafc',
                          p: 1,
                          borderRadius: '4px',
                          border: '1px solid #f1f5f9',
                          fontStyle: 'italic',
                          mt: 1,
                        }}
                      >
                        "{rem.notes}"
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: '1px solid #f1f5f9', justifyContent: 'space-between' }}>
          <Button
            onClick={() => setOpenReminderDialog(false)}
            sx={{ fontWeight: 700, color: '#64748b' }}
          >
            Dismiss / Got it
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenReminderDialog(false);
              navigate('/followups');
            }}
            startIcon={<EventIcon />}
            sx={{ fontWeight: 800, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' }, px: 2.5 }}
          >
            Go to Follow-Up Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
