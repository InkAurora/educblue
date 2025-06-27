import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axiosInstance from '../utils/axiosConfig';

function CourseList(props) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { 'data-testid': dataTestId } = props;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('/api/courses');
        if (Array.isArray(response.data)) {
          setCourses(response.data);
        } else {
          setCourses([]); // Ensure courses is an array to prevent .map error
          setError(
            'Failed to load courses: Unexpected data format received from the server.',
          );
        }
      } catch (err) {
        if (err.message && err.message.includes('CORS')) {
          setError(
            'CORS error: The backend server needs to enable cross-origin requests. Please add CORS middleware to your backend application.',
          );
        } else {
          setError(`Failed to fetch courses: ${err.message}`);
        }
        setCourses([]); // Ensure courses is an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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
      <Box sx={{ py: 4, px: 6, width: '100%', margin: '0 auto' }}>
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 4,
        px: { xs: 2, sm: 6 }, // Reduced padding on mobile for more card space
        width: '100%', // Use full width
        margin: '0 auto', // Center the container
      }}
      data-testid={dataTestId}
    >
      <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <Grid
              key={course._id} // Changed from id to _id to match MongoDB format
              sx={{
                width: {
                  xs: '100%', // 90% width on mobile for better spacing
                  sm: '320px', // Fixed width on small screens and up
                },
                maxWidth: '320px', // Maximum card width
                minWidth: {
                  xs: '280px', // Minimum width on mobile
                  sm: '320px', // Fixed minimum on larger screens
                },
                flexGrow: 0,
                flexShrink: 0,
                p: 1.5, // Fixed padding around each card
              }}
            >
              {' '}
              <Card
                sx={{
                  height: '420px', // Slightly taller for better proportions
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3, // More rounded corners
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent
                  sx={{
                    flexGrow: 1,
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Typography
                    gutterBottom
                    variant='h5'
                    component='h2'
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
                      flexGrow: 1,
                    }}
                  >
                    {course.description}
                  </Typography>

                  <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={`$${course.price}`}
                        color='primary'
                        variant='filled'
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          background:
                            'linear-gradient(135deg, #02e6ef, #01b8c4)',
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PersonIcon
                        sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
                      />
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {course.instructor?.fullName || course.instructor}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTimeIcon
                        sx={{ fontSize: 16, color: 'text.secondary', mr: 1 }}
                      />
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ fontSize: '0.875rem' }}
                      >
                        {course.duration} hours
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  {' '}
                  <Button
                    variant='contained'
                    color='primary'
                    fullWidth
                    onClick={() => navigate(`/courses/${course._id}`)}
                    sx={{
                      py: 1.5,
                      fontWeight: 600,
                      // Remove borderRadius override to use theme default (8px)
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: 'none',
                      background: 'linear-gradient(135deg, #02e6ef, #01b8c4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #4df0f7, #02e6ef)',
                        boxShadow: '0 4px 12px rgba(2, 230, 239, 0.3)',
                      },
                    }}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography
            variant='body1'
            sx={{ mt: 3, width: '100%', textAlign: 'center' }}
          >
            No courses available at this time.
          </Typography>
        )}
      </Grid>
    </Box>
  );
}

export default CourseList;
