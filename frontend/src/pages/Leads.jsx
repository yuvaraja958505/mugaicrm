import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Event as EventIcon,
  AccessTime as AccessTimeIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import api from '../api';

export default function Leads() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lookup options for filtering
  const [domains, setDomains] = useState([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads/index.php');
      setLeads(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch leads.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const dRes = await api.get('/masters/domains.php');
      setDomains(dRes.data.data || []);
    } catch (err) {
      console.error('Failed to load domains lookup');
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchLookups();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.delete(`/leads/index.php?id=${id}`);
      setSuccess('Lead deleted successfully.');
      fetchLeads();
    } catch (err) {
      setError('Failed to delete lead.');
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.name || '').toLowerCase().includes(searchLower) ||
      (lead.business_name || '').toLowerCase().includes(searchLower) ||
      (lead.contact || '').toLowerCase().includes(searchLower) ||
      (lead.email || '').toLowerCase().includes(searchLower) ||
      (lead.website || '').toLowerCase().includes(searchLower) ||
      (lead.interested_domain || '').toLowerCase().includes(searchLower) ||
      (lead.lead_source || '').toLowerCase().includes(searchLower) ||
      (lead.owner_name || '').toLowerCase().includes(searchLower);

    const matchesDomain = domainFilter ? lead.domain_id == domainFilter : true;
    const matchesStatus = statusFilter ? lead.status === statusFilter : true;

    return matchesSearch && matchesDomain && matchesStatus;
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#000000' }}>
            Lead Master
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/leads/add')}
            sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', px: 2.5, '&:hover': { bgcolor: '#07153d' } }}
          >
            Create New Client Lead
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Search & Filter Bar */}
      <Card sx={{ mb: 2.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
        <CardContent sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <TextField
            placeholder="Search leads by name, email, owner, source, website, contact, or business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />,
            }}
            size="small"
            sx={{ flexGrow: 1, minWidth: 280 }}
          />

          <TextField
            select
            label="Domain Filter"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">All Domains</MenuItem>
            {domains.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Follow-Up Scheduled">Follow-Up Scheduled</MenuItem>
            <MenuItem value="Won">Won</MenuItem>
            <MenuItem value="Lost">Lost</MenuItem>
            <MenuItem value="Not Interested">Not Interested</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {/* Lead Master Data Table */}
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
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Lead / Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Lead Owner</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Business & Domain</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Required Services</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Budgets</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Next Follow-Up</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0c1f54' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0c1f54' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">No leads recorded yet. Click "Create New Client Lead" to add one.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>{lead.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 12 }} /> {lead.contact}
                          </Typography>
                          {lead.email && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              ✉ {lead.email}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={lead.owner_name || 'Unassigned'}
                            size="small"
                            sx={{ fontWeight: 700, bgcolor: '#e0e7ff', color: '#0c1f54', fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{lead.business_name}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Domain: {lead.domain_name || 'Unassigned'}
                          </Typography>
                          {lead.interested_domain && (
                            <Typography variant="caption" color="primary.main" display="block" sx={{ fontWeight: 600 }}>
                              Int. Domain: {lead.interested_domain}
                            </Typography>
                          )}
                          {lead.website && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              🌐 {lead.website}
                            </Typography>
                          )}
                          {lead.lead_source && (
                            <Chip
                              label={`Source: ${lead.lead_source}`}
                              size="small"
                              variant="outlined"
                              sx={{ mt: 0.5, fontSize: '0.65rem', height: 18 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{lead.city_name ? `${lead.city_name}, ${lead.state_name}` : lead.address || '-'}</Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {lead.required_services && lead.required_services.length > 0 ? (
                              lead.required_services.map((svc) => (
                                <Chip key={svc} label={svc} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">None</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" display="block">Exp: <strong>₹{parseFloat(lead.expected_budget || 0).toLocaleString('en-IN')}</strong></Typography>
                          <Typography variant="caption" display="block">Closed: <strong>₹{parseFloat(lead.closed_budget || 0).toLocaleString('en-IN')}</strong></Typography>
                        </TableCell>
                        <TableCell>
                          {lead.next_followup_required ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                              <Chip
                                icon={<EventIcon sx={{ fontSize: 12 }} />}
                                label={lead.next_followup_date || 'Date Set'}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#fff', '& .MuiChip-icon': { color: '#fff' } }}
                              />
                              {lead.next_followup_time && (
                                <Chip
                                  icon={<AccessTimeIcon sx={{ fontSize: 12 }} />}
                                  label={lead.next_followup_time}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20, borderColor: '#0c1f54', color: '#0c1f54' }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">No</Typography>
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip label={lead.status} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => navigate(`/leads/edit/${lead.id}`)} color="inherit"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDelete(lead.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
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
    </Box>
  );
}
