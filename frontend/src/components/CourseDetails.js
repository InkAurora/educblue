import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Paper,
  Alert,
  Button,
} from '@mui/material';

function CourseDetails(props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/courses/${id}`,
        );
        setCourse(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Course not found');
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  const handleEnroll = async () => {
    // Check for authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to enroll');
      navigate('/login');
      return;
    }

    try {
      setEnrolling(true);
      setEnrollmentStatus(null);

      const response = await axios.post(
        'http://localhost:5000/api/enroll',
        { courseId: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEnrollmentStatus({
        type: 'success',
        message: 'Enrolled successfully',
      });
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.message || 'Enrollment failed';

      if (errorMessage.includes('already enrolled')) {
        setEnrollmentStatus({ type: 'warning', message: 'Already enrolled' });
      } else {
        setEnrollmentStatus({ type: 'error', message: errorMessage });
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='300px'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }} data-testid={props['data-testid']}>
      {course && (
        <Box>
          <Typography variant='h4' component='h1' gutterBottom>
            {course.title}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant='body1' paragraph>
              {course.description}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              mb: 4,
            }}
          >
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              <Typography variant='h5' color='primary' gutterBottom>
                ${course.price}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Instructor: {course.instructor}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Duration: {course.duration} hours
              </Typography>
            </Box>

            <Box sx={{ alignSelf: { sm: 'flex-end' } }}>
              <Button
                variant='contained'
                color='primary'
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </Button>
            </Box>
          </Box>

          {enrollmentStatus && (
            <Box sx={{ mb: 3 }}>
              <Alert severity={enrollmentStatus.type}>
                {enrollmentStatus.message}
              </Alert>
            </Box>
          )}

          <Typography variant='h6' gutterBottom sx={{ mt: 4 }}>
            Course Content
          </Typography>
          <Paper variant='outlined' sx={{ p: 2 }}>
            {course.content && course.content.length > 0 ? (
              <List>
                {course.content.map((item, index) => (
                  <React.Fragment key={item._id || index}>
                    <ListItem alignItems='flex-start'>
                      <ListItemText
                        primary={item.title}
                        secondary={
                          <Typography component='span' variant='body2'>
                            <Chip
                              label={item.type}
                              size='small'
                              color={
                                item.type === 'video' ? 'primary' : 'secondary'
                              }
                            />
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < course.content.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                No content available for this course.
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
}

export default CourseDetails;
