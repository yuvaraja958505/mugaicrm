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

export default function StateMaster() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ country_id: '', name: '', status: 'active' });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statesRes, countriesRes] = await Promise.all([
        api.get('/masters/states.php'),
        api.get('/masters/countries.php'),
      ]);
      setData(statesRes.data.data || []);
      const cList = countriesRes.data.data || [];
      setCountries(cList);
      if (cList.length > 0 && !formData.country_id) {
        setFormData((prev) => ({ ...prev, country_id: cList[0].id }));
      }
    } catch (err) {
      setError('Failed to fetch States data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setFormData({ country_id: countries[0]?.id || '', name: '', status: 'active' });
    setOpenDialog(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setFormData({ country_id: item.country_id, name: item.name, status: item.status });
    setOpenDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editItem) {
        await api.put('/masters/states.php', { ...formData, id: editItem.id });
        setSuccess('State updated.');
      } else {
        await api.post('/masters/states.php', formData);
        setSuccess('New State added.');
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save State.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this State?')) return;
    try {
      await api.delete(`/masters/states.php?id=${id}`);
      setSuccess('State deleted.');
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
            State Master
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage regional states linked to parent Countries
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenAdd}>
          Add State
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
                    <TableCell>State Name</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="caption" color="text.secondary">No States recorded yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>#{row.id}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                        <TableCell>{row.country_name || '-'}</TableCell>
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
          <DialogTitle sx={{ fontWeight: 800 }}>{editItem ? 'Edit State' : 'Add New State'}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Select Country"
                value={formData.country_id}
                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                required
                fullWidth
                size="small"
              >
                {countries.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="State Name"
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
            <Button type="submit" variant="contained">Save State</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
