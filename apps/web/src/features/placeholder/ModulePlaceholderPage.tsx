import React from 'react';
import { Box, Card, CardContent, Typography, Button, Paper } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Props {
  moduleName: string;
  phase: string;
  description: string;
}

export const ModulePlaceholderPage: React.FC<Props> = ({ moduleName, phase, description }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: '#eff6ff',
            color: 'primary.main',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2
          }}
        >
          <ConstructionIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          {moduleName}
        </Typography>
        <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
          {phase}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 1 }}>
          {description}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};
