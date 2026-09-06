import React from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e40af', // Deep Indigo
      light: '#3b82f6',
      dark: '#1e3a8a',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#0d9488', // Teal
      light: '#14b8a6',
      dark: '#0f766e',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#64748b' // Slate 500
    },
    divider: '#e2e8f0'
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.02em'
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.01em'
    },
    subtitle1: {
      fontSize: '0.95rem',
      fontWeight: 500
    },
    button: {
      textTransform: 'none',
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e2e8f0'
        }
      }
    }
  }
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
