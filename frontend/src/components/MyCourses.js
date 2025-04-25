import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';

function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Extract user email from the token
    const getUserEmail = () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decodedToken = jwtDecode(token);
          return decodedToken.email || '';
        }
        return '';
      } catch (error) {
        console.error('Error decoding token:', error);
        return '';
      }
    };

    const email = getUserEmail();
    setUserEmail(email);

    const fetchMyCourses = async () => {
      if (!email) {
        setError('You must be logged in to view your courses');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/courses', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Filter courses by the instructor's email
        const myCourses = response.data.filter(
          (course) => course.instructor === email,
        );

        setCourses(myCourses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching courses:', err);
        if (err.response?.status === 403) {
          setError(
            'Access denied. You do not have permission to view these courses.',
          );
        } else {
          setError(`Failed to fetch courses: ${err.message}`);
        }
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='200px'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        My Courses
      </Typography>

      {courses.length === 0 ? (
        <Alert severity='info'>
          You haven't created any courses yet. Click "Create Course" to get
          started.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {courses.map((course) => (
            <Grid item key={course._id} xs={12} sm={6} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant='h5' component='h2'>
                    {course.title}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={course.published ? 'Published' : 'Draft'}
                      color={course.published ? 'success' : 'default'}
                      size='small'
                    />
                  </Box>
                  <Typography>{course.description}</Typography>
                  <Typography variant='h6' color='primary' sx={{ mt: 2 }}>
                    ${course.price}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Duration: {course.duration} hours
                  </Typography>

                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    <Button
                      variant='contained'
                      color='primary'
                      fullWidth
                      onClick={() =>
                        navigate(`/create-course/${course._id}/content`)
                      }
                    >
                      Edit Content
                    </Button>
                    <Button
                      variant='outlined'
                      color='primary'
                      fullWidth
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      View Course
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default MyCourses;
