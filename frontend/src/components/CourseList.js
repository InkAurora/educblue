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
} from '@mui/material';
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
              <Card
                sx={{
                  height: '400px', // Fixed card height
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant='h5' component='h2'>
                    {course.title}
                  </Typography>
                  <Typography>{course.description}</Typography>
                  <Typography variant='h6' color='primary' sx={{ mt: 2 }}>
                    ${course.price}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Instructor: {course.instructor}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Duration: {course.duration} hours
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant='contained'
                    color='primary'
                    fullWidth
                    onClick={() => navigate(`/courses/${course._id}`)}
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
