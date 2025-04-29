import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';

function Success() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    const enrollCourse = async () => {
      try {
        // Get session_id from URL query params
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get('session_id');
        const queryCourseId = queryParams.get('course_id');

        // Store course ID for later use after successful enrollment
        const courseToPurchase =
          queryCourseId || localStorage.getItem('enrollingCourseId');
        setCourseId(courseToPurchase);

        if (!sessionId) {
          setError('Missing session information');
          setLoading(false);
          return;
        }

        // Get JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You need to be logged in to complete enrollment');
          setLoading(false);
          return;
        }

        // Send enrollment request to the backend
        await axios.post(
          'http://localhost:5000/api/enroll',
          {
            sessionId, // Using shorthand property
            courseId: courseToPurchase, // Use courseId from query or localStorage backup
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Clear any saved course ID after successful enrollment
        localStorage.removeItem('enrollingCourseId');

        setSuccess(true);
        setLoading(false);
      } catch (err) {
        // Handle enrollment error
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(
            'An error occurred during enrollment. Please contact support.',
          );
        }

        setLoading(false);
      }
    };

    enrollCourse();
  }, [location.search]);

  // Navigate directly to course page with the enrolled course
  const handleContinueToCourse = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : success ? (
            <>
              <Typography
                component='h1'
                variant='h5'
                align='center'
                gutterBottom
              >
                Payment Successful
              </Typography>
              <Alert severity='success' sx={{ mb: 3 }}>
                Enrollment successful! You&apos;re now enrolled in the course.
              </Alert>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                onClick={handleContinueToCourse}
              >
                Continue to Course
              </Button>
            </>
          ) : (
            <>
              <Typography
                component='h1'
                variant='h5'
                align='center'
                gutterBottom
              >
                Enrollment Failed
              </Typography>
              {error && (
                <Alert severity='error' sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <Button
                fullWidth
                variant='contained'
                color='primary'
                onClick={() => navigate('/')}
              >
                Return to Courses
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default Success;
