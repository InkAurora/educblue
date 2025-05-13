import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stack,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import axiosInstance from '../utils/axiosConfig';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [showSidebarToggle, setShowSidebarToggle] = useState(false);

  useEffect(() => {
    const isCourseContentPage =
      location.pathname.includes('/courses/') &&
      location.pathname.includes('/content/');
    setShowSidebarToggle(isCourseContentPage);
  }, [location.pathname]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigation = (path) => {
    handleMenuClose();
    navigate(path);
  };

  const open = Boolean(anchorEl);

  const fetchUserData = async (token) => {
    try {
      const response = await axiosInstance.get('/api/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.fullName) {
        setUserFullName(response.data.fullName);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const checkLoginStatus = () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        const decodedToken = jwtDecode(token);
        console.log('Decoded token:', decodedToken);

        const email = decodedToken.email || '';
        const role = decodedToken.role || '';

        console.log('Extracted email:', email);
        console.log('Extracted role:', role);

        setUserEmail(email);
        setUserRole(role);
        setIsLoggedIn(true);

        fetchUserData(token);
      } else {
        setIsLoggedIn(false);
        setUserEmail('');
        setUserRole('');
        setUserFullName('');
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      localStorage.removeItem('token');
      setIsLoggedIn(false);
      setUserEmail('');
      setUserRole('');
      setUserFullName('');
    }
  };

  useEffect(() => {
    checkLoginStatus();

    window.addEventListener('storage', (event) => {
      if (event.key === 'token') {
        checkLoginStatus();
      }
    });

    const handleAuthChange = () => checkLoginStatus();
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        await axiosInstance.post('/api/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      setIsLoggedIn(false);
      setUserEmail('');
      setUserRole('');
      setUserFullName('');

      window.dispatchEvent(new Event('authChange'));

      navigate('/');
    }
  };

  return (
    <AppBar
      position='static'
      sx={{
        zIndex: 1200,
        boxShadow: 2, // Use a slightly stronger shadow
        margin: 0,
        padding: 0,
      }}
    >
      <Container
        maxWidth='xl'
        disableGutters // Remove container gutters
        sx={{ margin: 0, padding: 0 }}
      >
        <Toolbar
          disableGutters
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          {/* Left section - Course sidebar toggle (if on course content page) */}
          <Box
            sx={{ display: 'flex', flex: '1', justifyContent: 'flex-start' }}
          >
            {showSidebarToggle && (
              <Box
                sx={{ display: 'flex', alignItems: 'center' }}
                id='course-sidebar-container'
              >
                {/* This div will be used as a container for the course sidebar toggle */}
              </Box>
            )}
          </Box>

          {/* Center section - Site title */}
          <Box sx={{ display: 'flex', flex: '1', justifyContent: 'center' }}>
            <Typography
              variant='h6'
              noWrap
              component={RouterLink}
              to='/'
              sx={{
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              Educ Blue
            </Typography>
          </Box>

          {/* Right section - User menu or navigation links */}
          <Box sx={{ display: 'flex', flex: '1', justifyContent: 'flex-end' }}>
            {isMobile ? (
              <>
                <Tooltip title='User menu'>
                  <IconButton
                    size='large'
                    color='inherit'
                    aria-label='user menu'
                    onClick={handleMenuOpen}
                  >
                    <AccountCircleIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    elevation: 3,
                    sx: {
                      minWidth: '200px',
                      mt: 1,
                    },
                  }}
                >
                  {isLoggedIn && (
                    <MenuItem
                      sx={{ justifyContent: 'center', fontWeight: 'bold' }}
                    >
                      {userFullName || userEmail || 'User'}
                    </MenuItem>
                  )}
                  {isLoggedIn ? (
                    <>
                      <MenuItem
                        onClick={() =>
                          handleNavigation('/personal-information')
                        }
                      >
                        Profile
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/dashboard')}>
                        Dashboard
                      </MenuItem>
                      {userRole === 'instructor' && (
                        <>
                          <MenuItem
                            onClick={() => handleNavigation('/create-course')}
                          >
                            Create Course
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleNavigation('/my-courses')}
                          >
                            My Courses
                          </MenuItem>
                        </>
                      )}
                      <MenuItem onClick={handleLogout}>Logout</MenuItem>
                    </>
                  ) : (
                    <>
                      <MenuItem onClick={() => handleNavigation('/login')}>
                        Login
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/register')}>
                        Register
                      </MenuItem>
                    </>
                  )}
                </Menu>
              </>
            ) : (
              <Stack direction='row' spacing={2} alignItems='center'>
                {isLoggedIn ? (
                  <>
                    <Typography
                      variant='body1'
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        color: 'inherit',
                      }}
                    >
                      Hello, {userFullName || userEmail || 'User'}
                    </Typography>
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
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/dashboard'
                    >
                      Dashboard
                    </Button>
                    <Button color='inherit' onClick={handleLogout}>
                      Logout
                    </Button>
                  </>
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
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/register'
                    >
                      Register
                    </Button>
                  </>
                )}
              </Stack>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
