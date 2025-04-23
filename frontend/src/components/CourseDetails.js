import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
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

// Initialize Stripe promise - you'll need to replace with your actual publishable key
const stripePromise = loadStripe('pk_test_your_publishable_key');

function CourseDetails({ 'data-testid': dataTestId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

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
        // Silently handle error
        setError('Course not found');
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id]);

  const handlePayment = async () => {
    // Check for authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      // Use DOM APIs instead of alert
      navigate('/login');
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus(null);

      const response = await axios.post(
        'http://localhost:5000/api/stripe/checkout',
        { courseId: id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Load Stripe and redirect to checkout
      const stripe = await stripePromise;
      const { sessionId } = response.data;

      const result = await stripe.redirectToCheckout({
        sessionId,
      });

      if (result.error) {
        setPaymentStatus({
          type: 'error',
          message: result.error.message || 'Payment process failed',
        });
      }
    } catch (err) {
      // Silently log error
      const errorMessage =
        err.response?.data?.message || 'Failed to create checkout session';
      setPaymentStatus({ type: 'error', message: errorMessage });
    } finally {
      setProcessing(false);
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
    <Container sx={{ py: 4 }} data-testid={dataTestId}>
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
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>
            </Box>
          </Box>

          {paymentStatus && (
            <Box sx={{ mb: 3 }}>
              <Alert severity={paymentStatus.type}>
                {paymentStatus.message}
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
                  <React.Fragment key={item.id || index}>
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
