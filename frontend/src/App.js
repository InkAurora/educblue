import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import theme from './theme';
import CourseList from './components/CourseList';
import CourseDetails from './components/CourseDetails';
import CourseContent from './components/courses/CourseContent';
import Login from './components/Login';
import Register from './components/Register';
import Success from './components/Success';
import UserDashboard from './components/UserDashboard';
import CreateCourse from './components/CreateCourse';
import CourseContentEditor from './components/courses/editor/CourseContentEditor';
import InstructorAnalytics from './components/instructor/InstructorAnalytics';
import MyCourses from './components/MyCourses';
import Navbar from './components/Navbar';
import PersonalInformation from './components/PersonalInformation';
import AdminDashboard from './components/admin/AdminDashboard';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Fixed Navbar - Always visible at top */}
          <Navbar />

          {/* Main content area - scrollable */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              paddingTop: '64px', // Account for fixed navbar
              backgroundColor: '#f5f5f5',
              position: 'relative',
              /* Mobile app feel with subtle gradients */
              background: {
                xs: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                md: '#f5f5f5',
              },
            }}
          >
            <Routes>
              {/* Course content page - full width layout with sidebar */}
              <Route
                path='/courses/:id/content/:contentId'
                element={<CourseContent data-testid='course-content' />}
              />

              {/* Section-based course content page */}
              <Route
                path='/courses/:id/sections/:sectionId/content/:contentId'
                element={<CourseContent data-testid='course-content' />}
              />

              {/* Home page with special styling */}
              <Route
                path='/'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: { xs: 3, sm: 4 },
                    }}
                  >
                    {/* Title Section - Centered with max width */}
                    <Box
                      sx={{
                        maxWidth: 'lg',
                        mx: 'auto',
                        mb: { xs: 3, sm: 4 },
                        textAlign: 'center',
                        py: { xs: 2, sm: 3 },
                      }}
                    >
                      <Typography
                        variant='h4'
                        component='h1'
                        sx={{
                          fontWeight: 'bold',
                          color: 'primary.main',
                          mb: 2,
                          fontSize: { xs: '1.75rem', sm: '2.125rem' },
                        }}
                      >
                        Educ Blue
                      </Typography>
                      <Typography
                        variant='subtitle1'
                        sx={{
                          color: 'text.secondary',
                          fontSize: { xs: '1rem', sm: '1.125rem' },
                        }}
                      >
                        Learn. Grow. Succeed.
                      </Typography>
                    </Box>
                    {/* CourseList - Full width without container constraints */}
                    <CourseList data-testid='course-list' />
                  </Box>
                }
              />

              {/* Instructor Analytics - full width */}
              <Route
                path='/courses/:id/analytics'
                element={
                  <InstructorAnalytics data-testid='instructor-analytics' />
                }
              />

              {/* Admin Dashboard - full width */}
              <Route path='/admin' element={<AdminDashboard />} />

              {/* All other routes with consistent container styling */}
              <Route
                path='/courses/:id'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    <Container maxWidth='lg' sx={{ px: 0 }}>
                      <CourseDetails data-testid='course-details' />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/login'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Container maxWidth='sm' sx={{ px: 0 }}>
                      <Login />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/register'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Container maxWidth='sm' sx={{ px: 0 }}>
                      <Register />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/success'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Container maxWidth='sm' sx={{ px: 0 }}>
                      <Success />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/dashboard'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    <Container maxWidth='lg' sx={{ px: 0 }}>
                      <UserDashboard />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/create-course'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    <Container maxWidth='lg' sx={{ px: 0 }}>
                      <CreateCourse />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/create-course/:id/content'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    <Container maxWidth='lg' sx={{ px: 0 }}>
                      <CourseContentEditor />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/my-courses'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3, md: 4 },
                      py: { xs: 2, sm: 3 },
                    }}
                  >
                    <Container maxWidth='lg' sx={{ px: 0 }}>
                      <MyCourses />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/profile'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Container maxWidth='sm' sx={{ px: 0 }}>
                      <PersonalInformation />
                    </Container>
                  </Box>
                }
              />
              <Route
                path='/personal-information'
                element={
                  <Box
                    sx={{
                      minHeight: '100%',
                      px: { xs: 2, sm: 3 },
                      py: { xs: 2, sm: 3 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Container maxWidth='sm' sx={{ px: 0 }}>
                      <PersonalInformation />
                    </Container>
                  </Box>
                }
              />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
