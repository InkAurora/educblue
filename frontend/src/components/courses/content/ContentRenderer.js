import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import axiosInstance from '../../../utils/axiosConfig';
import {
  sanitizeMarkdown,
  getMarkdownStyles,
} from '../../../utils/markdownUtils';

// Helper function to determine if URL is a YouTube URL and extract video ID
const getYoutubeVideoId = (url) => {
  if (!url) return null;

  const regExp =
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^?&/]+)/;
  const match = url.match(regExp);

  return match && match[1] ? match[1] : null;
};

/**
 * Component for rendering different types of course content
 */
function ContentRenderer({
  contentItem,
  isCompleted,
  completing,
  onCompleted,
  error,
  progress,
  courseId,
}) {
  const { type, title, content, videoUrl } = contentItem;
  const [videoEnded, setVideoEnded] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('success');
  const [isYoutubeVideo, setIsYoutubeVideo] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const youtubeIframeRef = useRef(null);

  // New state for quiz answers
  const [quizAnswer, setQuizAnswer] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const contentId = contentItem._id || contentItem.id;

  // Check if the video URL is a YouTube URL
  useEffect(() => {
    if (type === 'video' && videoUrl) {
      const videoId = getYoutubeVideoId(videoUrl);
      if (videoId) {
        setIsYoutubeVideo(true);
        setYoutubeVideoId(videoId);
      } else {
        setIsYoutubeVideo(false);
        setYoutubeVideoId(null);
      }
    }
  }, [type, videoUrl]);

  // Initialize YouTube iframe API
  useEffect(() => {
    if (!isYoutubeVideo || isCompleted || !youtubeVideoId) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initYoutubePlayer;
    } else if (window.YT && window.YT.Player) {
      initYoutubePlayer();
    }

    return () => {
      if (youtubePlayer && youtubePlayer.destroy) {
        youtubePlayer.destroy();
      }
    };
  }, [isYoutubeVideo, youtubeVideoId, isCompleted]);

  // Function to initialize YouTube player
  const initYoutubePlayer = () => {
    if (!youtubeIframeRef.current) return;

    const player = new window.YT.Player(youtubeIframeRef.current, {
      videoId: youtubeVideoId,
      playerVars: {
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

    setYoutubePlayer(player);
  };

  // YouTube player ready handler
  const onPlayerReady = (event) => {
    console.log('YouTube player is ready');
  };

  // YouTube player state change handler
  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      handleVideoEnd();
    }
  };

  // Pre-fill quiz answer from progress data if available
  useEffect(() => {
    if (type === 'quiz' && progress && progress.length > 0) {
      const quizProgress = progress.find(
        (p) => p.contentId === contentId && p.answer,
      );

      if (quizProgress) {
        setQuizAnswer(quizProgress.answer || '');
      }
    }
  }, [type, progress, contentId]);

  // Handle video end event
  const handleVideoEnd = async () => {
    setVideoEnded(true);
    if (!isCompleted) {
      const success = await onCompleted();
      if (success) {
        setFeedbackMessage('Progress saved!');
        setFeedbackType('success');
      } else {
        setFeedbackMessage('Failed to save progress. Please try again.');
        setFeedbackType('error');
      }
      setShowFeedback(true);
    }
  };

  // Handle manual completion
  const handleCompletionClick = async () => {
    const success = await onCompleted();
    if (success) {
      setFeedbackMessage('Progress saved!');
      setFeedbackType('success');
    } else {
      setFeedbackMessage(error || 'Failed to save progress. Please try again.');
      setFeedbackType('error');
    }
    setShowFeedback(true);
  };

  // Allow manual completion for YouTube videos when needed
  const handleYoutubeManualCompletion = async () => {
    if (
      youtubePlayer &&
      youtubePlayer.getCurrentTime &&
      youtubePlayer.getDuration
    ) {
      const currentTime = youtubePlayer.getCurrentTime();
      const duration = youtubePlayer.getDuration();

      if (currentTime / duration >= 0.9) {
        handleCompletionClick();
      } else {
        setFeedbackMessage(
          'Please watch more of the video before marking it as completed',
        );
        setFeedbackType('warning');
        setShowFeedback(true);
      }
    } else {
      handleCompletionClick();
    }
  };

  // Close feedback message
  const handleCloseFeedback = () => {
    setShowFeedback(false);
  };

  // New function to handle quiz answer submission
  const handleQuizAnswerSubmit = async () => {
    if (!courseId || !contentId) return;

    try {
      setSubmittingAnswer(true);

      const response = await axiosInstance.post(
        `/api/progress/${courseId}/${contentId}`,
        {
          answer: quizAnswer,
          completed: true,
        },
      );

      setFeedbackMessage('Answer saved!');
      setFeedbackType('success');
      setShowFeedback(true);
      setSubmittingAnswer(false);

      // Update progress after answer submission
      if (typeof onCompleted === 'function') {
        onCompleted();
      }
    } catch (err) {
      console.error('Error submitting quiz answer:', err);

      if (err.response?.status === 403) {
        setFeedbackMessage(
          'You must be enrolled in this course to submit answers',
        );
      } else {
        setFeedbackMessage(
          err.response?.data?.message ||
            'Failed to save answer. Please try again.',
        );
      }

      setFeedbackType('error');
      setShowFeedback(true);
      setSubmittingAnswer(false);
    }
  };

  return (
    <Box sx={{ mt: 3, position: 'relative', pb: 4 }}>
      {' '}
      {/* Reduced bottom padding from 10 to 4 */}
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ mb: 2 }}
        data-testid='content-type'
      >
        {type?.charAt(0).toUpperCase() + type?.slice(1)}
      </Typography>
      {type === 'video' && videoUrl && (
        <Box sx={{ mb: 4 }} data-testid='video-content'>
          {isYoutubeVideo && youtubeVideoId ? (
            <>
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  width: '100%',
                  mb: 2,
                }}
              >
                <div
                  ref={youtubeIframeRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                  }}
                  data-testid='youtube-player'
                />
              </Box>
              {!isCompleted && (
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={handleYoutubeManualCompletion}
                  disabled={completing}
                  sx={{ mt: 1 }}
                >
                  {completing ? 'Saving Progress...' : 'Mark as Completed'}
                </Button>
              )}
            </>
          ) : (
            <video
              width='100%'
              controls
              onEnded={handleVideoEnd}
              data-testid='video-player'
            >
              <source src={videoUrl} type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          )}
          {videoEnded && !isCompleted && !isYoutubeVideo && (
            <Button
              variant='outlined'
              color='primary'
              onClick={handleCompletionClick}
              disabled={completing}
              sx={{ mt: 2 }}
            >
              {completing ? 'Saving Progress...' : 'Mark Video as Completed'}
            </Button>
          )}
          {isCompleted && (
            <Typography
              variant='body2'
              color='success.main'
              sx={{ mt: 2, display: 'flex', alignItems: 'center' }}
            >
              <CheckCircleIcon sx={{ mr: 1 }} /> Video completed
            </Typography>
          )}
          {!videoEnded &&
            !isCompleted &&
            type === 'video' &&
            !isYoutubeVideo && (
              <Typography variant='body2' color='info.main' sx={{ mt: 2 }}>
                Watch the video to mark it as completed
              </Typography>
            )}
        </Box>
      )}
      {type === 'markdown' && content && (
        <Box sx={getMarkdownStyles()} data-testid='markdown-content'>
          <ReactMarkdown>{sanitizeMarkdown(content)}</ReactMarkdown>
        </Box>
      )}
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
            value={quizAnswer}
            onChange={(e) => setQuizAnswer(e.target.value)}
            data-testid='quiz-answer-field'
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant='contained'
              color='primary'
              endIcon={<SendIcon />}
              onClick={handleQuizAnswerSubmit}
              disabled={submittingAnswer || !quizAnswer.trim()}
              data-testid='submit-answer-button'
              sx={{ mr: 2 }}
            >
              {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </Box>
        </Box>
      )}
      {type !== 'video' && (
        <Box
          sx={{
            mt: 4,
            mb: 4 /* Added bottom margin */,
            display: 'flex',
            justifyContent:
              'center' /* Changed to center for better visibility */,
            position: 'relative' /* Changed from sticky to relative */,
            py: { xs: 1, sm: 2 },
          }}
        >
          <Button
            variant='contained' /* Changed from outlined to contained for better visibility */
            color='primary'
            size='large' /* Increased button size */
            onClick={handleCompletionClick}
            disabled={isCompleted || completing}
            startIcon={isCompleted ? <CheckCircleIcon /> : null}
            data-testid='complete-button'
            sx={{
              minWidth: '200px' /* Set minimum width */,
              boxShadow: 3 /* Add shadow for better visibility */,
            }}
          >
            {isCompleted
              ? 'Completed'
              : completing
                ? 'Marking...'
                : 'Mark as Completed'}
          </Button>
        </Box>
      )}
      <Snackbar
        open={showFeedback}
        autoHideDuration={6000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseFeedback}
          severity={feedbackType}
          sx={{ width: '100%' }}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

ContentRenderer.propTypes = {
  contentItem: PropTypes.shape({
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    content: PropTypes.string,
    videoUrl: PropTypes.string,
    _id: PropTypes.string,
    id: PropTypes.string,
  }).isRequired,
  isCompleted: PropTypes.bool,
  completing: PropTypes.bool,
  onCompleted: PropTypes.func.isRequired,
  error: PropTypes.string,
  progress: PropTypes.array,
  courseId: PropTypes.string,
};

ContentRenderer.defaultProps = {
  isCompleted: false,
  completing: false,
  error: '',
  progress: [],
  courseId: null,
};

export default ContentRenderer;
