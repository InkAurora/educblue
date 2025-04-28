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
  FormHelperText,
} from '@mui/material';

function PersonalInformation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState({
    fullName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field-specific error when user types
    if (name === 'fullName' && errors.fullName) {
      setErrors({ ...errors, fullName: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {
      fullName: '',
    };
    let isValid = true;

    // Validate fullName (required)
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset messages
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('You must be logged in to update your profile');
        setLoading(false);
        return;
      }

      // Send update request with the JWT token
      await axios.put('http://localhost:5000/api/users/me', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess('Profile updated successfully');
      setLoading(false);

      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      console.error('Profile update error:', err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(
          'An error occurred while updating your profile. Please try again.',
        );
      }

      setLoading(false);
    }
  };

  return (
    <Container maxWidth='sm'>
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component='h1' variant='h5' align='center' gutterBottom>
            Personal Information
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity='success' sx={{ mb: 2 }}>
              {success}
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
              id='fullName'
              label='Full Name'
              name='fullName'
              autoComplete='name'
              autoFocus
              value={formData.fullName}
              onChange={handleChange}
              error={!!errors.fullName}
              helperText={errors.fullName}
            />

            <TextField
              margin='normal'
              fullWidth
              id='bio'
              label='Bio'
              name='bio'
              multiline
              rows={4}
              value={formData.bio}
              onChange={handleChange}
              placeholder='Tell us about yourself (optional)'
            />

            <TextField
              margin='normal'
              fullWidth
              id='phoneNumber'
              label='Phone Number'
              name='phoneNumber'
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder='Your contact number (optional)'
              autoComplete='tel'
            />

            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default PersonalInformation;
