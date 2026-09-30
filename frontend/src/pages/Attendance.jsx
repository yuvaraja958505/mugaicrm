import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import api, { API_BASE_URL } from '../api';
import PunchDrawer from '../components/PunchDrawer';

export default function Attendance() {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [photoDialogUrl, setPhotoDialogUrl] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/index.php');
      setTodayRecord(res.data.today || null);
      setHistory(res.data.history || []);
    } catch (err) {
      setError('Failed to fetch attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const isPunchedIn = Boolean(todayRecord && todayRecord.punch_in_time);
  const isPunchedOut = Boolean(todayRecord && todayRecord.punch_out_time);

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54' }}>
            Attendance & Timesheets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={() => setDrawerOpen(true)}
            sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' }, px: 2.5 }}
          >
            Clock In / Clock Out
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Today's Status Banner Card */}
      <Card sx={{ mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54', mb: 2 }}>
            TODAY'S CLOCK STATUS ({new Date().toLocaleDateString()})
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, borderRadius: '6px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                    CLOCK IN TIME
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0c1f54' }}>
                    {isPunchedIn ? todayRecord.punch_in_time : 'Not Clocked In'}
                  </Typography>
                </Box>
                {isPunchedIn && todayRecord.punch_in_image && (
                  <Avatar
                    src={`${API_BASE_URL}/${todayRecord.punch_in_image}`}
                    variant="rounded"
                    sx={{ width: 40, height: 40, cursor: 'pointer' }}
                    onClick={() => setPhotoDialogUrl(`${API_BASE_URL}/${todayRecord.punch_in_image}`)}
                  />
                )}
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 2, borderRadius: '6px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                    CLOCK OUT TIME
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0c1f54' }}>
                    {isPunchedOut ? todayRecord.punch_out_time : 'Not Clocked Out'}
                  </Typography>
                </Box>
                {isPunchedOut && todayRecord.punch_out_image && (
                  <Avatar
                    src={`${API_BASE_URL}/${todayRecord.punch_out_image}`}
                    variant="rounded"
                    sx={{ width: 40, height: 40, cursor: 'pointer' }}
                    onClick={() => setPhotoDialogUrl(`${API_BASE_URL}/${todayRecord.punch_out_image}`)}
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance History Table */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0c1f54' }}>
              ATTENDANCE HISTORY LOGS
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Clock In</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>In Photo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Clock Out</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Out Photo</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={20} color="inherit" />
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography variant="caption" color="text.secondary">No logs recorded yet.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>{row.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">@{row.username}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{row.attendance_date}</TableCell>
                      <TableCell>{row.punch_in_time ? <Chip label={row.punch_in_time} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: '#0c1f54', color: '#0c1f54' }} /> : '-'}</TableCell>
                      <TableCell>
                        {row.punch_in_image ? (
                          <IconButton size="small" onClick={() => setPhotoDialogUrl(`${API_BASE_URL}/${row.punch_in_image}`)}>
                            <Avatar src={`${API_BASE_URL}/${row.punch_in_image}`} variant="rounded" sx={{ width: 32, height: 32 }} />
                          </IconButton>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{row.punch_out_time ? <Chip label={row.punch_out_time} size="small" variant="outlined" sx={{ fontWeight: 700, borderColor: '#0c1f54', color: '#0c1f54' }} /> : '-'}</TableCell>
                      <TableCell>
                        {row.punch_out_image ? (
                          <IconButton size="small" onClick={() => setPhotoDialogUrl(`${API_BASE_URL}/${row.punch_out_image}`)}>
                            <Avatar src={`${API_BASE_URL}/${row.punch_out_image}`} variant="rounded" sx={{ width: 32, height: 32 }} />
                          </IconButton>
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">{row.notes || '-'}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Jibble Style Right Punch Drawer */}
      <PunchDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onRefresh={fetchAttendance} />

      {/* Image Preview Modal */}
      <Dialog open={Boolean(photoDialogUrl)} onClose={() => setPhotoDialogUrl(null)} maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0c1f54' }}>
          Verification Proof Photo
          <IconButton onClick={() => setPhotoDialogUrl(null)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ textAlign: 'center', p: 2 }}>
          {photoDialogUrl && (
            <img src={photoDialogUrl} alt="Punch Proof" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '6px' }} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
