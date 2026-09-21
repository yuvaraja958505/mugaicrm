import React, { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getCustomTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Main Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GeneralMasters from './pages/GeneralMasters';
import Leads from './pages/Leads';
import AddLead from './pages/AddLead';
import Contacts from './pages/Contacts';
import Attendance from './pages/Attendance';
import UserManagement from './pages/UserManagement';
import FollowUps from './pages/FollowUps';
import Meetings from './pages/Meetings';
import Tasks from './pages/Tasks';

// Sub Master Pages
import DomainMaster from './pages/masters/DomainMaster';
import ServiceMaster from './pages/masters/ServiceMaster';
import CountryMaster from './pages/masters/CountryMaster';
import StateMaster from './pages/masters/StateMaster';
import CityMaster from './pages/masters/CityMaster';
import RoleMaster from './pages/masters/RoleMaster';

// Protected Route Wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, token, loading } = useAuth();

  if (loading) return null;
  if (!token || !user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function App() {
  const [mode, setMode] = useState('light');

  const theme = useMemo(() => getCustomTheme(mode), [mode]);

  const toggleDarkMode = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      
                      {/* General Master Card Hub & Sub-routes */}
                      <Route
                        path="/masters"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <GeneralMasters />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/masters/domains"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <DomainMaster />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/masters/services"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <ServiceMaster />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/masters/countries"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <CountryMaster />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/masters/states"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <StateMaster />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/masters/cities"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <CityMaster />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/masters/roles"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <RoleMaster />
                          </ProtectedRoute>
                        }
                      />

                      <Route path="/leads" element={<Leads />} />
                      <Route path="/leads/add" element={<AddLead />} />
                      <Route path="/leads/edit/:id" element={<AddLead />} />
                      <Route path="/contacts" element={<Contacts />} />
                      <Route path="/followups" element={<FollowUps />} />
                      <Route path="/meetings" element={<Meetings />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/attendance" element={<Attendance />} />
                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute roles={['admin']}>
                            <UserManagement />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

