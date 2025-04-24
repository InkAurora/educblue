import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    markdownDescription: '',
    price: '',
    instructor: '',
    duration: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMarkdownChange = (value) => {
    setFormData({ ...formData, markdownDescription: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get JWT token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You need to be logged in to create a course');
        setLoading(false);
        return;
      }

      // Format the price as a number
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
        setError(err.response.data.message);
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
            />

            <Typography variant='subtitle1' sx={{ mt: 2, mb: 1 }}>
              Detailed Description (Markdown)
            </Typography>
            <SimpleMDE
              value={formData.markdownDescription}
              onChange={handleMarkdownChange}
              options={{
                spellChecker: false,
                placeholder:
                  'Write detailed course description with Markdown...',
                status: ['lines', 'words'],
                previewClass: ['editor-preview'],
              }}
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
