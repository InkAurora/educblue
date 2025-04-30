import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import axiosInstance from '../../utils/axiosConfig';
import CourseSidebar from '../CourseSidebar';
import ContentNavigation from './content/ContentNavigation';
import ContentRenderer from './content/ContentRenderer';
import useCourseProgress from '../../hooks/useCourseProgress';

function CourseContent({ 'data-testid': dataTestId }) {
  const { id, contentId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State variables
  const [course, setCourse] = useState(null);
  const [content, setContent] = useState(null);
  const [contentIndex, setContentIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Use our custom hook for progress tracking
  const { progress, completing, markContentCompleted, isContentCompleted } =
    useCourseProgress(id, contentId);

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

  // Fetch course data and content
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
              <ContentNavigation
                courseId={id}
                title={content.title}
                previousContentId={getPreviousContentId()}
                nextContentId={getNextContentId()}
              />

              {/* Content Renderer */}
              <ContentRenderer
                contentItem={content}
                isCompleted={isContentCompleted()}
                completing={completing}
                onCompleted={markContentCompleted}
              />
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
