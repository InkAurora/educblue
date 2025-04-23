import React, { useState, useEffect } from 'react';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    role: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Validate form fields whenever they change
  useEffect(() => {
    validateForm();
  }, [formData]);

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
      role: '',
    };

    // Email validation
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // Role validation
    if (formData.role && !['student', 'instructor'].includes(formData.role)) {
      newErrors.role = 'Role must be either student or instructor';
    }

    setErrors(newErrors);

    // Check if form is valid
    const isValid =
      formData.email.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.role.trim() !== '' &&
      emailRegex.test(formData.email) &&
      formData.password.length >= 6 &&
      ['student', 'instructor'].includes(formData.role);

    setIsFormValid(isValid);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation check before submission
    validateForm();

    if (!isFormValid) {
      setError('Please fix the errors in the form before submitting.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        formData,
      );

      // Store the token in localStorage
      localStorage.setItem('token', response.data.token);

      // Dispatch auth change event to update navbar
      window.dispatchEvent(new Event('authChange'));

      // Redirect to home page
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);

      if (err.response?.status === 409) {
        setError('User already exists');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred during registration. Please try again.');
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
            Register
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
              id='email'
              label='Email Address'
              name='email'
              autoComplete='email'
              autoFocus
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              margin='normal'
              required
              fullWidth
              name='password'
              label='Password'
              type='password'
              id='password'
              autoComplete='new-password'
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
            />
            <FormControl fullWidth margin='normal' error={!!errors.role}>
              <InputLabel id='role-label'>Role</InputLabel>
              <Select
                labelId='role-label'
                id='role'
                name='role'
                value={formData.role}
                label='Role'
                onChange={handleChange}
              >
                <MenuItem value='student'>Student</MenuItem>
                <MenuItem value='instructor'>Instructor</MenuItem>
              </Select>
              {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
            </FormControl>
            <Button
              type='submit'
              fullWidth
              variant='contained'
              color='primary'
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !isFormValid}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;
