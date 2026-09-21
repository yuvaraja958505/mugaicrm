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
  Drawer,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContactPhone as ContactPhoneIcon,
  Call as CallIcon,
} from '@mui/icons-material';
import api from '../api';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [openDrawer, setOpenDrawer] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [drawerError, setDrawerError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    description: '',
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/contacts/index.php');
      setContacts(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch contacts list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleOpenAdd = () => {
    setEditItem(null);
    setDrawerError('');
    setFormData({ name: '', mobile: '', description: '' });
    setOpenDrawer(true);
  };

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setDrawerError('');
    setFormData({
      name: item.name,
      mobile: item.mobile,
      description: item.description || '',
    });
    setOpenDrawer(true);
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete contact "${item.name}" (${item.mobile})?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.delete(`/contacts/index.php?id=${item.id}`);
      setSuccess(`Contact "${item.name}" deleted successfully.`);
      fetchContacts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete contact.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDrawerError('');
    setError('');
    setSuccess('');
    try {
      if (editItem) {
        await api.put('/contacts/index.php', {
          id: editItem.id,
          ...formData,
        });
        setSuccess(`Contact "${formData.name}" updated successfully.`);
      } else {
        await api.post('/contacts/index.php', formData);
        setSuccess(`New contact "${formData.name}" added successfully.`);
      }
      setOpenDrawer(false);
      fetchContacts();
    } catch (err) {
      setDrawerError(err.response?.data?.error || `Failed to ${editItem ? 'update' : 'create'} contact.`);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.mobile || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ContactPhoneIcon sx={{ color: '#0c1f54', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54' }}>
              Contacts Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Centralized list of client and lead contact numbers
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' }, px: 2.5 }}
        >
          Add Contact
        </Button>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>{success}</Alert>}

      {/* Main Card with Search Bar & Table */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '12px' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <TextField
            placeholder="Search contacts by name, mobile, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            fullWidth
            sx={{ maxWidth: 420, bgcolor: '#ffffff' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#64748b' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

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
                    <TableCell sx={{ fontWeight: 800, color: '#0c1f54', py: 1.8, px: 2.5 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0c1f54', py: 1.8 }}>Contact Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0c1f54', py: 1.8 }}>Mobile Number</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#0c1f54', py: 1.8 }}>Description / Lead Info</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0c1f54', py: 1.8, px: 2.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No contacts found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((c) => (
                      <TableRow key={c.id} hover>
                        <TableCell sx={{ py: 1.8, px: 2.5 }}>#{c.id}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#0f172a', py: 1.8 }}>{c.name}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0c1f54', py: 1.8 }}>{c.mobile}</TableCell>
                        <TableCell color="text.secondary" sx={{ py: 1.8 }}>{c.description || '-'}</TableCell>
                        <TableCell align="right" sx={{ py: 1.8, px: 2.5 }}>
                          {/* Call Button */}
                          <Tooltip title={`Call ${c.name} (${c.mobile})`}>
                            <Button
                              component="a"
                              href={`tel:${c.mobile}`}
                              size="small"
                              variant="contained"
                              disableElevation
                              startIcon={<CallIcon fontSize="small" />}
                              sx={{
                                fontWeight: 700,
                                bgcolor: '#16a34a',
                                color: '#ffffff',
                                textTransform: 'none',
                                px: 1.8,
                                py: 0.3,
                                mr: 1,
                                borderRadius: '6px',
                                '&:hover': { bgcolor: '#15803d' },
                              }}
                            >
                              Call
                            </Button>
                          </Tooltip>

                          <Tooltip title="Edit Contact">
                            <IconButton size="small" onClick={() => handleOpenEdit(c)} sx={{ color: '#0c1f54', mr: 0.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Contact">
                            <IconButton size="small" onClick={() => handleDelete(c)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* Add / Edit Contact Side Popup Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440 },
            bgcolor: '#ffffff',
            boxShadow: '-4px 0 24px rgba(12, 31, 84, 0.15)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0c1f54' }}>
              {editItem ? `Edit Contact: ${editItem.name}` : 'Add New Contact'}
            </Typography>
            <IconButton onClick={() => setOpenDrawer(false)} size="small">
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
              label="Contact Name"
              placeholder="Full contact name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Mobile Number"
              placeholder="e.g. +91 9876543210"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Description"
              placeholder="Lead details, company, or remarks..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              size="small"
            />
          </Box>

          <Box sx={{ p: 2.5, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 1.5, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setOpenDrawer(false)} variant="outlined" color="inherit" sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' } }}>
              {editItem ? 'Update Contact' : 'Save Contact'}
            </Button>
          </Box>
        </form>
      </Drawer>
    </Box>
  );
}
