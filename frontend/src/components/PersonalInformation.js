import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import axiosInstance from '../utils/axiosConfig';

function PersonalInformation() {
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    phoneNumber: '',
    email: '',
    role: '',
    createdAt: '',
    // Add any other fields that might be returned by the API
  });
  const [errors, setErrors] = useState({
    fullName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Using axiosInstance - no need to manually include the token
        const response = await axiosInstance.get('/api/users/me');

        // Store all data returned by the API
        const userData = response.data;

        // Format date if available
        const createdDate = userData.createdAt
          ? new Date(userData.createdAt).toLocaleDateString()
          : '';

        setFormData({
          ...userData, // Get all fields from the API
          createdAt: createdDate,
        });

        setFetchLoading(false);
      } catch (err) {
        // Error fetching user data
        setError('Failed to load your profile information');
        setFetchLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
    if (!formData.fullName?.trim()) {
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
      // Extract only editable fields for the update request
      const updateData = {
        fullName: formData.fullName,
        bio: formData.bio,
        phoneNumber: formData.phoneNumber,
        // Add other editable fields here as needed
      };

      // Use axiosInstance - no need to manually include the token
      await axiosInstance.put('/api/users/me', updateData);

      setSuccess('Profile updated successfully');
      setLoading(false);
      setEditMode(false); // Return to view mode after successful update
    } catch (err) {
      // Profile update error handling
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

  // Toggle between view and edit modes
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setError(''); // Clear any error messages when switching modes
    setSuccess(''); // Clear success message when switching modes
  };

  if (fetchLoading) {
    return (
      <Container maxWidth='sm'>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='sm'>
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

          {!editMode ? (
            // View Mode
            <>
              <Card variant='outlined' sx={{ mb: 3, mt: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant='subtitle1' color='textSecondary'>
                        Full Name
                      </Typography>
                      <Typography variant='body1' gutterBottom>
                        {formData.fullName || 'Not provided'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle1' color='textSecondary'>
                        Email
                      </Typography>
                      <Typography variant='body1' gutterBottom>
                        {formData.email || 'Not provided'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle1' color='textSecondary'>
                        Phone Number
                      </Typography>
                      <Typography variant='body1' gutterBottom>
                        {formData.phoneNumber || 'Not provided'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle1' color='textSecondary'>
                        Bio
                      </Typography>
                      <Typography
                        variant='body1'
                        gutterBottom
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {formData.bio || 'No bio provided'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle1' color='textSecondary'>
                        Role
                      </Typography>
                      <Typography variant='body1' gutterBottom>
                        {formData.role || 'Not specified'}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant='subtitle1' color='textSecondary'>
                        Member Since
                      </Typography>
                      <Typography variant='body1' gutterBottom>
                        {formData.createdAt || 'Not available'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                onClick={toggleEditMode}
              >
                Edit Information
              </Button>
            </>
          ) : (
            // Edit Mode - Only show editable fields
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
                value={formData.fullName || ''}
                onChange={handleChange}
                error={!!errors.fullName}
                helperText={errors.fullName}
              />

              <TextField
                margin='normal'
                fullWidth
                disabled
                id='email'
                label='Email'
                name='email'
                value={formData.email || ''}
                helperText='Email cannot be changed'
              />

              {formData.role && (
                <TextField
                  margin='normal'
                  fullWidth
                  disabled
                  id='role'
                  label='Role'
                  name='role'
                  value={formData.role}
                  helperText='Role cannot be changed'
                />
              )}

              <TextField
                margin='normal'
                fullWidth
                id='bio'
                label='Bio'
                name='bio'
                multiline
                rows={4}
                value={formData.bio || ''}
                onChange={handleChange}
                placeholder='Tell us about yourself (optional)'
              />

              <TextField
                margin='normal'
                fullWidth
                id='phoneNumber'
                label='Phone Number'
                name='phoneNumber'
                value={formData.phoneNumber || ''}
                onChange={handleChange}
                placeholder='Your contact number (optional)'
                autoComplete='tel'
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  type='button'
                  fullWidth
                  variant='outlined'
                  onClick={toggleEditMode}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  fullWidth
                  variant='contained'
                  color='primary'
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

export default PersonalInformation;
