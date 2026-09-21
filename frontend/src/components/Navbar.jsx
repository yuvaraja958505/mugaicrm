import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#ffffff',
        color: '#0f172a',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <Toolbar variant="dense" sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 }, minHeight: 52 }}>
        {/* Top Bar Left: Hamburger Menu & Mugai CRM Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton edge="start" onClick={onToggleSidebar} color="inherit" size="small">
            <MenuIcon fontSize="small" />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0c1f54', letterSpacing: '-0.01em' }}>
            Mugai CRM
          </Typography>
        </Box>

        {/* Top Bar Right: Profile Avatar Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleMenuOpen} size="small" color="inherit">
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#0c1f54',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 800,
              }}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: { minWidth: 180, mt: 1, border: '1px solid #e2e8f0', borderRadius: '6px' },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0c1f54' }}>
                {user?.full_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                @{user?.username} ({user?.role})
              </Typography>
            </Box>
            <MenuItem onClick={handleLogout} sx={{ fontSize: '0.75rem', py: 0.8 }}>
              <ListItemIcon>
                <LogoutIcon sx={{ fontSize: 16, color: '#ef4444' }} />
              </ListItemIcon>
              <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444' }} />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
