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
import ContentNavigation from './content/ContentNavigation';
import ContentRenderer from './content/ContentRenderer';
import useCourseProgress from '../../hooks/useCourseProgress';

function CourseContent({ 'data-testid': dataTestId }) {
  const { id, sectionId, contentId } = useParams();
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

  // Use our custom hook for progress tracking - now with enhanced function and state
  const {
    progress,
    completing,
    markContentCompleted,
    isContentCompleted,
    refreshProgress,
  } = useCourseProgress(id, sectionId, contentId);

  // Handler for content completion that also updates the progress bar
  const handleContentCompleted = async () => {
    const success = await markContentCompleted();
    if (success) {
      // Refresh progress to update the progress bar
      await refreshProgress();
    }
    return success;
  };

  // Fetch user data with JWT token
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoadingUser(false);
        navigate('/login', {
          state: {
            from: `/courses/${id}/sections/${sectionId}/content/${contentId}`,
          },
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
            state: {
              from: `/courses/${id}/sections/${sectionId}/content/${contentId}`,
            },
          });
        }
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [id, contentId, navigate]);

  // Fetch course metadata, content list, and content item
  useEffect(() => {
    const fetchCourseAndContentData = async () => {
      try {
        setLoading(true);

        // Fetch course metadata
        const courseResponse = await axiosInstance.get(`/api/courses/${id}`);
        const courseData = courseResponse.data;

        // Fetch list of course sections for sidebar
        const listResponse = await axiosInstance.get(
          `/api/courses/${id}/sections`,
        );
        const sections = Array.isArray(listResponse.data)
          ? listResponse.data
          : [];

        // Flatten sections into a content list for navigation
        let list = [];
        sections.forEach((section) => {
          if (section.content && Array.isArray(section.content)) {
            list = list.concat(section.content);
          }
        });

        // If new summary list is empty, fall back to original courseData.content
        if (list.length === 0 && Array.isArray(courseData.content)) {
          list = courseData.content;
        }

        // Set course data with sections for sidebar, but use flattened list for navigation
        setCourse({ ...courseData, content: list, sections });

        // Fetch the single content item by ID using the new section-based endpoint
        const contentResponse = await axiosInstance.get(
          `/api/courses/${id}/sections/${sectionId}/content/${contentId}`,
        );
        // Use raw response data as the content item
        setContent(contentResponse.data);

        // Determine the index of this content in the list for navigation
        const foundIndex = list.findIndex((item, idx) => {
          const validId = getValidContentId(item, idx);
          return validId === contentId || validId?.toString() === contentId;
        });
        setContentIndex(foundIndex);

        // Check if user is enrolled or instructor
        if (user) {
          // Handle both old string format and new object format for instructor
          const userIsInstructor =
            courseData.instructor === user.fullName || // Old format
            (typeof courseData.instructor === 'object' &&
              courseData.instructor?.fullName === user.fullName) || // New format
            (typeof courseData.instructor === 'object' &&
              courseData.instructor?._id === user._id); // New format by ID

          // Check enrollment
          let userIsEnrolled = false;
          if (Array.isArray(user.enrolledCourses)) {
            userIsEnrolled = user.enrolledCourses.some((enrolledCourse) => {
              if (typeof enrolledCourse === 'string') {
                return enrolledCourse === id;
              }
              // Handle cases where enrolledCourse is an object
              if (
                typeof enrolledCourse === 'object' &&
                enrolledCourse !== null
              ) {
                // Check for various possible ID properties
                return (
                  enrolledCourse.id === id ||
                  enrolledCourse._id === id || // Common MongoDB ID field
                  enrolledCourse.courseId === id
                );
              }
              return false;
            });
          }

          setIsInstructor(userIsInstructor);
          setIsEnrolled(userIsEnrolled);

          // Authorization will be handled in the component render logic
        }

        setLoading(false);
      } catch (err) {
        // Log error
        setError('Failed to load course content');
        setLoading(false);
      }
    };

    // Only fetch protected course/content after user is loaded
    if (!loadingUser && user) {
      fetchCourseAndContentData();
    }
  }, [id, sectionId, contentId, user, loadingUser, navigate]);

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

  // Handle unauthorized access - only check after course data is loaded
  if (
    course &&
    user &&
    !isEnrolled &&
    !isInstructor &&
    user?.role !== 'admin'
  ) {
    // Add admin check
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
  const contentNavHeight = 48; // Content navigation height
  // Return the main component structure - simplified layout without sidebar
  return course && content ? (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
      }}
      data-testid={dataTestId}
    >
      {/* Content Navigation Topbar */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          height: `${contentNavHeight}px`,
          flexShrink: 0,
        }}
      >
        <ContentNavigation
          courseId={id}
          title={content.title}
          previousContentId={getPreviousContentId()}
          nextContentId={getNextContentId()}
        />
      </Box>

      {/* Content Area - This is the main scrollable area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {isMobile ? (
          // On mobile, render content without the Paper wrapper
          <ContentRenderer
            contentItem={content}
            isCompleted={isContentCompleted()}
            completing={completing}
            onCompleted={handleContentCompleted}
            error={error}
            progress={progress}
            courseId={id}
            isInstructor={isInstructor}
          />
        ) : (
          // On desktop, keep the Paper wrapper
          <Paper sx={{ p: 3, maxWidth: '900px', mx: 'auto' }}>
            <ContentRenderer
              contentItem={content}
              isCompleted={isContentCompleted()}
              completing={completing}
              onCompleted={handleContentCompleted}
              error={error}
              progress={progress}
              courseId={id}
              isInstructor={isInstructor}
            />
          </Paper>
        )}
      </Box>
    </Box>
  ) : null;
}

export default CourseContent;
