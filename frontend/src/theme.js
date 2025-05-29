import { createTheme } from '@mui/material/styles';

// Create a custom theme with turquoise blue as the primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#02e6ef', // Turquoise blue - same as used in navbar and other components
      light: '#52E5C7', // Lighter turquoise
      dark: '#02e6ef', // Darker turquoise - same as used in gradients
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#02e6ef', // Cyan variant - same as used in App.css
      light: '#6FF9FF',
      dark: '#0095A8',
      contrastText: '#000000',
    },
    // Keep other default colors
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
  },
  // Optional: Customize other theme properties
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
  },
  shape: {
    borderRadius: 8, // Slightly rounded corners for modern look
  },
});

export default theme;
