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
  FormHelperText,
} from '@mui/material';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';

function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    markdownDescription: '',
    price: '',
    instructor: '',
    duration: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
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
    setFormData((prevFormData) => ({
      ...prevFormData,
      markdownDescription: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Course title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.instructor.trim()) {
      newErrors.instructor = 'Instructor name is required';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    } else if (
      isNaN(parseFloat(formData.duration)) ||
      parseFloat(formData.duration) <= 0
    ) {
      newErrors.duration = 'Duration must be a positive number';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (
      isNaN(parseFloat(formData.price)) ||
      parseFloat(formData.price) < 0
    ) {
      newErrors.price = 'Price must be a valid number (0 or greater)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate the form before submission
    if (!validateForm()) {
      setError('Please fix the errors in the form before submitting.');
      return;
    }

    setLoading(true);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in to create a course');
        setLoading(false);
        return;
      }

      // Format the data as numbers for submission
      const formattedData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration, 10),
      };

      // Send POST request to create a new course
      const response = await axios.post(
        'http://localhost:5000/api/courses',
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Redirect to the new course details page
      navigate(`/courses/${response.data._id}`);
    } catch (err) {
      console.error('Error creating course:', err);

      // Handle specific error responses
      if (err.response?.status === 403) {
        setError('Access denied. Only instructors can create courses.');
      } else if (err.response?.data?.message) {
        if (
          err.response.data.error &&
          err.response.data.error.includes('duration')
        ) {
          setErrors({
            ...errors,
            duration: 'Duration is required and must be a valid number',
          });
          setError('Please check the form for errors');
        } else if (
          err.response.data.error &&
          err.response.data.error.includes('price')
        ) {
          setErrors({
            ...errors,
            price: 'Price must be a valid number',
          });
          setError('Please check the form for errors');
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError(
          'An error occurred while creating the course. Please try again.',
        );
      }

      setLoading(false);
    }
  };

  return (
    <Container maxWidth='md'>
      <Box
        sx={{
          mt: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component='h1' variant='h5' align='center' gutterBottom>
            Create New Course
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
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
              value={formData.title}
              onChange={handleChange}
              error={!!errors.title}
              helperText={errors.title}
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
              value={formData.description}
              onChange={handleChange}
              error={!!errors.description}
              helperText={errors.description}
            />

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Detailed Description (Markdown)
            </Typography>
            <SimpleMDE
              id='markdownEditor'
              value={formData.markdownDescription}
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
                value={formData.price}
                onChange={handleChange}
                error={!!errors.price}
                helperText={errors.price}
              />

              <TextField
                margin='normal'
                required
                fullWidth
                id='instructor'
                label='Instructor Name'
                name='instructor'
                value={formData.instructor}
                onChange={handleChange}
                error={!!errors.instructor}
                helperText={errors.instructor}
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
                value={formData.duration}
                onChange={handleChange}
                error={!!errors.duration}
                helperText={errors.duration}
              />
            </Box>

            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Course'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default CreateCourse;
