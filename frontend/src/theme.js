import { createTheme } from '@mui/material/styles';

export const getCustomTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#0c1f54', // Mugai Navy Blue
        light: '#1e40af',
        dark: '#06102e',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#2563eb', // Accent Royal Blue
        light: '#60a5fa',
        dark: '#1d4ed8',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f8fafc',
        paper: '#ffffff',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
      },
      divider: '#e2e8f0',
      action: {
        hover: 'rgba(12, 31, 84, 0.04)',
        selected: 'rgba(12, 31, 84, 0.08)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 13,
      h4: {
        fontSize: '1.25rem',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: '#0c1f54',
      },
      h5: {
        fontSize: '1.1rem',
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: '#0c1f54',
      },
      h6: {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#0c1f54',
      },
      subtitle1: {
        fontSize: '0.85rem',
        fontWeight: 600,
      },
      subtitle2: {
        fontSize: '0.8rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '0.8125rem',
      },
      body2: {
        fontSize: '0.75rem',
      },
      caption: {
        fontSize: '0.7rem',
      },
      button: {
        textTransform: 'none',
        fontWeight: 700,
        fontSize: '0.8rem',
      },
    },
    shape: {
      borderRadius: 6,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            padding: '6px 14px',
            boxShadow: 'none',
            fontSize: '0.8rem',
            fontWeight: 700,
            '&:hover': {
              boxShadow: 'none',
            },
          },
          containedPrimary: {
            backgroundColor: '#0c1f54',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#07153d',
            },
          },
          outlinedPrimary: {
            borderColor: '#0c1f54',
            color: '#0c1f54',
            '&:hover': {
              borderColor: '#0c1f54',
              backgroundColor: 'rgba(12, 31, 84, 0.04)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundImage: 'none',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(12, 31, 84, 0.05)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            padding: '8px 12px',
            fontSize: '0.8rem',
            borderBottom: '1px solid #f1f5f9',
          },
          head: {
            fontWeight: 700,
            fontSize: '0.75rem',
            color: '#0c1f54',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            backgroundColor: '#f1f5f9',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.7rem',
            borderRadius: 4,
            height: 22,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontSize: '0.8125rem',
            '& fieldset': {
              borderColor: '#cbd5e1',
            },
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0c1f54',
              borderWidth: 1.5,
            },
          },
          input: {
            padding: '8.5px 12px',
          },
        },
      },
    },
  });
