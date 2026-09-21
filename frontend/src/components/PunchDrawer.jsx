import React, { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  CameraAlt as CameraIcon,
  PhotoCamera as SnapIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon,
} from '@mui/icons-material';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function PunchDrawer({ open, onClose, onRefresh }) {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0); // 0 = Clock in, 1 = Clock out
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  
  // Camera & Image state
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toISOString().split('T')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setError('');
      setSuccess('');
    }
  }, [open]);

  const startCamera = async () => {
    setError('');
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      setError('Camera access restricted. Please allow permissions or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85));
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handlePunchSubmit = async () => {
    const actionType = tabIndex === 0 ? 'punch_in' : 'punch_out';

    if (!capturedImage) {
      setError(`Photo proof is required to ${tabIndex === 0 ? 'Clock In' : 'Clock Out'}.`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/attendance/index.php', {
        action: actionType,
        image: capturedImage,
        notes: notes,
      });
      setSuccess(res.data.message || 'Attendance status recorded.');
      if (onRefresh) onRefresh();
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Punch operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 420 }, p: 0 },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header Bar */}
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e5e5' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#000000' }}>
            {tabIndex === 0 ? 'Confirm Clock In' : 'Confirm Clock Out'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* User Profile Header */}
        <Box sx={{ p: 2.5, bgcolor: '#fafafa', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 46, height: 46, bgcolor: '#000000', color: '#ffffff', fontWeight: 800 }}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#000000', lineHeight: 1.1 }}>
              {user?.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Role: {user?.role?.toUpperCase()} | @{user?.username}
            </Typography>
          </Box>
        </Box>

        {/* Clock In / Clock Out Tabs */}
        <Box sx={{ borderBottom: '1px solid #e5e5e5', px: 2 }}>
          <Tabs
            value={tabIndex}
            onChange={(e, val) => {
              setTabIndex(val);
              setError('');
            }}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'none',
                minWidth: 120,
              },
            }}
          >
            <Tab label="Clock in" />
            <Tab label="Clock out" />
          </Tabs>
        </Box>

        {/* Drawer Body Content */}
        <Box sx={{ p: 2.5, flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error" size="small">{error}</Alert>}
          {success && <Alert severity="success" size="small">{success}</Alert>}

          {/* Time & Date Display */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <TextField
              label="Time"
              value={currentTime}
              disabled
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <TimeIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />,
              }}
            />
            <TextField
              label="Date"
              value={currentDate}
              disabled
              size="small"
              fullWidth
              InputProps={{
                startAdornment: <DateIcon sx={{ fontSize: 16, mr: 1, color: '#666' }} />,
              }}
            />
          </Box>

          {/* Camera Viewport */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#333', mb: -1 }}>
            PHOTO VERIFICATION PROOF *
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 200,
              bgcolor: '#f5f5f5',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e5e5e5',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ display: cameraActive ? 'block' : 'none', width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {capturedImage && (
              <img src={capturedImage} alt="Captured Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {!cameraActive && !capturedImage && (
              <Box sx={{ textAlign: 'center', color: '#888' }}>
                <CameraIcon sx={{ fontSize: 36, mb: 0.5 }} />
                <Typography variant="caption" display="block">Camera inactive</Typography>
              </Box>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>

          {/* Camera Controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!cameraActive ? (
              <Button size="small" variant="outlined" startIcon={<CameraIcon />} onClick={startCamera} fullWidth>
                Start Camera
              </Button>
            ) : (
              <Button size="small" variant="contained" startIcon={<SnapIcon />} onClick={capturePhoto} fullWidth sx={{ bgcolor: '#000', color: '#fff' }}>
                Snap Photo
              </Button>
            )}
            <Button size="small" variant="outlined" component="label" color="inherit">
              Upload
              <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
            </Button>
          </Box>

          {/* Notes Field */}
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#333', mb: -1 }}>
            ADD A NOTE
          </Typography>
          <TextField
            placeholder="Add notes for this punch..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            size="small"
            fullWidth
          />
        </Box>

        {/* Bottom Fixed Action Bar */}
        <Box sx={{ p: 2, borderTop: '1px solid #e5e5e5', display: 'flex', gap: 1.5, bgcolor: '#ffffff' }}>
          <Button onClick={onClose} variant="outlined" color="inherit" fullWidth sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handlePunchSubmit}
            variant="contained"
            disabled={submitting}
            fullWidth
            sx={{ fontWeight: 700, bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#222222' } }}
          >
            {submitting ? 'Saving...' : tabIndex === 0 ? 'Save Clock In' : 'Save Clock Out'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
