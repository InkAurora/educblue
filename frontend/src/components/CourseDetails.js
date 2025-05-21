import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '../utils/axiosConfig';
import CourseSidebar from './CourseSidebar';
import ProgressBar from './courses/ProgressBar';

// Helper function to sanitize markdown content
const sanitizeMarkdown = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(content);
};

// Helper function to get the appropriate icon based on content type
const getContentTypeIcon = (type) => {
  switch (type) {
    case 'video':
      return <PlayCircleOutlineIcon />;
    case 'quiz':
      return <QuizIcon />;
    case 'markdown':
    default:
      return <DescriptionIcon />;
  }
};

// Helper function to generate or ensure valid contentIds for MongoDB
const getValidContentId = (item, index) => {
  // If the item already has a valid MongoDB ObjectID format id, use it
  if (item.id && /^[0-9a-fA-F]{24}$/.test(item.id)) {
    return item.id;
  }
  // If the item has any id property, use that
  if (item.id) {
    return item.id;
  }
  // If item has _id property (MongoDB default), use that
  if (item._id) {
    return item._id;
  }
  // If we have an item object but no id, use the item's title
  // to create a consistent identifier (as a fallback)
  if (item.title) {
    // Create a hash from the title + index to use as a more consistent ID
    return `${item.title.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  // Last resort, just use a placeholder with index
  return `content-item-${index}`;
};

function CourseDetails({ 'data-testid': dataTestId, testId = null }) {
  const params = useParams();
  const id = testId || params?.id;
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

          // Check if user is admin (has admin privileges for any course)
          const userIsAdmin = user.role === 'admin';

          // Check if user is enrolled
          let userIsEnrolled = false;
          if (Array.isArray(user.enrolledCourses)) {
            userIsEnrolled = user.enrolledCourses.some((enrolledCourse) => {
              if (typeof enrolledCourse === 'string') {
                return enrolledCourse === id;
              }
              return (
                enrolledCourse?._id === id ||
                enrolledCourse?.id === id ||
                enrolledCourse?.courseId === id
              );
            });
          }

          setIsEnrolled(userIsEnrolled);
          setIsInstructor(userIsInstructor || userIsAdmin); // Admin has same privileges as instructor

          // If enrolled or instructor or admin, fetch progress
          if (userIsEnrolled || userIsInstructor) {
            try {
              const progressResponse = await axiosInstance.get(
                `/api/progress/${id}`,
              );

              // Handle new API response format with progressPercentage
              const responseData = progressResponse.data;

              if (
                responseData &&
                typeof responseData.progressPercentage === 'number'
              ) {
                // New API format
                setProgress(responseData.progressRecords || []);
                setProgressPercentage(responseData.progressPercentage);
              } else {
                // Old API format - just an array of progress records
                setProgress(responseData || []);
                // Calculate percentage based on the number of completed items
                if (
                  Array.isArray(responseData) &&
                  Array.isArray(courseResponse.data.content)
                ) {
                  const completedCount = responseData.filter(
                    (item) => item.completed,
                  ).length;
                  const totalCount = courseResponse.data.content.length;
                  const calculatedPercentage =
                    totalCount > 0
                      ? Math.round((completedCount / totalCount) * 100)
                      : 0;
                  setProgressPercentage(calculatedPercentage);
                }
              }
            } catch (progressErr) {
              console.error('Error fetching progress:', progressErr);
              setProgressPercentage(0);
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
    <Box
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
      }}
    >
      {course && (
        <>
          {/* Desktop sidebar - Only shown for enrolled users or instructors */}
          {(isEnrolled || isInstructor) && (
            <Box sx={{ display: { xs: 'none', md: 'block' }, flexShrink: 0 }}>
              <CourseSidebar
                course={course}
                progress={progress}
                progressPercentage={progressPercentage}
                courseId={id}
              />
            </Box>
          )}

          {/* Main Content Area */}
          <Box
            sx={{
              width: '100%',
              maxWidth: '100%',
              pb: 3,
              boxSizing: 'border-box',
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Course Header - visible to all users */}
            <Box sx={{ p: 3, width: '100%', maxWidth: '900px' }}>
              <Typography variant='h4' component='h1' gutterBottom>
                {course.title}
              </Typography>

              <Typography variant='body1' color='text.secondary' gutterBottom>
                Instructor: {course.instructor}
              </Typography>
              <Typography variant='body1' paragraph>
                {course.description}
              </Typography>

              {/* Progress Bar - only for enrolled users or instructors */}
              {(isEnrolled || isInstructor) && (
                <Box sx={{ my: 2, width: '100%' }}>
                  <ProgressBar percentage={progressPercentage} />
                </Box>
              )}

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
            </Box>

            {/* Course Description in Markdown */}
            {course.markdownDescription && (
              <Box
                sx={{
                  px: 3,
                  mb: 2,
                  boxSizing: 'border-box',
                  width: '100%',
                  maxWidth: '900px',
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    p: 3,
                    width: '100%',
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant='h6' gutterBottom fontWeight='bold'>
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
                </Box>
              </Box>
            )}

            {/* Only show mobile version of course contents for enrolled users */}
            {(isEnrolled || isInstructor) && (
              <Box
                sx={{
                  display: { xs: 'block', md: 'none' },
                  px: 3,
                  mb: 3,
                  width: '100%',
                  maxWidth: '900px',
                  boxSizing: 'border-box',
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'white',
                    border: '1px solid #e0e0e0',
                    p: 3,
                    width: '100%',
                    boxSizing: 'border-box',
                    overflowX: 'hidden',
                  }}
                >
                  <Typography variant='h6' gutterBottom fontWeight='bold'>
                    Course Contents
                  </Typography>
                  <List sx={{ p: 0, width: '100%' }}>
                    {course?.content?.map((item, index) => {
                      const contentId = getValidContentId(item, index);
                      const completed =
                        Array.isArray(progress) &&
                        progress.some(
                          (p) => p.contentId === contentId && p.completed,
                        );

                      return (
                        <ListItem
                          key={contentId}
                          component={Link}
                          to={`/courses/${id}/content/${contentId}`}
                          sx={{
                            borderBottom:
                              index < course.content.length - 1
                                ? '1px solid #eee'
                                : 'none',
                            py: 1.5,
                            px: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            textDecoration: 'none',
                            color: 'inherit',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              flex: 1,
                            }}
                          >
                            {getContentTypeIcon(item.type)}
                            <Typography sx={{ ml: 2, fontWeight: 500 }}>
                              {item.title}
                            </Typography>
                          </Box>
                          {completed && (
                            <CheckCircleIcon color='success' fontSize='small' />
                          )}
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

export default CourseDetails;
