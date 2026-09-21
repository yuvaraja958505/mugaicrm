import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Category as MastersIcon,
  PeopleAlt as LeadsIcon,
  EventRepeat as FollowUpIcon,
  ContactPhone as ContactsIcon,
  CameraAlt as AttendanceIcon,
  ManageAccounts as UsersIcon,
  Groups as MeetingsIcon,
  Assignment as TasksIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 230;

export default function Sidebar({ mobileOpen, onClose, isDesktop }) {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      path: '/',
      icon: <DashboardIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'General Master',
      path: '/masters',
      icon: <MastersIcon sx={{ fontSize: 18 }} />,
      roles: ['admin'],
    },
    {
      text: 'Lead Master',
      path: '/leads',
      icon: <LeadsIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'Follow Up',
      path: '/followups',
      icon: <FollowUpIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'Meetings',
      path: '/meetings',
      icon: <MeetingsIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'Tasks',
      path: '/tasks',
      icon: <TasksIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'Contacts',
      path: '/contacts',
      icon: <ContactsIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'Punch In / Out',
      path: '/attendance',
      icon: <AttendanceIcon sx={{ fontSize: 18 }} />,
      roles: ['admin', 'sales', 'developer', 'ui_ux'],
    },
    {
      text: 'User Accounts',
      path: '/users',
      icon: <UsersIcon sx={{ fontSize: 18 }} />,
      roles: ['admin'],
    },
  ];



  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      {/* Sidebar Header with Large Prominent Mugai Logo */}
      <Box sx={{ p: 2, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box
          component="img"
          src="/logo.jpg"
          alt="MUGAI TECHNOLOGIES"
          sx={{
            height: 54,
            maxWidth: '100%',
            objectFit: 'contain',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        />
      </Box>

      <Divider sx={{ borderColor: '#e2e8f0' }} />

      {/* Navigation Menu */}
      <List sx={{ px: 1.2, py: 1.5, flexGrow: 1 }}>
        {menuItems.map((item) => {
          if (!hasRole(...item.roles)) return null;
          const isSelected = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.6 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  if (!isDesktop) onClose();
                }}
                sx={{
                  borderRadius: '6px',
                  py: 0.9,
                  px: 1.5,
                  bgcolor: isSelected ? '#0c1f54 !important' : 'transparent',
                  color: isSelected ? '#ffffff !important' : '#334155',
                  '& .MuiListItemIcon-root': {
                    color: isSelected ? '#ffffff' : '#64748b',
                    minWidth: 32,
                  },
                  '&:hover': {
                    bgcolor: isSelected ? '#0c1f54' : '#f0f7ff',
                    color: isSelected ? '#ffffff' : '#0c1f54',
                    '& .MuiListItemIcon-root': {
                      color: isSelected ? '#ffffff' : '#0c1f54',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 700 : 600,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: '#e2e8f0' }} />

      {/* Logged in User Card */}
      <Box sx={{ p: 1.5, m: 1.5, borderRadius: '6px', border: '1px solid #cbd5e1', bgcolor: '#f8fafc' }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.04em', color: '#64748b' }}>
          USER ROLE
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', color: '#0c1f54' }}>
          {user?.full_name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', fontWeight: 600, color: '#2563eb' }}>
          {user?.role}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
      {!isDesktop ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={onClose}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #e2e8f0',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}
    </Box>
  );
}
