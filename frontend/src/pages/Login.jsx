import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Chip,
  InputAdornment,
  IconButton,
  Container,
  Paper,
  Divider,
} from '@mui/material';
import {
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
  Shield as AdminIcon,
  Badge as SalesIcon,
  Code as DevIcon,
  Brush as UiIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');
  };

  const demoAccounts = [
    { role: 'Admin', user: 'admin', pass: 'Admin@123', icon: <AdminIcon sx={{ fontSize: 13 }} /> },
    { role: 'Sales', user: 'sales_pro', pass: 'Sales@123', icon: <SalesIcon sx={{ fontSize: 13 }} /> },
    { role: 'Developer', user: 'dev_lead', pass: 'Dev@123', icon: <DevIcon sx={{ fontSize: 13 }} /> },
    { role: 'UI/UX', user: 'ui_designer', pass: 'Ui@123', icon: <UiIcon sx={{ fontSize: 13 }} /> },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card
          elevation={0}
          sx={{
            borderRadius: '8px',
            bgcolor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(12, 31, 84, 0.06)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              py: 3,
              px: 3,
              textAlign: 'center',
              bgcolor: '#ffffff',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <Box
              component="img"
              src="/logo.jpg"
              alt="MUGAI TECHNOLOGIES"
              sx={{
                maxHeight: 50,
                maxWidth: '100%',
                objectFit: 'contain',
                mb: 1,
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600, fontSize: '0.72rem' }}>
              Enterprise CRM & Attendance System
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, py: 0.5, fontSize: '0.75rem' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 700, mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
                  USERNAME
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: '#0c1f54', fontSize: 16 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#334155', fontWeight: 700, mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
                  PASSWORD
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#0c1f54', fontSize: 16 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.1,
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  bgcolor: '#0c1f54',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: '#07153d',
                  },
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ my: 2.5, borderColor: '#e2e8f0' }}>
              <Typography variant="caption" sx={{ color: '#64748b', px: 1, fontWeight: 700, fontSize: '0.65rem' }}>
                DEMO ACCOUNTS
              </Typography>
            </Divider>

            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
              }}
            >
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, textAlign: 'center', fontSize: '0.68rem', fontWeight: 600 }}>
                Click a role badge to auto-fill credentials:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'center' }}>
                {demoAccounts.map((acc) => (
                  <Chip
                    key={acc.role}
                    icon={acc.icon}
                    label={`${acc.role}`}
                    variant="outlined"
                    onClick={() => handleQuickFill(acc.user, acc.pass)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      height: 22,
                      borderColor: '#0c1f54',
                      color: '#0c1f54',
                      '&:hover': {
                        bgcolor: '#0c1f54',
                        color: '#ffffff',
                        '& .MuiChip-icon': { color: '#ffffff' },
                      },
                    }}
                  />
                ))}
              </Box>
            </Paper>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
