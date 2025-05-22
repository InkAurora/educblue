import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import axiosInstance from '../utils/axiosConfig';

function CourseList(props) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { 'data-testid': dataTestId } = props;

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get('/api/courses');
        if (Array.isArray(response.data)) {
          setCourses(response.data);
        } else {
          setCourses([]); // Ensure courses is an array to prevent .map error
          setError(
            'Failed to load courses: Unexpected data format received from the server.',
          );
        }
      } catch (err) {
        if (err.message && err.message.includes('CORS')) {
          setError(
            'CORS error: The backend server needs to enable cross-origin requests. Please add CORS middleware to your backend application.',
          );
        } else {
          setError(`Failed to fetch courses: ${err.message}`);
        }
        setCourses([]); // Ensure courses is an empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
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
    <Container sx={{ py: 4 }} data-testid={dataTestId}>
      <Grid container spacing={4}>
        {courses.length > 0 ? (
          courses.map((course) => (
            <Grid
              key={course._id} // Changed from id to _id to match MongoDB format
              sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 2 }}
            >
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
                  <Typography>{course.description}</Typography>
                  <Typography variant='h6' color='primary' sx={{ mt: 2 }}>
                    ${course.price}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mt: 1 }}
                  >
                    Instructor: {course.instructor}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Duration: {course.duration} hours
                  </Typography>
                  <Button
                    variant='contained'
                    color='primary'
                    sx={{ mt: 2 }}
                    onClick={() => navigate(`/courses/${course._id}`)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Typography
            variant='body1'
            sx={{ mt: 3, width: '100%', textAlign: 'center' }}
          >
            No courses available at this time.
          </Typography>
        )}
      </Grid>
    </Container>
  );
}

export default CourseList;
