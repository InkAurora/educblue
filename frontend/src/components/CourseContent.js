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
  TextField,
  Toolbar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import axiosInstance from '../utils/axiosConfig';
import CourseSidebar from './CourseSidebar';

// Helper function to sanitize markdown content
export const sanitizeMarkdown = (content) => {
  if (!content) return '';
  return DOMPurify.sanitize(content);
};

function CourseContent({ 'data-testid': dataTestId }) {
  const { id, contentId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [contentIndex, setContentIndex] = useState(null);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [completing, setCompleting] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch user data with JWT token
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoadingUser(false);
        navigate('/login', {
          state: { from: `/courses/${id}/content/${contentId}` },
        });
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
          navigate('/login', {
            state: { from: `/courses/${id}/content/${contentId}` },
          });
        }
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [id, contentId, navigate]);

  // Fetch course data, content and progress
  useEffect(() => {
    const fetchCourseAndContentData = async () => {
      try {
        setLoading(true);

        // Fetch course data
        const courseResponse = await axiosInstance.get(`/api/courses/${id}`);
        const courseData = courseResponse.data;
        setCourse(courseData);

        // Find content and its index
        let foundContent = null;
        let foundIndex = -1;

        if (Array.isArray(courseData.content)) {
          // First try to find by ID match
          foundIndex = courseData.content.findIndex(
            (item) =>
              item.id === contentId || item.id?.toString() === contentId,
          );

          // If not found by ID, try by index
          if (foundIndex === -1 && !isNaN(parseInt(contentId, 10))) {
            foundIndex = parseInt(contentId, 10);
            if (foundIndex >= 0 && foundIndex < courseData.content.length) {
              foundContent = courseData.content[foundIndex];
            }
          } else if (foundIndex !== -1) {
            foundContent = courseData.content[foundIndex];
          }
        }

        // If content not found, show error
        if (!foundContent) {
          setError('Content not found');
          setLoading(false);
          return;
        }

        setContent(foundContent);
        setContentIndex(foundIndex);

        // Check if user is enrolled or instructor
        if (user) {
          const userIsInstructor = user.fullName === courseData.instructor;

          // Check enrollment
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

          setIsInstructor(userIsInstructor);
          setIsEnrolled(userIsEnrolled);

          // If not authorized, redirect to course details
          if (!userIsEnrolled && !userIsInstructor) {
            navigate(`/courses/${id}`);
            return;
          }

          // Fetch progress data
          try {
            const progressResponse = await axiosInstance.get(
              `/api/progress/${id}`,
            );
            setProgress(progressResponse.data || []);
          } catch (progressErr) {
            console.error('Error fetching progress data:', progressErr);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError('Failed to load course content');
        setLoading(false);
      }
    };

    if (!loadingUser && user) {
      fetchCourseAndContentData();
    }
  }, [id, contentId, user, loadingUser, navigate]);

  // Handle marking content as completed
  const handleMarkCompleted = async () => {
    if (!content) return;

    try {
      setCompleting(true);

      // Make API call to mark content as completed
      await axiosInstance.post(`/api/progress/${id}/${contentId}`, {
        completed: true,
      });

      // Update progress state
      setProgress((prevProgress) => {
        const existingProgressIndex = prevProgress.findIndex(
          (p) => p.contentId === contentId,
        );

        if (existingProgressIndex >= 0) {
          // Update existing progress entry
          const newProgress = [...prevProgress];
          newProgress[existingProgressIndex] = {
            ...newProgress[existingProgressIndex],
            completed: true,
          };
          return newProgress;
        }

        // Add new progress entry
        return [...prevProgress, { contentId, completed: true }];
      });

      setCompleting(false);
    } catch (err) {
      console.error('Error marking content as completed:', err);
      setCompleting(false);
    }
  };

  // Check if content is completed
  const isContentCompleted = () => {
    return progress.some((p) => p.contentId === contentId && p.completed);
  };

  // Get previous content ID (for navigation)
  const getPreviousContentId = () => {
    if (contentIndex === null || contentIndex <= 0 || !course?.content) {
      return null;
    }

    const prevItem = course.content[contentIndex - 1];
    return prevItem.id || (contentIndex - 1).toString();
  };

  // Get next content ID (for navigation)
  const getNextContentId = () => {
    if (
      contentIndex === null ||
      contentIndex >= course?.content?.length - 1 ||
      !course?.content
    ) {
      return null;
    }

    const nextItem = course.content[contentIndex + 1];
    return nextItem.id || (contentIndex + 1).toString();
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

  // Handle unauthorized access
  if (!isEnrolled && !isInstructor) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity='warning'>
          You need to be enrolled in this course to view this content.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant='contained'
            color='primary'
            component={Link}
            to={`/courses/${id}`}
          >
            Go to Course Details
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='xl' sx={{ py: 4 }} data-testid={dataTestId}>
      {course && content && (
        <Grid container spacing={3}>
          {/* Sidebar - Only visible on desktop */}
          <Grid
            item
            xs={12}
            md={3}
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            <CourseSidebar course={course} progress={progress} courseId={id} />
          </Grid>

          {/* Main Content Area */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3 }}>
              {/* Navigation Topbar */}
              <Toolbar
                sx={{
                  px: { xs: 1, sm: 2 },
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 3,
                }}
                disableGutters
              >
                {/* Previous Button */}
                <Button
                  startIcon={<NavigateBeforeIcon />}
                  component={Link}
                  to={
                    getPreviousContentId()
                      ? `/courses/${id}/content/${getPreviousContentId()}`
                      : '#'
                  }
                  disabled={!getPreviousContentId()}
                  data-testid='prev-button'
                >
                  Previous
                </Button>

                {/* Content Title */}
                <Typography
                  variant='h6'
                  component='div'
                  sx={{
                    flexGrow: 1,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: { xs: 'nowrap', sm: 'normal' },
                  }}
                  data-testid='content-title'
                >
                  {content.title}
                </Typography>

                {/* Next Button */}
                <Button
                  endIcon={<NavigateNextIcon />}
                  component={Link}
                  to={
                    getNextContentId()
                      ? `/courses/${id}/content/${getNextContentId()}`
                      : '#'
                  }
                  disabled={!getNextContentId()}
                  data-testid='next-button'
                >
                  Next
                </Button>
              </Toolbar>

              {/* Content Type Badge */}
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mb: 2 }}
                data-testid='content-type'
              >
                {content.type?.charAt(0).toUpperCase() + content.type?.slice(1)}
              </Typography>

              {/* Content Rendering Based on Type */}
              <Box sx={{ mt: 3 }}>
                {/* Video Content */}
                {content.type === 'video' && content.videoUrl && (
                  <Box sx={{ mb: 4 }} data-testid='video-content'>
                    <video
                      width='100%'
                      controls
                      onEnded={handleMarkCompleted}
                      data-testid='video-player'
                    >
                      <source src={content.videoUrl} type='video/mp4' />
                      Your browser does not support the video tag.
                    </video>
                  </Box>
                )}

                {/* Markdown Content */}
                {content.type === 'markdown' && content.content && (
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
                    data-testid='markdown-content'
                  >
                    <ReactMarkdown>
                      {sanitizeMarkdown(content.content)}
                    </ReactMarkdown>
                  </Box>
                )}

                {/* Quiz Content */}
                {content.type === 'quiz' && content.content && (
                  <Box sx={{ mb: 4 }} data-testid='quiz-content'>
                    <Typography variant='body1' paragraph>
                      {content.content}
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder='Your answer...'
                      variant='outlined'
                      sx={{ mt: 2 }}
                      data-testid='quiz-answer-field'
                    />
                  </Box>
                )}

                {/* Mark as Completed Button (for non-video content) */}
                {content.type !== 'video' && (
                  <Box
                    sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}
                  >
                    <Button
                      variant='outlined'
                      color='primary'
                      onClick={handleMarkCompleted}
                      disabled={isContentCompleted() || completing}
                      startIcon={
                        isContentCompleted() ? <CheckCircleIcon /> : null
                      }
                      data-testid='complete-button'
                    >
                      {isContentCompleted()
                        ? 'Completed'
                        : completing
                          ? 'Marking...'
                          : 'Mark as Completed'}
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Mobile Sidebar */}
          <Grid
            item
            xs={12}
            sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}
          >
            <CourseSidebar course={course} progress={progress} courseId={id} />
          </Grid>
        </Grid>
      )}
    </Container>
  );
}

export default CourseContent;
