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
  Chip,
  Stack,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import axiosInstance from '../utils/axiosConfig';

function MyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        // Use the new instructor-specific endpoint that returns all courses (including drafts)
        const response = await axiosInstance.get('/api/courses/instructor');

        // The API now returns only the instructor's courses, so no filtering needed
        setCourses(response.data.courses);
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 401) {
          setError('You must be logged in to view your courses');
        } else if (err.response?.status === 403) {
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
    <Container sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant='h4' component='h1' gutterBottom>
        My Courses
      </Typography>

      {courses.length === 0 ? (
        <Alert severity='info'>
          You haven&apos;t created any courses yet. Click &quot;Create
          Course&quot; to get started.
        </Alert>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {courses.map((course) => (
            <Grid
              item
              key={course._id}
              xs={12}
              sm={6}
              md={4}
              sx={{ width: '100%' }}
            >
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  maxWidth: '100%',
                  boxShadow: { xs: 3, sm: 2 }, // Stronger shadow on mobile for emphasis
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant='h5' component='h2'>
                    {course.title}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={
                        course.status === 'published' ? 'Published' : 'Draft'
                      }
                      color={
                        course.status === 'published' ? 'success' : 'default'
                      }
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

                  <Stack
                    sx={{
                      mt: 2,
                      gap: 1,
                    }}
                    spacing={1}
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
                      variant='contained'
                      color='secondary'
                      fullWidth
                      startIcon={<BarChartIcon />}
                      onClick={() =>
                        navigate(`/courses/${course._id}/analytics`)
                      }
                    >
                      View Analytics
                    </Button>
                    <Button
                      variant='outlined'
                      color='primary'
                      fullWidth
                      onClick={() => navigate(`/courses/${course._id}`)}
                    >
                      View Course
                    </Button>
                  </Stack>
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
