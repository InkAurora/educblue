import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import axiosInstance from '../utils/axiosConfig';

function UserDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        // Redirect to login page if no token is found
        navigate('/login');
        return;
      }

      try {
        const response = await axiosInstance.get('/api/users/me');
        setUserData(response.data);

        // Assuming enrolled courses are included in the user data response
        if (response.data.enrolledCourses) {
          setEnrolledCourses(response.data.enrolledCourses);
        }

        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch profile: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='200px'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Helper function to safely get course ID regardless of property name
  const getCourseId = (course) => {
    if (!course) return null;

    if (course.id) return course.id;

    if (course.courseId) return course.courseId;

    // Use bracket notation to avoid ESLint warnings about dangling underscore
    // eslint-disable-next-line no-prototype-builtins
    if (Object.prototype.hasOwnProperty.call(course, '_id')) {
      return course._id;
    }

    return null;
  };
  return (
    <Container sx={{ py: 4 }}>
      {userData && (
        <>
          <Box mb={4}>
            <Typography variant='h4' component='h1' gutterBottom>
              Welcome, {userData.fullName || userData.email}
            </Typography>
          </Box>

          <Box
            sx={{
              py: 4,
              px: { xs: 2, sm: 6 }, // Match homepage padding
              width: '100%',
              margin: '0 auto',
            }}
          >
            {' '}
            <Typography
              variant='h4'
              component='h2'
              sx={{
                fontWeight: 700,
                mb: 4,
                background: 'linear-gradient(135deg, #02e6ef, #01b8c4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Your Learning Journey
            </Typography>
            <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
              {enrolledCourses.length > 0 ? (
                enrolledCourses.map((course) => {
                  const courseId = getCourseId(course);
                  return (
                    <Grid
                      key={courseId || `course-${Math.random()}`}
                      sx={{
                        width: {
                          xs: '100%',
                          sm: '320px',
                        },
                        maxWidth: '320px',
                        minWidth: {
                          xs: '280px',
                          sm: '320px',
                        },
                        flexGrow: 0,
                        flexShrink: 0,
                        p: 1.5,
                      }}
                    >
                      <Card
                        sx={{
                          height: '420px',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: 3,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          background:
                            'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                            borderColor: 'primary.main',
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Typography
                            gutterBottom
                            variant='h5'
                            component='h3'
                            sx={{
                              fontWeight: 600,
                              mb: 2,
                              lineHeight: 1.3,
                              color: 'text.primary',
                            }}
                          >
                            {course.title}
                          </Typography>
                          <Typography
                            sx={{
                              mb: 2.5,
                              lineHeight: 1.6,
                              color: 'text.secondary',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {course.description}
                          </Typography>
                          {course.price && (
                            <Typography
                              variant='h6'
                              color='primary'
                              sx={{ mt: 2 }}
                            >
                              ${course.price}
                            </Typography>
                          )}
                          <Typography
                            variant='body2'
                            color='text.secondary'
                            sx={{ mt: 1 }}
                          >
                            Instructor:{' '}
                            {course.instructor?.fullName || course.instructor}
                          </Typography>
                          {course.duration && (
                            <Typography variant='body2' color='text.secondary'>
                              Duration: {course.duration} hours
                            </Typography>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button
                            variant='contained'
                            color='primary'
                            fullWidth
                            onClick={() => {
                              if (courseId) {
                                navigate(`/courses/${courseId}`);
                              } else {
                                // Use a more React/MUI-friendly approach instead of alert
                                setError(
                                  'Could not find course ID. Please try again later.',
                                );
                              }
                            }}
                          >
                            Continue Learning
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })
              ) : (
                <Typography
                  variant='body1'
                  sx={{ mt: 3, width: '100%', textAlign: 'center' }}
                >
                  You are not enrolled in any courses yet.
                </Typography>
              )}
            </Grid>
          </Box>
        </>
      )}
    </Container>
  );
}

export default UserDashboard;
