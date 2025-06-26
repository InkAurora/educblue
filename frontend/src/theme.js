import { createTheme } from '@mui/material/styles';

// Create a modern theme optimized for education platform
const theme = createTheme({
  palette: {
    primary: {
      main: '#02e6ef', // Turquoise blue - brand color
      light: '#4df0f7', // Lighter turquoise for hover states
      dark: '#01b8c4', // Darker turquoise for active states
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#495057', // Neutral dark gray
      light: '#6c757d', // Secondary text color
      dark: '#343a40', // Darker gray
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa', // Light gray background
      paper: '#ffffff', // White paper background
    },
    text: {
      primary: '#495057', // Main text color
      secondary: '#6c757d', // Secondary text
      disabled: '#adb5bd', // Disabled text
    },
    error: {
      main: '#dc3545',
      light: '#f8d7da',
      dark: '#c82333',
    },
    warning: {
      main: '#ffc107',
      light: '#fff3cd',
      dark: '#e0a800',
    },
    info: {
      main: '#17a2b8',
      light: '#d1ecf1',
      dark: '#138496',
    },
    success: {
      main: '#28a745',
      light: '#d4edda',
      dark: '#1e7e34',
    },
    // Custom colors for education platform
    neutral: {
      50: '#f8f9fa',
      100: '#e9ecef',
      200: '#dee2e6',
      300: '#ced4da',
      400: '#adb5bd',
      500: '#6c757d',
      600: '#495057',
      700: '#343a40',
      800: '#212529',
      900: '#1a1d20',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12, // More rounded corners for modern look
  },
  spacing: 8, // 8px base spacing unit
  shadows: [
    'none',
    '0 2px 4px rgba(0, 0, 0, 0.06)',
    '0 4px 8px rgba(0, 0, 0, 0.08)',
    '0 6px 12px rgba(0, 0, 0, 0.1)',
    '0 8px 16px rgba(0, 0, 0, 0.12)',
    '0 12px 24px rgba(0, 0, 0, 0.14)',
    '0 16px 32px rgba(0, 0, 0, 0.16)',
    '0 20px 40px rgba(0, 0, 0, 0.18)',
    '0 24px 48px rgba(0, 0, 0, 0.2)',
    '0 32px 64px rgba(0, 0, 0, 0.22)',
    '0 40px 80px rgba(0, 0, 0, 0.24)',
    '0 48px 96px rgba(0, 0, 0, 0.26)',
    '0 56px 112px rgba(0, 0, 0, 0.28)',
    '0 64px 128px rgba(0, 0, 0, 0.3)',
    '0 72px 144px rgba(0, 0, 0, 0.32)',
    '0 80px 160px rgba(0, 0, 0, 0.34)',
    '0 88px 176px rgba(0, 0, 0, 0.36)',
    '0 96px 192px rgba(0, 0, 0, 0.38)',
    '0 104px 208px rgba(0, 0, 0, 0.4)',
    '0 112px 224px rgba(0, 0, 0, 0.42)',
    '0 120px 240px rgba(0, 0, 0, 0.44)',
    '0 128px 256px rgba(0, 0, 0, 0.46)',
    '0 136px 272px rgba(0, 0, 0, 0.48)',
    '0 144px 288px rgba(0, 0, 0, 0.5)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #02e6ef 0%, #01b8c4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #4df0f7 0%, #02e6ef 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          borderColor: '#02e6ef',
          '&:hover': {
            borderWidth: 2,
            backgroundColor: 'rgba(2, 230, 239, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover fieldset': {
              borderColor: '#02e6ef',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#02e6ef',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#02e6ef',
          backgroundImage: 'linear-gradient(135deg, #02e6ef 0%, #01b8c4 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
