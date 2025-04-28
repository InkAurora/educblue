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
  const [userRole, setUserRole] = useState('');

  const checkLoginStatus = () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        // Decode the token to extract user information
        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', decodedToken);

        // Extract user information from the flattened token structure
        const email = decodedToken.email || '';
        const role = decodedToken.role || '';

        console.log('Extracted email:', email);
        console.log('Extracted role:', role);

        setUserEmail(email);
        setUserRole(role);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserRole('');
      }
    } catch (error) {
      // If token is invalid, clear it and reset state
      console.error('Error decoding token:', error);
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUserEmail('');
      setUserRole('');
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
    setUserRole('');
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
                  Hello, {userEmail || 'User'}
                </Typography>
                {/* Check for 'instructor' role */}
                {userRole === 'instructor' && (
                  <>
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/create-course'
                    >
                      Create Course
                    </Button>
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/my-courses'
                    >
                      My Courses
                    </Button>
                  </>
                )}
                <Button
                  color='inherit'
                  component={RouterLink}
                  to='/personal-information'
                >
                  Profile
                </Button>
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
