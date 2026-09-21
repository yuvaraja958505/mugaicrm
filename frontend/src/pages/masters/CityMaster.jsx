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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function CityMaster() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ state_id: '', name: '', status: 'active' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [citiesRes, statesRes] = await Promise.all([
        api.get('/masters/cities.php'),
        api.get('/masters/states.php'),
      ]);
      setData(citiesRes.data.data || []);
      const sList = statesRes.data.data || [];
      setStates(sList);
      if (sList.length > 0 && !formData.state_id) {
        setFormData((prev) => ({ ...prev, state_id: sList[0].id }));
      }
    } catch (err) {
      setError('Failed to fetch Cities data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({ state_id: states[0]?.id || '', name: '', status: 'active' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setFormData({ state_id: item.state_id, name: item.name, status: item.status });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editItem) {
        await api.put('/masters/cities.php', { ...formData, id: editItem.id });
        setSuccess('City updated.');
      } else {
        await api.post('/masters/cities.php', formData);
        setSuccess('New City added.');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save City.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this City?')) return;
    try {
      await api.delete(`/masters/cities.php?id=${id}`);
      setSuccess('City deleted.');
      fetchData();
    } catch (err) {
      setError('Failed to delete.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/masters')} size="small" sx={{ border: '1px solid #e5e5e5' }}>
          <BackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            City Master
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage city locations linked to parent States
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add City
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} color="inherit" />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>City Name</TableCell>
                    <TableCell>State & Country</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="caption" color="text.secondary">No Cities recorded yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>#{row.id}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                        <TableCell>{row.state_name ? `${row.state_name}, ${row.country_name}` : '-'}</TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small" color={row.status === 'active' ? 'primary' : 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleOpenEdit(row)} color="inherit"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>{editItem ? 'Edit City' : 'Add New City'}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Select State"
                value={formData.state_id}
                onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                {states.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name} ({s.country_name})</MenuItem>
                ))}
              </TextField>

              <TextField
                label="City Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
                size="small"
              />

              <TextField
                select
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                fullWidth
                size="small"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Save City</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
