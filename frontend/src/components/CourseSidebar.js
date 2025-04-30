import React, { useState } from 'react';
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

/**
 * CourseSidebar component displays a persistent sidebar showing course content navigation.
 * It collapses to a toggle button on mobile devices.
 */
function CourseSidebar({ course, progress, courseId }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const toggleDrawer = () => {
    setOpen(!open);
  };

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

  const isContentCompleted = (contentId) => {
    return (
      Array.isArray(progress) &&
      progress.some((p) => p.contentId === contentId && p.completed)
    );
  };

  const drawerWidth = 300;

  const drawerContent = (
    <>
      <Box sx={{ p: 2 }}>
        <Typography variant='h6' noWrap component='div'>
          {course?.title}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Instructor: {course?.instructor}
        </Typography>
      </Box>
      <Divider />
      <List>
        {course?.content?.map((item, index) => {
          const contentId = item.id || index.toString();
          const completed = isContentCompleted(contentId);

          return (
            <React.Fragment key={contentId}>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={`/courses/${courseId}/content/${contentId}`}
                >
                  <ListItemIcon>{getContentTypeIcon(item.type)}</ListItemIcon>
                  <ListItemText primary={item.title} secondary={item.type} />
                  {completed && (
                    <CheckCircleIcon color='success' fontSize='small' />
                  )}
                </ListItemButton>
              </ListItem>
              {index < course?.content?.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </>
  );

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            color='inherit'
            aria-label='open course sidebar'
            edge='start'
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
            data-testid='course-sidebar-toggle'
          >
            <MenuIcon />
          </IconButton>
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
              },
            }}
            data-testid='course-sidebar-mobile'
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Drawer
          variant='persistent'
          open
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              position: 'relative',
              height: '100%',
              overflowY: 'auto',
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
  courseId: PropTypes.string.isRequired,
};

CourseSidebar.defaultProps = {
  progress: [],
};

export default CourseSidebar;
