import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  Autocomplete,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// Helper component for clean form field with top label
const FormField = ({ label, required, children, sx }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', ...sx }}>
    <Typography
      sx={{
        fontWeight: 700,
        color: '#334155',
        fontSize: '0.8rem',
        mb: 0.6,
        lineHeight: 1.2,
      }}
    >
      {label} {required && <span style={{ color: '#e53e3e', fontWeight: 700 }}>*</span>}
    </Typography>
    {children}
  </Box>
);

export default function AddLead() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  const isAdmin = user?.role === 'admin';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Lookup data
  const [domains, setDomains] = useState([]);
  const [services, setServices] = useState([]);
  const [cities, setCities] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Form State
  const initialForm = {
    lead_owner_id: user?.id || '',
    name: '',
    contact: '',
    email: '',
    business_name: '',
    website: '',
    domain_id: '',
    interested_domain: '',
    lead_source: '',
    address: '',
    city_id: '',
    required_services: [],
    expected_budget: '',
    company_budget: '',
    closed_budget: '',
    notes: '',
    next_followup_required: false,
    next_followup_date: '',
    next_followup_time: '',
    status: 'New',
  };
  const [formData, setFormData] = useState(initialForm);

  // Fetch Lookups, Users, and Lead details if Edit
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const promises = [
          api.get('/masters/domains.php'),
          api.get('/masters/services.php'),
          api.get('/masters/cities.php'),
        ];

        if (isAdmin) {
          promises.push(api.get('/users/index.php'));
        }

        const results = await Promise.all(promises);
        const fetchedDomains = results[0].data.data || [];
        const fetchedCities = results[1] ? (results[2].data.data || []) : [];

        setDomains(fetchedDomains);
        setServices(results[1].data.data || []);
        setCities(fetchedCities);

        if (isAdmin && results[3]) {
          const allUsers = results[3].data.data || [];
          const assignableUsersList = allUsers.filter((u) => u.role === 'sales' || u.role === 'admin');
          setUsersList(assignableUsersList);

          if (!isEditMode) {
            setFormData((prev) => ({
              ...prev,
              lead_owner_id: assignableUsersList[0]?.id || prev.lead_owner_id,
            }));
          }
        }

        if (isEditMode) {
          const lRes = await api.get(`/leads/index.php?id=${id}`);
          const lead = lRes.data.data;
          if (lead) {
            setFormData({
              ...lead,
              lead_owner_id: lead.lead_owner_id || user?.id || '',
              domain_id: lead.domain_id || '',
              city_id: lead.city_id || '',
              email: lead.email || '',
              website: lead.website || '',
              interested_domain: lead.interested_domain || '',
              lead_source: lead.lead_source || '',
              required_services: Array.isArray(lead.required_services) ? lead.required_services : [],
              next_followup_required: Boolean(lead.next_followup_required),
              next_followup_date: lead.next_followup_date || '',
              next_followup_time: lead.next_followup_time || '',
            });
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            lead_owner_id: user?.id || '',
            domain_id: fetchedDomains[0]?.id || '',
            city_id: fetchedCities[0]?.id || '',
          }));
        }
      } catch (err) {
        setError('Failed to load initial form data.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditMode, isAdmin, user?.id]);

  const handleServiceToggle = (serviceName) => {
    const current = formData.required_services || [];
    if (current.includes(serviceName)) {
      setFormData({ ...formData, required_services: current.filter((s) => s !== serviceName) });
    } else {
      setFormData({ ...formData, required_services: [...current, serviceName] });
    }
  };

  const saveLeadData = async () => {
    if (!formData.name || !formData.contact || !formData.business_name) {
      throw new Error('Please fill in all required fields (Contact Name, Contact Phone, Business Name).');
    }
    if (isEditMode) {
      await api.put('/leads/index.php', formData);
    } else {
      await api.post('/leads/index.php', formData);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await saveLeadData();
      setSuccess('Lead saved successfully!');
      setTimeout(() => navigate('/leads'), 600);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save lead.');
    }
  };

  const handleSaveAndNew = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await saveLeadData();
      setSuccess('Lead saved! Form reset for new lead entry.');
      setFormData({
        ...initialForm,
        lead_owner_id: user?.id || '',
        domain_id: domains[0]?.id || '',
        city_id: cities[0]?.id || '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save lead.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={30} color="inherit" />
      </Box>
    );
  }

  const actionButtons = (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        onClick={() => navigate('/leads')}
        sx={{ fontWeight: 700, px: 2.8, py: 0.6, bgcolor: '#ffffff', borderColor: '#cbd5e1' }}
      >
        Cancel
      </Button>

      {!isEditMode && (
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={handleSaveAndNew}
          sx={{ fontWeight: 700, px: 2.8, py: 0.6, bgcolor: '#ffffff', borderColor: '#cbd5e1' }}
        >
          Save and New
        </Button>
      )}

      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        sx={{ fontWeight: 700, bgcolor: '#0c1f54', color: '#ffffff', '&:hover': { bgcolor: '#07153d' }, px: 3.5, py: 0.6 }}
      >
        {isEditMode ? 'Update' : 'Save'}
      </Button>
    </Box>
  );

  const selectedCityObj = cities.find((c) => String(c.id) === String(formData.city_id)) || null;

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* Top Sticky Header bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54' }}>
          {isEditMode ? `Edit Lead (#${id})` : 'Create Lead'}
        </Typography>

        {actionButtons}
      </Box>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Enterprise Form Container Card */}
      <Card sx={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(12, 31, 84, 0.04)', borderRadius: '8px', bgcolor: '#ffffff' }}>
        <CardContent sx={{ p: 3.5 }}>
          <form>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                rowGap: 3,
                columnGap: 2.5,
              }}
            >
              <FormField label="Lead Owner" required>
                {isAdmin ? (
                  <TextField
                    select
                    value={formData.lead_owner_id}
                    onChange={(e) => setFormData({ ...formData, lead_owner_id: e.target.value })}
                    fullWidth
                    size="small"
                  >
                    {usersList.length === 0 ? (
                      <MenuItem disabled value="">No Sales or Admin Users Found</MenuItem>
                    ) : (
                      usersList.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.full_name} (@{u.username} - {u.role.toUpperCase()})
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                ) : (
                  <TextField
                    value={user?.full_name || 'My Account'}
                    disabled
                    fullWidth
                    size="small"
                    helperText="Sales owner assigned automatically"
                  />
                )}
              </FormField>

              <FormField label="Company Name" required>
                <TextField
                  placeholder="Company or business name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  required
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Contact Name" required>
                <TextField
                  placeholder="Full client name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Phone / Mobile" required>
                <TextField
                  placeholder="Phone number"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  required
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Email">
                <TextField
                  type="email"
                  placeholder="client@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Website">
                <TextField
                  placeholder="www.company.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              {/* Searchable Autocomplete City Location */}
              <FormField label="City Location">
                <Autocomplete
                  size="small"
                  options={cities}
                  getOptionLabel={(option) =>
                    typeof option === 'string'
                      ? option
                      : `${option.name}${option.state_name ? ` (${option.state_name})` : ''}`
                  }
                  value={selectedCityObj}
                  onChange={(event, newValue) => {
                    setFormData({ ...formData, city_id: newValue ? newValue.id : '' });
                  }}
                  isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Type to search city or state..."
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </FormField>

              <FormField label="Street Address">
                <TextField
                  placeholder="Full street address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Business Domain">
                <TextField
                  select
                  value={formData.domain_id}
                  onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">-None-</MenuItem>
                  {domains.map((d) => (
                    <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </FormField>

              <FormField label="Interested Domain Name">
                <TextField
                  placeholder="e.g. www.mugaitechnologies.in"
                  value={formData.interested_domain}
                  onChange={(e) => setFormData({ ...formData, interested_domain: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Lead Source">
                <TextField
                  select
                  value={formData.lead_source}
                  onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="">-None-</MenuItem>
                  <MenuItem value="Meta Ads">Meta Ads</MenuItem>
                  <MenuItem value="Google Ads">Google Ads</MenuItem>
                  <MenuItem value="Referral">Referral</MenuItem>
                  <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  <MenuItem value="Website">Website</MenuItem>
                  <MenuItem value="Cold Call">Cold Call</MenuItem>
                  <MenuItem value="Exhibition">Exhibition</MenuItem>
                  <MenuItem value="Other">Others</MenuItem>
                </TextField>
              </FormField>

              <FormField label="Lead Status">
                <TextField
                  select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="New">New</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Follow-Up Scheduled">Follow-Up Scheduled</MenuItem>
                  <MenuItem value="Won">Won</MenuItem>
                  <MenuItem value="Lost">Lost</MenuItem>
                </TextField>
              </FormField>

              <FormField label="Expected Budget (₹)">
                <TextField
                  type="number"
                  placeholder="0"
                  value={formData.expected_budget}
                  onChange={(e) => setFormData({ ...formData, expected_budget: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Company Budget (₹)">
                <TextField
                  type="number"
                  placeholder="0"
                  value={formData.company_budget}
                  onChange={(e) => setFormData({ ...formData, company_budget: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Closed Budget (₹)">
                <TextField
                  type="number"
                  placeholder="0"
                  value={formData.closed_budget}
                  onChange={(e) => setFormData({ ...formData, closed_budget: e.target.value })}
                  fullWidth
                  size="small"
                />
              </FormField>

              <FormField label="Next Follow-Up Schedule">
                <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '4px', p: 1.2, bgcolor: '#ffffff', minHeight: 74 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={formData.next_followup_required}
                        onChange={(e) => setFormData({ ...formData, next_followup_required: e.target.checked })}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#333' }}>Schedule Follow-Up</Typography>}
                  />
                  {formData.next_followup_required && (
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
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
              </FormField>


              <FormField label="Services Required" sx={{ gridColumn: { md: 'span 2' } }}>
                <Box sx={{ border: '1px solid #cbd5e1', borderRadius: '4px', p: 1.2, bgcolor: '#f8fafc', minHeight: 74, maxHeight: 110, overflowY: 'auto' }}>
                  {services.length === 0 ? (
                    <Typography variant="caption" color="text.secondary">No services in General Master.</Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.2 }}>
                      {services.map((s) => (
                        <FormControlLabel
                          key={s.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={(formData.required_services || []).includes(s.name)}
                              onChange={() => handleServiceToggle(s.name)}
                              sx={{ p: 0.3 }}
                            />
                          }
                          label={<Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.72rem' }}>{s.name}</Typography>}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </FormField>

              <FormField label="Notes & Remarks" sx={{ gridColumn: { md: 'span 3' } }}>
                <TextField
                  placeholder="Discussion notes, meeting summary, or follow-up remarks..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={2.5}
                  fullWidth
                  size="small"
                />
              </FormField>
            </Box>


            {/* Bottom Action Buttons inside Form Container */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 1.5,
                mt: 3.5,
                pt: 2.5,
                borderTop: '1px solid #e2e8f0',
              }}
            >
              {actionButtons}
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

