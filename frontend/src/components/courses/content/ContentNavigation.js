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
 * Static position at the top of the content area, just under the navbar
 */
function ContentNavigation({
  courseId,
  title,
  previousContentId,
  nextContentId,
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
      }}
    >
      <Paper
        elevation={1}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
          boxShadow: 0,
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            width: '100%',
            minHeight: '48px',
            height: '48px',
            p: 0, // Remove default padding
          }}
          disableGutters
          variant='dense'
        >
          {/* Previous Button - Left aligned with consistent width */}
          <Box
            sx={{ width: '48px', display: 'flex', justifyContent: 'center' }}
          >
            <Button
              component={Link}
              to={
                previousContentId
                  ? `/courses/${courseId}/content/${previousContentId}`
                  : '#'
              }
              disabled={!previousContentId}
              data-testid='prev-button'
              sx={{
                minWidth: 'unset',
                p: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <NavigateBeforeIcon />
            </Button>
          </Box>

          {/* Content Title - Centered with proper spacing */}
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

          {/* Next Button - Right aligned with consistent width */}
          <Box
            sx={{ width: '48px', display: 'flex', justifyContent: 'center' }}
          >
            <Button
              component={Link}
              to={
                nextContentId
                  ? `/courses/${courseId}/content/${nextContentId}`
                  : '#'
              }
              disabled={!nextContentId}
              data-testid='next-button'
              sx={{
                minWidth: 'unset',
                p: 1,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <NavigateNextIcon />
            </Button>
          </Box>
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
