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

    const isCourseDetailsPage =
      location.pathname.match(/^\/courses\/[^/]+$/) !== null;

    setShowSidebarToggle(isCourseContentPage || isCourseDetailsPage);
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
      // console.error('Error fetching user data:', error);
    }
  };

  const checkLoginStatus = () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        const decodedToken = jwtDecode(token);

        const email = decodedToken.email || '';
        const role = decodedToken.role || '';

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
      // console.error('Error decoding token:', error);
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
      // console.error('Error during logout:', error);
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
      position='fixed'
      sx={{
        zIndex: 1300, // Higher z-index to be above everything
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Enhanced shadow for mobile app feel        margin: 0,        padding: 0,
        backgroundColor: '#02e6ef', // Consistent primary color
        backgroundImage: 'linear-gradient(135deg, #02e6ef 0%, #02e6ef 100%)', // Subtle gradient
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)', // Subtle border
      }}
    >
      <Container
        maxWidth='xl'
        disableGutters // Remove container gutters
        sx={{ margin: 0, padding: 0 }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            minHeight: { xs: '56px', sm: '64px' }, // Responsive height
            px: { xs: 2, sm: 3 }, // Responsive padding
          }}
        >
          {/* Left section - Course sidebar toggle (if on course content page) */}
          <Box
            sx={{
              display: 'flex',
              flex: '1',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
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
          <Box
            sx={{
              display: 'flex',
              flex: '1',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
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
                fontSize: { xs: '1.1rem', sm: '1.25rem' }, // Responsive font size
                letterSpacing: '0.5px', // Better letter spacing for mobile
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)', // Subtle text shadow
              }}
            >
              Educ Blue
            </Typography>
          </Box>

          {/* Right section - User menu or navigation links */}
          <Box
            sx={{
              display: 'flex',
              flex: '1',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            {isMobile ? (
              <>
                <Tooltip title='User menu'>
                  <IconButton
                    size='large'
                    color='inherit'
                    aria-label='user menu'
                    onClick={handleMenuOpen}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:active': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    <AccountCircleIcon sx={{ fontSize: '1.8rem' }} />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    elevation: 8,
                    sx: {
                      minWidth: '220px',
                      mt: 1,
                      borderRadius: '12px',
                      background:
                        'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      '& .MuiMenuItem-root': {
                        py: 1.5,
                        px: 2,
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(0, 191, 165, 0.08)',
                        },
                      },
                    },
                  }}
                >
                  {isLoggedIn && (
                    <MenuItem
                      sx={{
                        justifyContent: 'center',
                        fontWeight: 'bold !important',
                        color: 'primary.main',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                        py: 2,
                      }}
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
                      {userRole === 'admin' && (
                        <MenuItem onClick={() => handleNavigation('/admin')}>
                          Admin
                        </MenuItem>
                      )}
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
                      <MenuItem
                        onClick={handleLogout}
                        sx={{
                          borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                          color: 'error.main',
                          fontWeight: '600 !important',
                        }}
                      >
                        Logout
                      </MenuItem>
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
              <Stack direction='row' spacing={5} alignItems='center'>
                {isLoggedIn ? (
                  <>
                    <Typography
                      variant='body2'
                      sx={{
                        display: { xs: 'none', sm: 'block' },
                        color: 'rgba(255, 255, 255, 0.9)',
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginRight: '8px', // Add extra space after username
                      }}
                    >
                      {userFullName || userEmail || 'User'}
                    </Typography>
                    {userRole === 'instructor' && (
                      <>
                        <Button
                          color='inherit'
                          component={RouterLink}
                          to='/create-course'
                          size='small'
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          Create Course
                        </Button>
                        <Button
                          color='inherit'
                          component={RouterLink}
                          to='/my-courses'
                          size='small'
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          My Courses
                        </Button>
                      </>
                    )}
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/personal-information'
                      size='small'
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Profile
                    </Button>
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/dashboard'
                      size='small'
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Dashboard
                    </Button>
                    {userRole === 'admin' && (
                      <Button
                        color='inherit'
                        component={RouterLink}
                        to='/admin'
                        size='small'
                        sx={{
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        Admin
                      </Button>
                    )}
                    <Button
                      color='inherit'
                      onClick={handleLogout}
                      size='small'
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/login'
                      size='small'
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      color='inherit'
                      component={RouterLink}
                      to='/register'
                      size='small'
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
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
