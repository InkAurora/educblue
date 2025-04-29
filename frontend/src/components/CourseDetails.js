import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import LockIcon from '@mui/icons-material/Lock';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axiosInstance from '../utils/axiosConfig';

// Initialize Stripe promise - you'll need to replace with your actual publishable key
const stripePromise = loadStripe(
  'pk_test_51RJ4FNIGbNBdCt2nKx8xXTObOdFj0PpF5Ts667aDg9AfiN41zgtiAleTgf6JbeITw3fGrb2OASOpIxK5Wdkd14yY00v1uE8DSM',
);

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
        // Call the existing user endpoint to get fresh enrollment data
        const userResponse = await axiosInstance.get(
          'http://localhost:5000/api/users/me',
        );
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
    // Add a dependency so this effect re-runs when coming back from the success page
    // This ensures we get fresh enrollment data after payment
  }, [window.location.href]);

  // Fetch course data and check enrollment status
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const courseResponse = await axiosInstance.get(
          `http://localhost:5000/api/courses/${id}`,
        );
        setCourse(courseResponse.data);

        if (user) {
          // Check if user is enrolled or is the instructor
          const userIsInstructor =
            user.fullName === courseResponse.data.instructor;

          // Enhanced enrollment check
          let userIsEnrolled = false;

          if (Array.isArray(user.enrolledCourses)) {
            // Handle different possible formats of enrolledCourses data
            userIsEnrolled = user.enrolledCourses.some((course) => {
              if (typeof course === 'string') {
                return course === id;
              } else if (course && typeof course === 'object') {
                return (
                  course.id === id ||
                  course._id === id ||
                  course.courseId === id
                );
              }
              return false;
            });
          }

          setIsEnrolled(userIsEnrolled);
          setIsInstructor(userIsInstructor);

          // If enrolled or instructor, fetch progress
          if (userIsEnrolled || userIsInstructor) {
            try {
              const progressResponse = await axiosInstance.get(
                `http://localhost:5000/api/progress/${id}`,
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

      // Store the course ID in localStorage before redirecting to Stripe
      localStorage.setItem('enrollingCourseId', id);

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
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    try {
      setProcessing(true);
      await axiosInstance.post(`/api/courses/${id}/enroll`);
      setIsEnrolled(true);
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
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (!isEnrolled && !isInstructor) {
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
        }
        return [...prevProgress, { contentId, completed: true }];
      });
    } catch (err) {
      console.error('Error marking content as completed:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { state: { from: `/courses/${id}` } });
      }
    }
  };

  const handleVideoEnded = async (contentId) => {
    if (isEnrolled || isInstructor) {
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

          {/* Course description in markdown - visible to all users */}
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

          {/* Course price and enrollment/payment buttons - only for non-enrolled users */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              mb: 4,
            }}
          >
            <Box sx={{ mb: { xs: 2, sm: 0 } }}>
              {/* Only show price if user is not enrolled */}
              {!isEnrolled && (
                <Typography variant='h5' color='primary' gutterBottom>
                  ${course.price}
                </Typography>
              )}
              {/* Show "Enrolled" badge for enrolled users */}
              {isEnrolled && (
                <Typography variant='h6' color='success.main' gutterBottom>
                  <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Enrolled
                </Typography>
              )}
              <Typography variant='body2' color='text.secondary'>
                Duration: {course.duration} hours
              </Typography>
            </Box>

            <Box sx={{ alignSelf: { sm: 'flex-end' } }}>
              {!isEnrolled &&
                !isInstructor &&
                (course.price > 0 ? (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handlePayment}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Enroll Now'}
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

          {/* Course Content Section */}
          {course.content && course.content.length > 0 ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant='h6' gutterBottom>
                Course Content
              </Typography>

              {/* Enhanced Access warning for non-enrolled users */}
              {!isEnrolled && !isInstructor && (
                <Card
                  sx={{
                    mb: 3,
                    border: '1px solid #3f51b5',
                    backgroundColor: '#eef1fa',
                  }}
                >
                  <CardContent
                    sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <ErrorOutlineIcon color='primary' fontSize='large' />
                    <Box>
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'bold', color: '#3f51b5' }}
                      >
                        Locked Content
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        You need to enroll in this course to access the full
                        content.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Grid container spacing={3}>
                {/* Sidebar - Content Navigation - Only shown if enrolled or instructor */}
                {(isEnrolled || isInstructor) && (
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
                                {getContentTypeIcon(item.type)}
                              </ListItemIcon>
                              <ListItemText
                                primary={item.title}
                                secondary={item.type}
                              />
                              {isContentCompleted(
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
                )}

                {/* Main Content Area */}
                <Grid item xs={12} md={isEnrolled || isInstructor ? 9 : 12}>
                  <Paper variant='outlined' sx={{ p: 3 }}>
                    {/* Content for non-enrolled users */}
                    {!isEnrolled && !isInstructor ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Card
                          sx={{
                            backgroundColor: '#eef1fa',
                            border: '1px solid #3f51b5',
                            maxWidth: 500,
                            margin: '0 auto',
                            p: 2,
                          }}
                        >
                          <CardContent>
                            <LockIcon
                              sx={{
                                fontSize: 80,
                                color: '#3f51b5',
                                mb: 2,
                              }}
                            />
                            <Typography
                              variant='h5'
                              gutterBottom
                              sx={{ color: '#3f51b5', fontWeight: 'bold' }}
                            >
                              Locked Content
                            </Typography>
                            <Typography
                              variant='body1'
                              color='text.secondary'
                              paragraph
                              sx={{ mb: 3 }}
                            >
                              This course content is only available to enrolled
                              students. Please enroll to access all lessons,
                              videos, and course materials.
                            </Typography>
                            {course.price > 0 ? (
                              <Button
                                variant='contained'
                                color='primary'
                                onClick={handlePayment}
                                disabled={processing}
                                size='large'
                                fullWidth
                              >
                                {processing
                                  ? 'Processing...'
                                  : `Enroll Now - $${course.price}`}
                              </Button>
                            ) : (
                              <Button
                                variant='contained'
                                color='primary'
                                onClick={handleEnrollFree}
                                disabled={processing}
                                size='large'
                                fullWidth
                              >
                                {processing
                                  ? 'Processing...'
                                  : 'Enroll For Free'}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    ) : selectedContent ? (
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
                                  Your browser does not support the video tag.
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
                                  {sanitizeMarkdown(selectedContent.content)}
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
                                />
                              </Box>
                            )}

                          {/* Mark as Completed button */}
                          {selectedContent.type !== 'video' && (
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
          ) : // Show locked content warning for empty courses when user is not enrolled
          !isEnrolled && !isInstructor ? (
            <Paper variant='outlined' sx={{ p: 3, mt: 4 }}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Card
                  sx={{
                    backgroundColor: '#eef1fa',
                    border: '1px solid #3f51b5',
                    maxWidth: 500,
                    margin: '0 auto',
                    p: 2,
                  }}
                >
                  <CardContent>
                    <LockIcon
                      sx={{
                        fontSize: 80,
                        color: '#3f51b5',
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant='h5'
                      gutterBottom
                      sx={{ color: '#3f51b5', fontWeight: 'bold' }}
                    >
                      Locked Content
                    </Typography>
                    <Typography
                      variant='body1'
                      color='text.secondary'
                      paragraph
                      sx={{ mb: 3 }}
                    >
                      This course content is only available to enrolled
                      students. Please enroll to access all course materials.
                    </Typography>
                    {course.price > 0 ? (
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={handlePayment}
                        disabled={processing}
                        size='large'
                        fullWidth
                      >
                        {processing
                          ? 'Processing...'
                          : `Enroll Now - $${course.price}`}
                      </Button>
                    ) : (
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={handleEnrollFree}
                        disabled={processing}
                        size='large'
                        fullWidth
                      >
                        {processing ? 'Processing...' : 'Enroll For Free'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Paper>
          ) : (
            <Paper variant='outlined' sx={{ p: 3, mt: 4 }}>
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
