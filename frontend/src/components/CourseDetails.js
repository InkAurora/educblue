import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosInstance from '../utils/axiosConfig';
import { convertMarkdownToHTML } from '../utils/markdownUtils';
import CourseSidebar from './CourseSidebar';
import ProgressBar from './courses/ProgressBar';

function CourseDetails({ testId = null }) {
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
            user._id === courseResponse.data.instructor?._id ||
            user.fullName === courseResponse.data.instructor?.fullName ||
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
      if (response.data && response.data.url) {
        // Store courseId in localStorage before redirecting to Stripe
        localStorage.setItem('enrollingCourseId', id);
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        // Fallback or error if URL is not in response
        setPaymentStatus({
          type: 'error',
          message: 'Could not retrieve checkout session. Please try again.',
        });
      }

      // For now, just set dummy success response
      // setPaymentStatus({
      //   type: 'success',
      //   message: 'Payment initiated. You will be redirected to checkout.',
      // });

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
      await axiosInstance.post('/api/enroll/free', {
        courseId: id,
      });
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
                Instructor: {course.instructor?.fullName || course.instructor}
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
                      {processing ? 'Processing...' : 'Buy Course'}
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
                      overflow: 'hidden',
                      maxWidth: '100%',
                      width: '100%',
                      wordWrap: 'break-word',
                      '& *': {
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: convertMarkdownToHTML(course.markdownDescription),
                    }}
                  />
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
                    Course Sections
                  </Typography>
                  <List sx={{ p: 0, width: '100%' }}>
                    {course?.sections?.map((section, index) => {
                      const sectionId = section._id || section.id;
                      const contentCount = section.content?.length || 0;

                      // Get the first content item of this section for the URL
                      const firstContent = section.content?.[0];
                      const firstContentId =
                        firstContent?._id || firstContent?.id;

                      // Generate URL - if section has content, link to first content, otherwise to section
                      const sectionUrl = firstContentId
                        ? `/courses/${id}/sections/${sectionId}/content/${firstContentId}`
                        : `/courses/${id}/sections/${sectionId}`;

                      // Check if all content in this section is completed
                      const hasCompletedContent =
                        Array.isArray(progress) &&
                        section.content?.length > 0 &&
                        section.content.every((contentItem) => {
                          const contentId = contentItem._id || contentItem.id;
                          return progress.some(
                            (p) => p.contentId === contentId && p.completed,
                          );
                        });

                      return (
                        <ListItem
                          key={sectionId}
                          component={Link}
                          to={sectionUrl}
                          sx={{
                            borderBottom:
                              index < course.sections.length - 1
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
                            <Box>
                              <Typography sx={{ fontWeight: 500 }}>
                                {section.title}
                              </Typography>
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                {contentCount}{' '}
                                {contentCount === 1 ? 'item' : 'items'}
                                {section.description &&
                                  ` • ${section.description}`}
                              </Typography>
                            </Box>
                          </Box>
                          {hasCompletedContent && (
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
