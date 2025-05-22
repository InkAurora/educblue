import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Container,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../../utils/axiosConfig';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuBookIcon from '@mui/icons-material/MenuBook';

/**
 * InstructorAnalytics component displays analytics data for course instructors.
 * Shows completion rates, quiz scores, and other analytics data.
 * Only accessible to course instructors.
 */
function InstructorAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Get current user from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch course data and analytics
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return; // Wait for user to be set
      }

      try {
        // First fetch course data to check instructor permission
        const courseResponse = await axiosInstance.get(`/api/courses/${id}`);
        setCourse(courseResponse.data);

        // Then fetch analytics data
        const analyticsResponse = await axiosInstance.get(
          `/api/courses/${id}/analytics`,
        );
        setAnalytics(analyticsResponse.data);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to fetch analytics data',
        );
        setLoading(false);
      }
    };

    if (id && user) {
      fetchData();
    }
  }, [id, user]);

  // Check if user is the course instructor
  useEffect(() => {
    if (user && course && user.fullName !== course.instructor) {
      setError('You are not authorized to view analytics for this course');
      navigate(`/courses/${id}`);
    }
  }, [user, course, id, navigate]);

  // Generate chart data from quiz stats
  const getChartData = () => {
    if (!analytics || !analytics.quizStats) return [];

    return analytics.quizStats.map((quiz) => ({
      name:
        quiz.title.length > 15
          ? `${quiz.title.substring(0, 15)}...`
          : quiz.title,
      averageScore: quiz.averageScore,
    }));
  };

  // Render loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container sx={{ py: 2 }}>
        <Alert severity='error'>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* Navigation breadcrumbs */}
      <Breadcrumbs aria-label='breadcrumb' sx={{ mb: 3 }}>
        <Link
          underline='hover'
          color='inherit'
          sx={{ display: 'flex', alignItems: 'center' }}
          href='/'
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize='inherit' />
          Home
        </Link>
        <Link
          underline='hover'
          color='inherit'
          sx={{ display: 'flex', alignItems: 'center' }}
          href={`/courses/${id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/courses/${id}`);
          }}
        >
          <MenuBookIcon sx={{ mr: 0.5 }} fontSize='inherit' />
          {course?.title}
        </Link>
        <Typography
          sx={{ display: 'flex', alignItems: 'center' }}
          color='text.primary'
        >
          <AssessmentIcon sx={{ mr: 0.5 }} fontSize='inherit' />
          Analytics
        </Typography>
      </Breadcrumbs>

      {/* Page header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h3' component='h1' gutterBottom>
          Course Analytics
        </Typography>
        <Typography variant='h5' gutterBottom color='text.secondary'>
          {course?.title}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Completion Rate */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant='h3' component='div' color='primary'>
                {analytics?.completionRate
                  ? `${analytics.completionRate}%`
                  : 'N/A'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Percentage of students who completed at least one item in the
                course
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Student Count */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                Enrolled Students
              </Typography>
              <Typography variant='h3' component='div' color='primary'>
                {analytics?.totalEnrolledStudents || 0}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Total number of enrolled students
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Students */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant='h6' color='text.secondary' gutterBottom>
                Active Students
              </Typography>
              <Typography variant='h3' component='div' color='primary'>
                {analytics?.activeStudentsLast30Days || 0}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Students active in the last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quiz Scores Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant='h5' gutterBottom>
              Quiz Average Scores
            </Typography>
            <Box sx={{ height: 400 }}>
              {analytics?.quizStats && analytics.quizStats.length > 0 ? (
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart
                    data={getChartData()}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar
                      name='Average Score (%)'
                      dataKey='averageScore'
                      fill='#8884d8'
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant='body1' color='text.secondary'>
                    No quiz data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Quiz Details List */}
        <Grid item xs={12}>
          <Paper>
            <List sx={{ bgcolor: 'background.paper' }}>
              <ListItem sx={{ bgcolor: 'background.paper', py: 2 }}>
                <ListItemText
                  primary={
                    <Typography variant='h5'>Quiz Statistics</Typography>
                  }
                />
              </ListItem>
              <Divider />

              {analytics?.quizStats && analytics.quizStats.length > 0 ? (
                analytics.quizStats.map((quiz, index) => (
                  <React.Fragment key={quiz.contentId}>
                    <ListItem sx={{ py: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <ListItemText
                            primary={
                              <Typography variant='h6'>{quiz.title}</Typography>
                            }
                            secondary={`${quiz.submissionCount} submissions`}
                          />
                        </Grid>
                        <Grid
                          item
                          xs={12}
                          sm={6}
                          sx={{ textAlign: { sm: 'right' } }}
                        >
                          <Typography variant='body1'>
                            Average Score: {quiz.averageScore}%
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {/* Highest: {quiz.highestScore}% | Lowest:{' '}
                            {quiz.lowestScore}% */}
                          </Typography>
                        </Grid>
                      </Grid>
                    </ListItem>
                    {index < analytics.quizStats.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary='No quiz data available' />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default InstructorAnalytics;
