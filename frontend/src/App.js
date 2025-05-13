import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import CourseList from './components/CourseList';
import CourseDetails from './components/CourseDetails';
import CourseContent from './components/courses/CourseContent';
import Login from './components/Login';
import Register from './components/Register';
import Success from './components/Success';
import UserDashboard from './components/UserDashboard';
import CreateCourse from './components/CreateCourse';
import CourseContentEditor from './components/courses/editor/CourseContentEditor';
import MyCourses from './components/MyCourses';
import Navbar from './components/Navbar';
import PersonalInformation from './components/PersonalInformation';

function App() {
  return (
    <BrowserRouter>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
      >
        {/* Navbar block - full width at the top */}
        <Box sx={{ flexShrink: 0 }}>
          <Navbar />
        </Box>

        {/* Content area - takes remaining height */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
          }}
        >
          <Routes>
            {/* For course content, use full width without container padding */}
            <Route
              path='/courses/:id/content/:contentId'
              element={<CourseContent data-testid='course-content' />}
            />

            {/* For all other routes, use container with padding */}
            <Route
              path='/'
              element={
                <Container sx={{ py: 2 }}>
                  <Box sx={{ my: 4 }}>
                    <Typography
                      variant='h3'
                      component='h1'
                      sx={{ textAlign: 'center' }}
                    >
                      Educ Blue
                    </Typography>
                  </Box>
                  <CourseList data-testid='course-list' />
                </Container>
              }
            />

            {/* Other routes with Container */}
            <Route
              path='/courses/:id'
              element={
                <Container sx={{ py: 2 }}>
                  <CourseDetails data-testid='course-details' />
                </Container>
              }
            />
            <Route
              path='/login'
              element={
                <Container sx={{ py: 2 }}>
                  <Login />
                </Container>
              }
            />
            <Route
              path='/register'
              element={
                <Container sx={{ py: 2 }}>
                  <Register />
                </Container>
              }
            />
            <Route
              path='/success'
              element={
                <Container sx={{ py: 2 }}>
                  <Success />
                </Container>
              }
            />
            <Route
              path='/dashboard'
              element={
                <Container sx={{ py: 2 }}>
                  <UserDashboard />
                </Container>
              }
            />
            <Route
              path='/create-course'
              element={
                <Container sx={{ py: 2 }}>
                  <CreateCourse />
                </Container>
              }
            />
            <Route
              path='/create-course/:id/content'
              element={
                <Container sx={{ py: 2 }}>
                  <CourseContentEditor />
                </Container>
              }
            />
            <Route
              path='/my-courses'
              element={
                <Container sx={{ py: 2 }}>
                  <MyCourses />
                </Container>
              }
            />
            <Route
              path='/profile'
              element={
                <Container sx={{ py: 2 }}>
                  <PersonalInformation />
                </Container>
              }
            />
            <Route
              path='/personal-information'
              element={
                <Container sx={{ py: 2 }}>
                  <PersonalInformation />
                </Container>
              }
            />
          </Routes>
        </Box>
      </Box>
    </BrowserRouter>
  );
}

export default App;
