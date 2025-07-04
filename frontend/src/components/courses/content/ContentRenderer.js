import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  RadioGroup,
  Radio,
  FormControl,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import axiosInstance from '../../../utils/axiosConfig';
import { convertMarkdownToHTML } from '../../../utils/markdownUtils';

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
  sectionId,
  isInstructor,
}) {
  const { type, content, videoUrl, options, question } = contentItem;
  const [videoEnded, setVideoEnded] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState('success');
  const [isYoutubeVideo, setIsYoutubeVideo] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const youtubeIframeRef = useRef(null);

  // State for quiz answers
  const [quizAnswer, setQuizAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const contentId = contentItem._id || contentItem.id;

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

  // YouTube player ready handler
  const onPlayerReady = () => {
    // console.log('YouTube player is ready');
  };

  // YouTube player state change handler
  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED) {
      handleVideoEnd();
    }
  };

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
    if (!isYoutubeVideo || !youtubeVideoId) return undefined;

    // Ensure YT API is loaded
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
      if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
        youtubePlayer.destroy();
      }
    };
  }, [isYoutubeVideo, youtubeVideoId]);

  // Pre-fill quiz answers and score from progress data
  useEffect(() => {
    if (progress && progress.length > 0 && contentId) {
      const contentProgress = progress.find((p) => p.contentId === contentId);

      if (contentProgress) {
        if (type === 'quiz' && contentProgress.answer) {
          setQuizAnswer(contentProgress.answer || '');
        } else if (
          type === 'multipleChoice' &&
          contentProgress.answer !== undefined
        ) {
          setSelectedOption(contentProgress.answer.toString());
          if (contentProgress.score !== undefined) {
            setQuizScore(contentProgress.score);
          }
        }
      }
    }
  }, [type, progress, contentId]);
  // Auto-hide feedback after 6 seconds
  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        setShowFeedback(false);
      }, 6000);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [showFeedback]);

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
  // Handle quiz answer submission
  const handleQuizAnswerSubmit = async () => {
    if (!courseId || !sectionId || !contentId) return;

    try {
      setSubmittingAnswer(true);

      await axiosInstance.post(
        `/api/progress/${courseId}/${sectionId}/${contentId}`,
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
      // console.error('Error submitting quiz answer:', err);

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
  // Handle multiple-choice quiz answer submission
  const handleMultipleChoiceSubmit = async () => {
    if (!courseId || !sectionId || !contentId || selectedOption === '') return;

    try {
      setSubmittingAnswer(true);

      // Convert the selected option to a number for the API
      const optionNumber = parseInt(selectedOption, 10);

      const response = await axiosInstance.post(
        `/api/progress/${courseId}/${sectionId}/${contentId}`,
        {
          answer: optionNumber,
          completed: true,
        },
      );

      // Get the score from the response
      const score = response.data.score !== undefined ? response.data.score : 0;
      setQuizScore(score);

      // Don't set general feedback for multiple choice - the quiz score alert handles this
      setSubmittingAnswer(false);

      // Update progress after answer submission
      if (typeof onCompleted === 'function') {
        onCompleted();
      }
    } catch (err) {
      // console.error('Error submitting multiple choice answer:', err);

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
  // Handle radio option change
  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const renderCompletionButtonText = () => {
    if (isCompleted) {
      return 'Completed';
    }
    if (completing) {
      return 'Marking...';
    }
    return 'Mark as Completed';
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Video content rendering */}
      {type === 'video' && videoUrl && (
        <Box sx={{ mb: 4 }} data-testid='video-content'>
          {isYoutubeVideo && youtubeVideoId ? (
            <>
              {' '}
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '56.25%', // 16:9 aspect ratio
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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mt: 1,
                  }}
                >
                  {' '}
                  <Button
                    variant='outlined'
                    color='primary'
                    onClick={handleYoutubeManualCompletion}
                    disabled={completing}
                    size='large'
                    sx={{
                      px: 4,
                      py: 2,
                      // Remove borderRadius override to use theme default
                    }}
                  >
                    {completing ? 'Saving Progress...' : 'Mark as Completed'}
                  </Button>
                </Box>
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
              <track kind='captions' srcLang='en' label='English captions' />
              Your browser does not support the video tag.
            </video>
          )}
          {videoEnded && !isCompleted && !isYoutubeVideo && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mt: 2,
              }}
            >
              {' '}
              <Button
                variant='outlined'
                color='primary'
                onClick={handleCompletionClick}
                disabled={completing}
                size='large'
                sx={{
                  px: 4,
                  py: 2,
                  // Remove borderRadius override to use theme default
                }}
              >
                {completing ? 'Saving Progress...' : 'Mark Video as Completed'}
              </Button>
            </Box>
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

      {/* Markdown content rendering */}
      {type === 'markdown' && content && (
        <Box
          sx={{
            overflow: 'hidden',
            maxWidth: '100%',
            width: '100%',
            wordWrap: 'break-word',
            '& *': {
              maxWidth: '100%',
              boxSizing: 'border-box',
            },
          }}
          dangerouslySetInnerHTML={{
            __html: convertMarkdownToHTML(content),
          }}
          data-testid='markdown-content'
        />
      )}

      {/* Text-based quiz content rendering */}
      {type === 'quiz' && (question || content) && (
        <Box sx={{ mb: 4 }} data-testid='quiz-content'>
          <Typography variant='body1' paragraph>
            {question || content}
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
            disabled={isCompleted && !isInstructor}
          />

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-start' }}>
            {' '}
            <Button
              variant='contained'
              color='primary'
              endIcon={<SendIcon />}
              onClick={handleQuizAnswerSubmit}
              disabled={
                submittingAnswer ||
                !quizAnswer.trim() ||
                (isCompleted && !isInstructor)
              }
              data-testid='submit-answer-button'
              sx={{
                mr: 2,
                // Remove borderRadius override to use theme default
              }}
            >
              {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Multiple-choice quiz content rendering */}
      {type === 'multipleChoice' && (
        <Box sx={{ mb: 4 }} data-testid='multiple-choice-content'>
          <Typography variant='body1' paragraph>
            {/* Handle both flat and nested content structures */}
            {typeof content === 'object' && content?.question
              ? content.question
              : question || content}
          </Typography>

          {/* Display score and feedback for answered multiple choice questions */}
          {quizScore !== null && (
            <Alert
              severity={quizScore === 1 ? 'success' : 'error'}
              sx={{ mb: 2 }}
              data-testid='quiz-score-feedback'
            >
              {quizScore === 1 ? 'Correct! Score: 1' : 'Incorrect. Try again!'}
            </Alert>
          )}

          <FormControl component='fieldset' sx={{ width: '100%', mt: 2 }}>
            <FormLabel component='legend' sx={{ mb: 1 }}>
              Select your answer:
            </FormLabel>
            <RadioGroup
              value={selectedOption}
              onChange={handleOptionChange}
              data-testid='multiple-choice-options'
            >
              {/* Use options from either the object content or top-level options */}
              {(typeof content === 'object' && Array.isArray(content.options)
                ? content.options
                : options || []
              ).map((option, index) => (
                <FormControlLabel
                  key={option || `option-${index}`} // Use option as key if available, otherwise fallback to index
                  value={index.toString()}
                  control={<Radio />}
                  label={option}
                  disabled={submittingAnswer}
                  data-testid={`option-${index}`}
                />
              ))}
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-start' }}>
            {' '}
            <Button
              variant='contained'
              color='primary'
              onClick={handleMultipleChoiceSubmit}
              disabled={submittingAnswer || selectedOption === ''}
              data-testid='submit-multiple-choice-button'
              // Remove sx override to use theme default styling
            >
              {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Completion button for non-video content */}
      {type !== 'video' && (
        <Box
          sx={{
            mt: 4,
            mb: 4,
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            py: { xs: 1, sm: 2 },
          }}
        >
          {' '}
          <Button
            variant='contained'
            color='primary'
            size='large'
            onClick={handleCompletionClick}
            disabled={isCompleted || completing}
            startIcon={isCompleted ? <CheckCircleIcon /> : null}
            data-testid='complete-button'
            sx={{
              minWidth: '200px',
              boxShadow: 3,
              // Remove borderRadius override to use theme default
            }}
          >
            {renderCompletionButtonText()}
          </Button>
        </Box>
      )}

      {/* Feedback alert */}
      {showFeedback && (
        <Alert
          severity={feedbackType}
          onClose={handleCloseFeedback}
          sx={{
            mt: 2,
            mb: 2,
          }}
        >
          {feedbackMessage}
        </Alert>
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
    options: PropTypes.arrayOf(PropTypes.string),
    question: PropTypes.string,
    _id: PropTypes.string,
    id: PropTypes.string,
  }).isRequired,
  isCompleted: PropTypes.bool,
  completing: PropTypes.bool,
  onCompleted: PropTypes.func.isRequired,
  error: PropTypes.string,
  progress: PropTypes.arrayOf(PropTypes.shape({})), // Changed from PropTypes.array to PropTypes.arrayOf(PropTypes.shape({}))
  courseId: PropTypes.string,
  sectionId: PropTypes.string,
  isInstructor: PropTypes.bool,
};

ContentRenderer.defaultProps = {
  isCompleted: false,
  completing: false,
  error: '',
  progress: [],
  courseId: null,
  sectionId: null,
  isInstructor: false,
};

export default ContentRenderer;
