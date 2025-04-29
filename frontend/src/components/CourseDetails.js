import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { loadStripe } from '@stripe/stripe-js';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Paper,
  Alert,
  Button,
  Grid,
  TextField,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import LockIcon from '@mui/icons-material/Lock';
import axiosInstance from '../utils/axiosConfig';

// Initialize Stripe promise - you'll need to replace with your actual publishable key
const stripePromise = loadStripe('pk_test_your_publishable_key');

// Helper function to sanitize markdown content
const sanitizeMarkdown = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(content);
};

function CourseDetails({ 'data-testid': dataTestId }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [userEnrolled, setUserEnrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [authAlert, setAuthAlert] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoadingUser(false);
      setAuthAlert({
        severity: 'info',
        message:
          'Please log in to track your progress and access course content',
      });
    } else {
      // Fetch user data from the API
      const fetchUserData = async () => {
        try {
          const userResponse = await axiosInstance.get('/api/users/me');
          setUser(userResponse.data);

          // Check if user is enrolled in this course
          const isEnrolled = userResponse.data.enrolledCourses?.includes(id);
          setUserEnrolled(isEnrolled);
          setLoadingUser(false);
        } catch (err) {
          console.error('Error fetching user data:', err);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setAuthAlert({
              severity: 'error',
              message: 'Your session has expired. Please log in again.',
            });
          }
          setLoadingUser(false);
        }
      };

      fetchUserData();
    }
  }, [id]);

  useEffect(() => {
    const fetchCourseAndProgress = async () => {
      try {
        setLoading(true);
        // Fetch course details
        const courseResponse = await axiosInstance.get(`/api/courses/${id}`);
        setCourse(courseResponse.data);

        // Fetch progress only if user is enrolled
        if (userEnrolled) {
          try {
            const progressResponse = await axiosInstance.get(
              `/api/progress/${id}`,
            );
            setProgress(progressResponse.data || []);
          } catch (progressErr) {
            console.error('Error fetching progress:', progressErr);
          }
        }

        setLoading(false);
      } catch (err) {
        setError('Course not found or error loading data');
        setLoading(false);
      }
    };

    // Only fetch course data after we've determined user enrollment status
    if (!loadingUser) {
      fetchCourseAndProgress();
    }
  }, [id, userEnrolled, loadingUser]);

  const handlePayment = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthAlert({
        severity: 'warning',
        message: 'Please log in to enroll in this course',
      });
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setProcessing(true);
      setPaymentStatus(null);

      const response = await axiosInstance.post('/api/stripe/checkout', {
        courseId: id,
      });

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
      setAuthAlert({
        severity: 'warning',
        message: 'Please log in to enroll in this course',
      });
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setProcessing(true);
      await axiosInstance.post(`/api/courses/${id}/enroll`);
      setUserEnrolled(true);
      setProcessing(false);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to enroll in course';
      setPaymentStatus({ type: 'error', message: errorMessage });
      setProcessing(false);
    }
  };

  const handleMarkCompleted = async (contentId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthAlert({
        severity: 'warning',
        message: 'Please log in to track your progress',
      });
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (!userEnrolled) {
      setPaymentStatus({
        type: 'warning',
        message: 'You need to enroll in this course to track your progress',
      });
      return;
    }

    try {
      await axiosInstance.post(`/api/progress/${id}/${contentId}`, {
        completed: true,
      });

      // Update progress state to reflect completion
      setProgress((prevProgress) => {
        const existingProgressIndex = prevProgress.findIndex(
          (p) => p.contentId === contentId,
        );
        if (existingProgressIndex >= 0) {
          const newProgress = [...prevProgress];
          newProgress[existingProgressIndex] = {
            ...newProgress[existingProgressIndex],
            completed: true,
          };
          return newProgress;
        } else {
          return [...prevProgress, { contentId, completed: true }];
        }
      });
    } catch (err) {
      console.error('Error marking content as completed:', err);
      if (err.response?.status === 401) {
        setAuthAlert({
          severity: 'error',
          message: 'Your session has expired. Please log in again.',
        });
        navigate('/login', { state: { from: `/courses/${id}` } });
      }
    }
  };

  const handleVideoEnded = async (contentId) => {
    if (userEnrolled) {
      await handleMarkCompleted(contentId);
    }
  };

  const isContentCompleted = (contentId) => {
    return progress.some((p) => p.contentId === contentId && p.completed);
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <PlayCircleOutlineIcon />;
      case 'markdown':
        return <DescriptionIcon />;
      case 'quiz':
        return <QuizIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

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

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity='error'>{error}</Alert>
      </Container>
    );
  }

  const selectedContent = course?.content?.[selectedContentIndex] || null;

  return (
    <Container maxWidth='xl' sx={{ py: 4 }} data-testid={dataTestId}>
      {course && (
        <Box>
          {/* Auth Alert */}
          {authAlert && (
            <Alert
              severity={authAlert.severity}
              sx={{ mb: 3 }}
              onClose={() => setAuthAlert(null)}
            >
              {authAlert.message}
            </Alert>
          )}

          {/* Course Header */}
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

          {/* Course description in markdown */}
          {course.markdownDescription && (
            <Paper variant='outlined' sx={{ p: 3, mb: 4 }}>
              <Typography variant='h6' component='h2' gutterBottom>
                Course Details
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
                    fontSize: '0.9em',
                  },
                  '& pre': {
                    p: 1.5,
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    borderRadius: 1,
                    overflowX: 'auto',
                  },
                  '& img': { maxWidth: '100%' },
                }}
              >
                <ReactMarkdown>
                  {sanitizeMarkdown(course.markdownDescription)}
                </ReactMarkdown>
              </Box>
            </Paper>
          )}

          {/* Course price and enrollment/payment buttons */}
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
                Duration: {course.duration} hours
              </Typography>
            </Box>

            <Box sx={{ alignSelf: { sm: 'flex-end' } }}>
              {!userEnrolled &&
                (course.price > 0 ? (
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
                ))}
            </Box>
          </Box>

          {/* Payment status messages */}
          {paymentStatus && (
            <Box sx={{ mb: 3 }}>
              <Alert severity={paymentStatus.type}>
                {paymentStatus.message}
              </Alert>
            </Box>
          )}

          {/* Course Content Section with Sidebar and Main Content */}
          {course.content && course.content.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant='h6' gutterBottom>
                Course Content
              </Typography>

              <Grid container spacing={3}>
                {/* Sidebar - Content Navigation */}
                <Grid item xs={12} md={3}>
                  <Paper variant='outlined' sx={{ p: 2 }}>
                    <List component='nav'>
                      {course.content.map((item, index) => (
                        <React.Fragment key={item.id || index}>
                          <ListItem
                            button
                            onClick={() => setSelectedContentIndex(index)}
                            selected={selectedContentIndex === index}
                          >
                            <ListItemIcon>
                              {!userEnrolled && index > 0 ? (
                                <LockIcon color='action' />
                              ) : (
                                getContentTypeIcon(item.type)
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.title}
                              secondary={item.type}
                              primaryTypographyProps={{
                                color:
                                  !userEnrolled && index > 0
                                    ? 'text.disabled'
                                    : 'inherit',
                              }}
                            />
                            {userEnrolled &&
                              isContentCompleted(
                                item.id || index.toString(),
                              ) && (
                                <CheckCircleIcon
                                  color='success'
                                  fontSize='small'
                                />
                              )}
                          </ListItem>
                          {index < course.content.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                {/* Main Content Area */}
                <Grid item xs={12} md={9}>
                  <Paper variant='outlined' sx={{ p: 3 }}>
                    {selectedContent ? (
                      <Box>
                        <Typography variant='h6' gutterBottom>
                          {selectedContent.title}
                        </Typography>
                        <Chip
                          label={selectedContent.type}
                          size='small'
                          color={
                            selectedContent.type === 'video'
                              ? 'primary'
                              : 'secondary'
                          }
                          sx={{ mb: 2 }}
                        />

                        {/* Content type-specific rendering */}
                        <Box sx={{ mt: 3 }}>
                          {/* For non-enrolled users, only show first item or preview */}
                          {!userEnrolled && selectedContentIndex > 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                              <LockIcon
                                sx={{
                                  fontSize: 60,
                                  color: 'text.secondary',
                                  mb: 2,
                                }}
                              />
                              <Typography variant='h6' gutterBottom>
                                Content Locked
                              </Typography>
                              <Typography
                                variant='body1'
                                color='text.secondary'
                                paragraph
                              >
                                You need to enroll in this course to access this
                                content.
                              </Typography>
                              {course.price > 0 ? (
                                <Button
                                  variant='contained'
                                  color='primary'
                                  onClick={handlePayment}
                                  disabled={processing}
                                  sx={{ mt: 2 }}
                                >
                                  {processing
                                    ? 'Processing...'
                                    : `Enroll for $${course.price}`}
                                </Button>
                              ) : (
                                <Button
                                  variant='contained'
                                  color='primary'
                                  onClick={handleEnrollFree}
                                  disabled={processing}
                                  sx={{ mt: 2 }}
                                >
                                  {processing
                                    ? 'Processing...'
                                    : 'Enroll for Free'}
                                </Button>
                              )}
                            </Box>
                          ) : (
                            <>
                              {selectedContent.type === 'video' &&
                                selectedContent.videoUrl && (
                                  <Box sx={{ my: 2 }}>
                                    <video
                                      width='100%'
                                      controls
                                      onEnded={() =>
                                        handleVideoEnded(
                                          selectedContent.id ||
                                            selectedContentIndex.toString(),
                                        )
                                      }
                                      src={selectedContent.videoUrl}
                                    >
                                      Your browser does not support the video
                                      tag.
                                    </video>
                                  </Box>
                                )}

                              {selectedContent.type === 'markdown' &&
                                selectedContent.content && (
                                  <Box
                                    sx={{
                                      mt: 2,
                                      width: '100%',
                                      '& p': { mb: 1.5 },
                                      '& h1, & h2, & h3, & h4, & h5, & h6': {
                                        mt: 2,
                                        mb: 1.5,
                                      },
                                      '& ul, & ol': { pl: 3, mb: 1.5 },
                                      '& code': {
                                        p: 0.5,
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                        borderRadius: 1,
                                        fontSize: '0.9em',
                                      },
                                    }}
                                  >
                                    <ReactMarkdown>
                                      {sanitizeMarkdown(
                                        selectedContent.content,
                                      )}
                                    </ReactMarkdown>
                                  </Box>
                                )}

                              {selectedContent.type === 'quiz' &&
                                selectedContent.content && (
                                  <Box sx={{ my: 2 }}>
                                    <Typography variant='body1' gutterBottom>
                                      {selectedContent.content}
                                    </Typography>
                                    <TextField
                                      fullWidth
                                      multiline
                                      rows={4}
                                      placeholder='Your answer'
                                      variant='outlined'
                                      sx={{ mt: 2 }}
                                      disabled={!userEnrolled}
                                    />
                                  </Box>
                                )}

                              {/* Mark as Completed button for enrolled users */}
                              {userEnrolled &&
                                selectedContent.type !== 'video' && (
                                  <Box sx={{ mt: 3 }}>
                                    <Button
                                      variant='outlined'
                                      color='primary'
                                      disabled={isContentCompleted(
                                        selectedContent.id ||
                                          selectedContentIndex.toString(),
                                      )}
                                      onClick={() =>
                                        handleMarkCompleted(
                                          selectedContent.id ||
                                            selectedContentIndex.toString(),
                                        )
                                      }
                                    >
                                      {isContentCompleted(
                                        selectedContent.id ||
                                          selectedContentIndex.toString(),
                                      )
                                        ? 'Completed'
                                        : 'Mark as Completed'}
                                    </Button>
                                  </Box>
                                )}
                            </>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        Select an item from the sidebar to view content.
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Paper variant='outlined' sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>
                No content available for this course.
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Container>
  );
}

export default CourseDetails;
