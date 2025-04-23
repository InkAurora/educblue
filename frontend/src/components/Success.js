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

  useEffect(() => {
    const enrollCourse = async () => {
      try {
        // Get session_id from URL query params
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get('session_id');

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
          { session_id: sessionId },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

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
                onClick={() => navigate('/')}
              >
                Return to Courses
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
