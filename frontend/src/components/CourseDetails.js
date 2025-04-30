import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import axiosInstance from '../utils/axiosConfig';
import CourseSidebar from './CourseSidebar';

// Helper function to sanitize markdown content
const sanitizeMarkdown = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(content);
};

function CourseDetails({ 'data-testid': dataTestId, testId = null }) {
  const params = useParams();
  const id = testId || params?.id;
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch user data with JWT token
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const userResponse = await axiosInstance.get('/api/users/me');
        setUser(userResponse.data);
        setLoadingUser(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch course data and check enrollment status
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseResponse = await axiosInstance.get(`/api/courses/${id}`);
        setCourse(courseResponse.data);

        if (user) {
          // Check if user is enrolled or is the instructor
          const userIsInstructor =
            user.fullName === courseResponse.data.instructor;

          // Check if user is enrolled
          let userIsEnrolled = false;
          if (Array.isArray(user.enrolledCourses)) {
            userIsEnrolled = user.enrolledCourses.some((course) => {
              if (typeof course === 'string') {
                return course === id;
              }
              return (
                course?._id === id ||
                course?.id === id ||
                course?.courseId === id
              );
            });
          }

          setIsEnrolled(userIsEnrolled);
          setIsInstructor(userIsInstructor);

          // If enrolled or instructor, fetch progress
          if (userIsEnrolled || userIsInstructor) {
            try {
              const progressResponse = await axiosInstance.get(
                `/api/progress/${id}`,
              );
              setProgress(progressResponse.data || []);
            } catch (progressErr) {
              console.error('Error fetching progress:', progressErr);
            }
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Course not found or error loading data');
        setLoading(false);
      }
    };

    if (!loadingUser) {
      fetchCourseData();
    }
  }, [id, user, loadingUser]);

  const handlePayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus(null);

      const response = await axiosInstance.post('/api/stripe/checkout', {
        courseId: id,
      });

      // Handle payment flow here based on response
      // For now, just set dummy success response
      setPaymentStatus({
        type: 'success',
        message: 'Payment initiated. You will be redirected to checkout.',
      });

      // In a real app, you'd redirect to Stripe checkout here
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to create checkout session';
      setPaymentStatus({ type: 'error', message: errorMessage });
    } finally {
      setProcessing(false);
    }
  };

  const handleEnrollFree = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setProcessing(true);
      await axiosInstance.post(`/api/courses/${id}/enroll`);
      setIsEnrolled(true);
      setProcessing(false);
      setPaymentStatus({
        type: 'success',
        message: 'Successfully enrolled in course!',
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to enroll in course';
      setPaymentStatus({ type: 'error', message: errorMessage });
      setProcessing(false);
    }
  };

  // Handle loading state
  if (loading || loadingUser) {
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

  // Handle error state
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 4 }} data-testid={dataTestId}>
      {course && (
        <Grid container spacing={3}>
          {/* Course Sidebar - Only shown for enrolled users or instructors */}
          {(isEnrolled || isInstructor) && (
            <Grid
              item
              xs={12}
              md={3}
              sx={{ display: { xs: 'none', md: 'block' } }}
            >
              <CourseSidebar
                course={course}
                progress={progress}
                courseId={id}
              />
            </Grid>
          )}

          {/* Main Content Area */}
          <Grid item xs={12} md={isEnrolled || isInstructor ? 9 : 12}>
            {/* Course Header - visible to all users */}
            <Typography variant='h4' component='h1' gutterBottom>
              {course.title}
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant='body1' color='text.secondary' gutterBottom>
                Instructor: {course.instructor}
              </Typography>
              <Typography variant='body1' paragraph>
                {course.description}
              </Typography>
            </Box>

            {/* Course price and enrollment/payment buttons - only for non-enrolled users */}
            {!isEnrolled && !isInstructor && (
              <Box
                sx={{
                  mb: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant='h5' color='primary'>
                  ${course.price}
                </Typography>

                {course.price > 0 ? (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Pay Now'}
                  </Button>
                ) : (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleEnrollFree}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Enroll for Free'}
                  </Button>
                )}
              </Box>
            )}

            {/* Payment status messages */}
            {paymentStatus && (
              <Box sx={{ mb: 3 }}>
                <Alert severity={paymentStatus.type}>
                  {paymentStatus.message}
                </Alert>
              </Box>
            )}

            {/* Access restriction alert for non-enrolled users */}
            {!isEnrolled && !isInstructor && (
              <Alert severity='info' sx={{ mb: 3 }}>
                Please enroll to access course content
              </Alert>
            )}

            {/* Course Description in Markdown */}
            {course.markdownDescription && (
              <Paper variant='outlined' sx={{ p: 3, mb: 4 }}>
                <Typography variant='h6' gutterBottom>
                  About this course
                </Typography>
                <Box
                  sx={{
                    '& p': { mb: 2 },
                    '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 2 },
                    '& ul, & ol': { pl: 4, mb: 2 },
                    '& code': {
                      p: 0.5,
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 1,
                    },
                  }}
                >
                  <ReactMarkdown>
                    {sanitizeMarkdown(course.markdownDescription)}
                  </ReactMarkdown>
                </Box>
              </Paper>
            )}

            {/* Only show mobile version of sidebar toggle for enrolled users on small screens */}
            {(isEnrolled || isInstructor) && (
              <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                <CourseSidebar
                  course={course}
                  progress={progress}
                  courseId={id}
                />
              </Box>
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default CourseDetails;
