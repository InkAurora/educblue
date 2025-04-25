import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
} from '@mui/material';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

function CreateCourse() {
  const navigate = useNavigate();
  const [course, setCourse] = useState({
    title: '',
    description: '',
    markdownDescription: '',
    price: '',
    instructor: '',
    duration: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse({ ...course, [name]: value });

    // Clear field-specific error when user types
    if (validationError[name]) {
      setValidationError({
        ...validationError,
        [name]: '',
      });
    }
  };

  // Memoize the SimpleMDE options to prevent re-rendering issues
  const editorOptions = useMemo(() => {
    return {
      spellChecker: false,
      placeholder: 'Write detailed course description with Markdown...',
      status: ['lines', 'words'],
      previewClass: ['editor-preview'],
      autofocus: false,
    };
  }, []);

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
    if (
      !course.title ||
      !course.description ||
      !course.price ||
      !course.instructor ||
      !course.duration
    ) {
      setValidationError('Please fill in all required fields');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You need to be logged in to create a course');
      return;
    }

    setLoading(true);
    setError('');
    setValidationError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/courses',
        course,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      navigate(`/create-course/${response.data._id}/content`);
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

          {validationError && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {validationError}
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
              />

              <TextField
                margin='normal'
                required
                fullWidth
                id='instructor'
                label='Instructor Name'
                name='instructor'
                value={course.instructor}
                onChange={handleChange}
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
              />
            </Box>

            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Creating...' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default CreateCourse;
