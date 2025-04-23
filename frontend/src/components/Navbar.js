import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stack,
} from '@mui/material';

function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const checkLoginStatus = () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        // Decode the token to extract user information
        const decodedToken = jwtDecode(token);

        // Extract email from token (adjust the property name if needed based on your token structure)
        const email = decodedToken.email || decodedToken.sub || '';

        setUserEmail(email);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
      }
    } catch (error) {
      // If token is invalid, clear it and reset state
      // Removed console.error to comply with ESLint
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUserEmail('');
    }
  };

  useEffect(() => {
    // Check initial login status
    checkLoginStatus();

    // Listen for authentication events
    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        checkLoginStatus();
      }
    });

    // Custom event listener for auth changes
    const handleAuthChange = () => checkLoginStatus();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUserEmail('');
    // Dispatch auth change event
    window.dispatchEvent(new Event('authChange'));
    // Redirect to home page
    navigate('/');
  };

  return (
    <AppBar position='static'>
      <Container maxWidth='xl'>
        <Toolbar disableGutters>
          <Typography
            variant='h6'
            noWrap
            component={RouterLink}
            to='/'
            sx={{
              mr: 2,
              display: 'flex',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 1,
            }}
          >
            Educ Blue
          </Typography>

          <Box>
            {isLoggedIn ? (
              <Stack direction='row' spacing={2} alignItems='center'>
                <Typography
                  variant='body1'
                  sx={{
                    display: { xs: 'none', sm: 'block' },
                    color: 'inherit',
                  }}
                >
                  Hello, {userEmail}
                </Typography>
                <Button color='inherit' component={RouterLink} to='/dashboard'>
                  Dashboard
                </Button>
                <Button color='inherit' onClick={handleLogout}>
                  Logout
                </Button>
              </Stack>
            ) : (
              <>
                <Button
                  color='inherit'
                  component={RouterLink}
                  to='/login'
                  sx={{ mr: 1 }}
                >
                  Login
                </Button>
                <Button color='inherit' component={RouterLink} to='/register'>
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
