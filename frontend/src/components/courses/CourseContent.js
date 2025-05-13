import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Button,
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
        // Log error
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
            (item, index) =>
              getValidContentId(item, index) === contentId ||
              getValidContentId(item, index)?.toString() === contentId,
          );

          // If not found by ID, try by index
          if (foundIndex === -1 && !Number.isNaN(parseInt(contentId, 10))) {
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
            userIsEnrolled = user.enrolledCourses.some((enrolledCourse) => {
              if (typeof enrolledCourse === 'string') {
                return enrolledCourse === id;
              }
              return (
                enrolledCourse?.id === id || enrolledCourse?.courseId === id
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
        // Log error
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
    return getValidContentId(prevItem, contentIndex - 1);
  };

  // Get next content ID (for navigation)
  const getNextContentId = () => {
    if (
      contentIndex === null ||
      !course?.content ||
      contentIndex >= (course?.content?.length ?? 0) - 1
    ) {
      return null;
    }

    const nextItem = course.content[contentIndex + 1];
    return getValidContentId(nextItem, contentIndex + 1);
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

  // Constants for layout calculations
  const sidebarWidth = 300;
  const navbarHeight = 64; // Standard AppBar height
  const contentNavHeight = 48; // Content navigation height

  // Return the main component structure with proper block divisions
  return course && content ? (
    <Box
      sx={{
        display: 'grid',
        height: '100%', // Changed from 100vh to 100% to fit within parent container
        width: '100%',
        // Desktop: 4-block layout with sidebar
        // Mobile: 2-block layout (nav+topbar and content)
        gridTemplateColumns: { xs: '1fr', md: `${sidebarWidth}px 1fr` },
        gridTemplateRows: {
          xs: `${contentNavHeight}px 1fr`,
          md: `${contentNavHeight}px 1fr`,
        },
        gridTemplateAreas: {
          xs: `
            "topnav"
            "content"
          `,
          md: `
            "sidebar topnav"
            "sidebar content"
          `,
        },
        overflow: 'hidden', // Prevent overall container scrolling
      }}
      data-testid={dataTestId}
    >
      {/* Sidebar - Desktop only, left side from below navbar to bottom */}
      <Box
        sx={{
          gridArea: 'sidebar',
          display: { xs: 'none', md: 'block' },
          overflow: 'auto',
          borderRight: 1,
          borderColor: 'divider',
          height: '100%',
        }}
      >
        <CourseSidebar course={course} progress={progress} courseId={id} />
      </Box>

      {/* Content Navigation Topbar - Top right in desktop, top in mobile */}
      <Box
        sx={{
          gridArea: 'topnav',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <ContentNavigation
          courseId={id}
          title={content.title}
          previousContentId={getPreviousContentId()}
          nextContentId={getNextContentId()}
        />
      </Box>

      {/* Content Area - Only this block scrolls */}
      <Box
        sx={{
          gridArea: 'content',
          overflow: 'auto', // This is the only scrollable area
          p: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {isMobile ? (
          // On mobile, render content without the Paper wrapper
          <ContentRenderer
            contentItem={content}
            isCompleted={isContentCompleted()}
            completing={completing}
            onCompleted={markContentCompleted}
            error={error}
            progress={progress}
            courseId={id}
          />
        ) : (
          // On desktop, keep the Paper wrapper
          <Paper sx={{ p: 3, maxWidth: '900px', mx: 'auto' }}>
            <ContentRenderer
              contentItem={content}
              isCompleted={isContentCompleted()}
              completing={completing}
              onCompleted={markContentCompleted}
              error={error}
              progress={progress}
              courseId={id}
            />
          </Paper>
        )}
      </Box>
    </Box>
  ) : null;
}

export default CourseContent;
