import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Toolbar, Typography, Button } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * Component for navigating between course content items
 */
function ContentNavigation({
  courseId,
  title,
  previousContentId,
  nextContentId,
}) {
  return (
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
          previousContentId
            ? `/courses/${courseId}/content/${previousContentId}`
            : '#'
        }
        disabled={!previousContentId}
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
        {title}
      </Typography>

      {/* Next Button */}
      <Button
        endIcon={<NavigateNextIcon />}
        component={Link}
        to={
          nextContentId ? `/courses/${courseId}/content/${nextContentId}` : '#'
        }
        disabled={!nextContentId}
        data-testid='next-button'
      >
        Next
      </Button>
    </Toolbar>
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
