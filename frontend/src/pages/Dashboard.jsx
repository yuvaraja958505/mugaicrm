import React from 'react';
import { Box, Typography } from '@mui/material';

export default function Dashboard() {
  return (
    <Box sx={{ pb: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c1f54', mb: 3 }}>
        Dashboard
      </Typography>
    </Box>
  );
}
