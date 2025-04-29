import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  InputAdornment,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import axiosInstance from '../utils/axiosConfig';

function CreateCourse() {
  const navigate = useNavigate();
  const [course, setCourse] = useState({
    title: '',
    description: '',
    markdownDescription: '',
    price: '',
    duration: '',
    acceptPayments: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setCourse({ ...course, [name]: newValue });

    // Clear field-specific error when user types
    if (validationError[name]) {
      setValidationError({
        ...validationError,
        [name]: '',
      });
    }
  };

  // Memoize the SimpleMDE options to prevent re-rendering issues
  const editorOptions = useMemo(
    () => ({
      spellChecker: false,
      placeholder: 'Write detailed course description with Markdown...',
      status: ['lines', 'words'],
      previewClass: ['editor-preview'],
      autofocus: false,
    }),
    [],
  );

  // Use a separate callback for markdown changes to prevent cursor issues
  const handleMarkdownChange = (value) => {
    setCourse((prevCourse) => ({
      ...prevCourse,
      markdownDescription: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Form validation
    const errors = {};
    if (!course.title) errors.title = 'Title is required';
    if (!course.description) errors.description = 'Description is required';
    if (!course.price) errors.price = 'Price is required';
    if (!course.duration) errors.duration = 'Duration is required';

    if (Object.keys(errors).length > 0) {
      setValidationError(errors);
      return;
    }

    setLoading(true);
    setError('');
    setValidationError({});

    try {
      // Using axiosInstance - no need to manually include the token
      const response = await axiosInstance.post('/api/courses', course);

      // Check for courseId directly or from the course object
      const courseId =
        response.data.courseId ||
        (response.data.course && response.data.course.id);

      if (courseId) {
        navigate(`/create-course/${courseId}/content`);
      } else {
        setError('Created course but received invalid course ID from server');
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 403) {
        setError('Access denied. Only instructors can create courses.');
      } else {
        setError('Failed to create course. Please try again later.');
      }
    }
  };

  return (
    <Container maxWidth='md'>
      <Box sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant='h5' align='center' gutterBottom>
            Create New Course
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {Object.keys(validationError).length > 0 && (
            <Alert severity='error' sx={{ mb: 2 }}>
              Please fix the highlighted fields
            </Alert>
          )}

          <Box
            component='form'
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin='normal'
              required
              fullWidth
              id='title'
              label='Course Title'
              name='title'
              autoFocus
              value={course.title}
              onChange={handleChange}
              error={!!validationError.title}
              helperText={validationError.title}
            />

            <TextField
              margin='normal'
              required
              fullWidth
              multiline
              rows={2}
              id='description'
              label='Short Description'
              name='description'
              value={course.description}
              onChange={handleChange}
              error={!!validationError.description}
              helperText={validationError.description}
            />

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Detailed Description (Markdown)
            </Typography>
            <SimpleMDE
              id='markdownEditor'
              value={course.markdownDescription}
              onChange={handleMarkdownChange}
              options={editorOptions}
            />

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mt: 2,
              }}
            >
              <TextField
                margin='normal'
                required
                fullWidth
                id='price'
                label='Price'
                name='price'
                type='number'
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>$</InputAdornment>
                  ),
                  inputProps: { min: 0, step: 0.01 },
                }}
                value={course.price}
                onChange={handleChange}
                error={!!validationError.price}
                helperText={validationError.price}
              />

              <TextField
                margin='normal'
                required
                fullWidth
                id='duration'
                label='Duration'
                name='duration'
                type='number'
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>hours</InputAdornment>
                  ),
                  inputProps: { min: 1 },
                }}
                value={course.duration}
                onChange={handleChange}
                error={!!validationError.duration}
                helperText={validationError.duration}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={course.acceptPayments}
                  onChange={handleChange}
                  name='acceptPayments'
                  color='primary'
                />
              }
              label='Enable Stripe payments for this course'
              sx={{ mt: 2 }}
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default CreateCourse;
