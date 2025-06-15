import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Drawer,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MenuIcon from '@mui/icons-material/Menu';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import QuizIcon from '@mui/icons-material/Quiz';
import ProgressBar from './courses/ProgressBar';
import axiosInstance from '../utils/axiosConfig';

/**
 * CourseSidebar component displays a persistent sidebar showing course content navigation.
 * It collapses to a toggle button on mobile devices.
 */
function CourseSidebar({ course, progress, progressPercentage, courseId }) {
  const [open, setOpen] = useState(false);
  const [contentList, setContentList] = useState(course?.content || []);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navbarHeight = 64; // Standard AppBar height in Material UI
  const [sidebarToggleContainer, setSidebarToggleContainer] = useState(null);  // Fetch course sections for sidebar
  useEffect(() => {
    const fetchContentList = async () => {
      try {
        const res = await axiosInstance.get(
          `/api/courses/${courseId}/sections`,
        );
        setContentList(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        // ignore load errors
      }
    };
    fetchContentList();
  }, [courseId]);

  useEffect(() => {
    // Find the container element in the navbar where we'll render the toggle button
    const container = document.getElementById('course-sidebar-container');
    setSidebarToggleContainer(container);
  }, []);

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

  const toggleDrawer = () => {
    setOpen(!open);
  };
  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <PlayCircleOutlineIcon />;
      case 'quiz':
      case 'multipleChoice':
        return <QuizIcon />;
      case 'document':
      case 'markdown':
      default:
        return <DescriptionIcon />;
    }
  };

  // Helper function to make content types more user-friendly
  const getContentTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return 'Video Lesson';
      case 'quiz':
        return 'Quiz';
      case 'document':
        return 'Document';
      case 'markdown':
        return 'Reading Material';
      case 'multiplechoice':
        return 'Multiple Choice Quiz';
      default:
        // Capitalize first letter and replace underscores/hyphens with spaces
        return type
          ? type.charAt(0).toUpperCase() + type.slice(1).replace(/[_-]/g, ' ')
          : 'Content';
    }
  };

  const isContentCompleted = (contentId) =>
    Array.isArray(progress) &&
    progress.some((p) => p.contentId === contentId && p.completed);

  const drawerWidth = 300;

  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
      }}
    >
      <Box>
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #02e6ef 0%, #02e6ef 100%)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Typography
            variant='h6'
            noWrap
            component='div'
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              mb: 1,
            }}
          >
            {course?.title}
          </Typography>
          <Typography
            variant='body2'
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Instructor: {course?.instructor}
          </Typography>
        </Box>        <List
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            py: 1,
            '& .MuiListItem-root': {
              px: 1,
            },
          }}
        >
          {contentList.map((section, sectionIndex) => (
            <React.Fragment key={section._id || section.id || `section-${sectionIndex}`}>
              {/* Section Header */}
              <Box sx={{ px: 2, py: 1, bgcolor: 'rgba(0, 0, 0, 0.05)' }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '0.9rem',
                  }}
                >
                  {section.title}
                </Typography>
                {section.description && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    {section.description}
                  </Typography>
                )}
              </Box>
              
              {/* Section Content Items */}
              {section.content && Array.isArray(section.content) && section.content.map((item, index) => {
                const contentId = getValidContentId(item, index);
                const completed = isContentCompleted(contentId);
                const isLastItem = section.content.length > index + 1;

                return (
                  <React.Fragment key={contentId}>
                    <ListItem disablePadding sx={{ pl: 2 }}>
                      <ListItemButton
                        component={Link}
                        to={`/courses/${courseId}/sections/${section._id || section.id}/content/${contentId}`}
                        sx={{
                          py: 1.5,
                          '&:hover': {
                            backgroundColor: 'rgba(0, 191, 165, 0.08)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getContentTypeIcon(item.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.title}
                          secondary={getContentTypeLabel(item.type)}
                          primaryTypographyProps={{
                            fontWeight: 500,
                            fontSize: '0.95rem',
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: 'text.secondary',
                          }}
                        />
                        {completed && (
                          <CheckCircleIcon color='success' fontSize='small' />
                        )}
                      </ListItemButton>
                    </ListItem>
                    {isLastItem && <Divider sx={{ ml: 4 }} />}
                  </React.Fragment>
                );
              })}
              
              {/* Divider between sections */}
              {contentList.length > sectionIndex + 1 && (
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>

      {/* Progress bar fixed at the bottom of sidebar */}
      <Box sx={{ mt: 'auto', p: 2, borderTop: 1, borderColor: 'divider' }}>
        <ProgressBar percentage={progressPercentage || 0} />
      </Box>
    </Box>
  );

  // Create the toggle button that will be rendered in the navbar
  const renderToggleButton = () => {
    if (!isMobile || !sidebarToggleContainer) return null;

    return ReactDOM.createPortal(
      <IconButton
        color='inherit'
        aria-label='open course sidebar'
        edge='start'
        onClick={toggleDrawer}
        data-testid='course-sidebar-toggle'
      >
        <MenuIcon />
      </IconButton>,
      sidebarToggleContainer,
    );
  };

  return (
    <>
      {/* Render the toggle button in the navbar for mobile view */}
      {renderToggleButton()}

      {isMobile ? (
        <Drawer
          anchor='left'
          open={open}
          onClose={toggleDrawer}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              marginTop: 0, // Remove margin so drawer goes to the top
              top: 0, // Start from the very top of the screen
              height: '100%',
              zIndex: 1300, // Higher z-index to appear above navbar
            },
          }}
          data-testid='course-sidebar-mobile'
        >
          {/* Add a colored header to match the navbar */}
          <Box
            sx={{
              height: navbarHeight,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              px: 2,
              color: 'white',
            }}
          >
            <Typography variant='h6' component='div'>
              Course Content
            </Typography>
          </Box>
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant='permanent'
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              position: 'fixed',
              height: `calc(100vh - ${navbarHeight}px)`, // Adjust height to account for navbar
              top: `${navbarHeight}px`, // Start the sidebar below the navbar
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'hidden', // Hide overflow for the drawer itself
              zIndex: 900, // Lower z-index than typical AppBar (which is 1100)
            },
          }}
          data-testid='course-sidebar-desktop'
        >
          {drawerContent}
        </Drawer>
      )}
    </>
  );
}

CourseSidebar.propTypes = {
  course: PropTypes.shape({
    title: PropTypes.string.isRequired,
    instructor: PropTypes.string.isRequired,
    content: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      }),
    ).isRequired,
  }).isRequired,
  progress: PropTypes.arrayOf(
    PropTypes.shape({
      contentId: PropTypes.string.isRequired,
      completed: PropTypes.bool.isRequired,
    }),
  ),
  progressPercentage: PropTypes.number,
  courseId: PropTypes.string.isRequired,
};

CourseSidebar.defaultProps = {
  progress: [],
  progressPercentage: 0,
};

export default CourseSidebar;
