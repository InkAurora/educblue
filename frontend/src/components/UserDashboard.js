import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';

function UserDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        // Redirect to login page if no token is found
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserData(response.data);

        // Assuming enrolled courses are included in the user data response
        if (response.data.enrolledCourses) {
          setEnrolledCourses(response.data.enrolledCourses);
        }

        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch profile: ${err.message}`);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

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
      {userData && (
        <>
          <Box mb={4}>
            <Typography variant='h4' component='h1' gutterBottom>
              Welcome, {userData.email}
            </Typography>
          </Box>

          <Box mb={4}>
            <Typography variant='h5' component='h2' gutterBottom>
              Your Enrolled Courses
            </Typography>
            <Grid container spacing={4}>
              {enrolledCourses.length > 0 ? (
                enrolledCourses.map((course) => (
                  <Grid
                    key={course.id}
                    sx={{
                      width: { xs: '100%', sm: '50%', md: '33.33%' },
                      p: 2,
                    }}
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
                        <Typography
                          variant='body2'
                          color='text.secondary'
                          sx={{ mt: 1 }}
                        >
                          Instructor: {course.instructor}
                        </Typography>
                        <Button
                          variant='contained'
                          color='primary'
                          sx={{ mt: 2 }}
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          Continue Learning
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
                  You are not enrolled in any courses yet.
                </Typography>
              )}
            </Grid>
          </Box>
        </>
      )}
    </Container>
  );
}

export default UserDashboard;
