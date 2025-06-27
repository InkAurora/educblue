import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import CourseSidebar from './components/CourseSidebar';

// Wrapper component to handle sidebar persistence logic
function AppWithSidebar() {
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarData, setSidebarData] = useState(null);

  useEffect(() => {
    // Check if current route is a course content page
    const isCourseContentPage =
      location.pathname.includes('/courses/') &&
      location.pathname.includes('/content/');

    setShowSidebar(isCourseContentPage);

    // Extract course ID from URL for sidebar data
    if (isCourseContentPage) {
      const courseIdMatch = location.pathname.match(/\/courses\/([^/]+)/);
      const sectionIdMatch = location.pathname.match(/\/sections\/([^/]+)/);
      if (courseIdMatch) {
        // For now, we'll pass the courseId to the sidebar
        // The sidebar component will handle fetching its own data
        setSidebarData({
          courseId: courseIdMatch[1],
          sectionId: sectionIdMatch ? sectionIdMatch[1] : null,
        });
      }
    } else {
      setSidebarData(null);
    }
  }, [location.pathname]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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

        {/* Main layout with conditional sidebar */}
        <Box
          sx={{
            flex: 1,
            overflow: 'hidden',
            paddingTop: '64px', // Account for fixed navbar
            backgroundColor: '#f5f5f5',
            position: 'relative',
            display: 'flex',
            /* Mobile app feel with subtle gradients */
            background: {
              xs: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
              md: '#f5f5f5',
            },
          }}
        >
          {/* Persistent Sidebar - Only show on course content pages */}
          {showSidebar && sidebarData && (
            <Box
              sx={{
                width: { xs: 0, md: '300px' }, // Hidden on mobile, shown on desktop
                flexShrink: 0,
                borderRight: 1,
                borderColor: 'divider',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 900,
              }}
            >
              <CourseSidebar
                courseId={sidebarData.courseId}
                currentSectionId={sidebarData.sectionId}
                // The sidebar will handle fetching course data internally
              />
            </Box>
          )}

          {/* Main content area - scrollable */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              position: 'relative',
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
                    {' '}
                    {/* Hero Section - Modern header with gradient background */}
                    <Box
                      sx={{
                        maxWidth: 'lg',
                        mx: 'auto',
                        mb: { xs: 4, sm: 6 },
                        textAlign: 'center',
                        py: { xs: 4, sm: 6 },
                        px: { xs: 2, sm: 3 },
                        background:
                          'linear-gradient(145deg, rgba(2, 230, 239, 0.08) 0%, rgba(255, 255, 255, 0.4) 100%)',
                        borderRadius: 4,
                        border: '1px solid rgba(2, 230, 239, 0.2)',
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <Typography
                        variant='h2'
                        component='h1'
                        sx={{
                          fontWeight: 800,
                          background:
                            'linear-gradient(135deg, #02e6ef, #01b8c4)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          mb: 2,
                          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4rem' },
                          lineHeight: 1.1,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Educ Blue
                      </Typography>
                      <Typography
                        variant='h5'
                        sx={{
                          color: 'text.secondary',
                          fontSize: { xs: '1.25rem', sm: '1.5rem' },
                          fontWeight: 400,
                          mb: 3,
                          lineHeight: 1.4,
                        }}
                      >
                        Discover. Learn. Excel.
                      </Typography>
                      <Typography
                        variant='body1'
                        sx={{
                          color: 'text.secondary',
                          fontSize: { xs: '1rem', sm: '1.125rem' },
                          maxWidth: '600px',
                          mx: 'auto',
                          lineHeight: 1.6,
                        }}
                      >
                        Start your learning journey with our growing platform.
                        Explore courses, develop new skills, and achieve your
                        goals at your own pace.
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
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppWithSidebar />
    </BrowserRouter>
  );
}

export default App;
