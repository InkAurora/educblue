import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  Toolbar,
  Typography,
  Button,
  Paper,
  Box,
  useTheme,
} from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Component for navigating between course content items
 * Fixed position at the top of the content area, just under the navbar
 */
function ContentNavigation({
  courseId,
  title,
  previousContentId,
  nextContentId,
}) {
  const theme = useTheme();
  const navbarHeight = 64; // Standard AppBar height in Material UI

  return (
    <Box
      sx={{
        position: 'fixed',
        top: navbarHeight,
        left: { xs: 0, md: '300px' }, // Account for sidebar on desktop
        right: 0,
        zIndex: 1000,
        height: '48px',
        boxSizing: 'border-box',
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 0, // Remove rounded corners for full-width appearance
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 1, sm: 2 },
            display: 'flex',
            justifyContent: 'space-between',
            bgcolor: 'background.paper',
            width: '100%',
            minHeight: '48px',
            height: '48px',
          }}
          disableGutters
          variant='dense'
        >
          {/* Previous Button */}
          <Button
            startIcon={<NavigateBeforeIcon />}
            component={Link}
            to={
              previousContentId
                ? `/courses/${courseId}/content/${previousContentId}`
                : '#'
            }
            disabled={!previousContentId}
            data-testid='prev-button'
            size='small'
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
              fontSize: { xs: '0.9rem', sm: '1.1rem' },
            }}
            data-testid='content-title'
          >
            {title}
          </Typography>

          {/* Next Button */}
          <Button
            endIcon={<NavigateNextIcon />}
            component={Link}
            to={
              nextContentId
                ? `/courses/${courseId}/content/${nextContentId}`
                : '#'
            }
            disabled={!nextContentId}
            data-testid='next-button'
            size='small'
          >
            Next
          </Button>
        </Toolbar>
      </Paper>
    </Box>
  );
}

ContentNavigation.propTypes = {
  courseId: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  previousContentId: PropTypes.string,
  nextContentId: PropTypes.string,
};

ContentNavigation.defaultProps = {
  previousContentId: null,
  nextContentId: null,
};

export default ContentNavigation;
