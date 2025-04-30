import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, TextField, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  sanitizeMarkdown,
  getMarkdownStyles,
} from '../../../utils/markdownUtils';

/**
 * Component for rendering different types of course content
 */
function ContentRenderer({
  contentItem,
  isCompleted,
  completing,
  onCompleted,
}) {
  const { type, title, content, videoUrl } = contentItem;

  return (
    <Box sx={{ mt: 3 }}>
      {/* Content Type Badge */}
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ mb: 2 }}
        data-testid='content-type'
      >
        {type?.charAt(0).toUpperCase() + type?.slice(1)}
      </Typography>

      {/* Video Content */}
      {type === 'video' && videoUrl && (
        <Box sx={{ mb: 4 }} data-testid='video-content'>
          <video
            width='100%'
            controls
            onEnded={onCompleted}
            data-testid='video-player'
          >
            <source src={videoUrl} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </Box>
      )}

      {/* Markdown Content */}
      {type === 'markdown' && content && (
        <Box sx={getMarkdownStyles()} data-testid='markdown-content'>
          <ReactMarkdown>{sanitizeMarkdown(content)}</ReactMarkdown>
        </Box>
      )}

      {/* Quiz Content */}
      {type === 'quiz' && content && (
        <Box sx={{ mb: 4 }} data-testid='quiz-content'>
          <Typography variant='body1' paragraph>
            {content}
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
      {type !== 'video' && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='outlined'
            color='primary'
            onClick={onCompleted}
            disabled={isCompleted || completing}
            startIcon={isCompleted ? <CheckCircleIcon /> : null}
            data-testid='complete-button'
          >
            {isCompleted
              ? 'Completed'
              : completing
                ? 'Marking...'
                : 'Mark as Completed'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

ContentRenderer.propTypes = {
  contentItem: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    videoUrl: PropTypes.string,
  }).isRequired,
  isCompleted: PropTypes.bool,
  completing: PropTypes.bool,
  onCompleted: PropTypes.func.isRequired,
};

ContentRenderer.defaultProps = {
  isCompleted: false,
  completing: false,
};

export default ContentRenderer;
