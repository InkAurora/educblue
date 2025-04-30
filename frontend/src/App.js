import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import CourseList from './components/CourseList';
import CourseDetails from './components/CourseDetails';
import CourseContent from './components/CourseContent';
import Login from './components/Login';
import Register from './components/Register';
import Success from './components/Success';
import UserDashboard from './components/UserDashboard';
import CreateCourse from './components/CreateCourse';
import CourseContentEditor from './components/CourseContentEditor';
import MyCourses from './components/MyCourses';
import Navbar from './components/Navbar';
import PersonalInformation from './components/PersonalInformation';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Container>
        <Box sx={{ my: 4 }}>
          <Typography variant='h3' component='h1' sx={{ textAlign: 'center' }}>
            Educ Blue
          </Typography>
        </Box>
        <Routes>
          <Route path='/' element={<CourseList data-testid='course-list' />} />
          <Route
            path='/courses/:id'
            element={<CourseDetails data-testid='course-details' />}
          />
          <Route
            path='/courses/:id/content/:contentId'
            element={<CourseContent data-testid='course-content' />}
          />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/success' element={<Success />} />
          <Route path='/dashboard' element={<UserDashboard />} />
          <Route path='/create-course' element={<CreateCourse />} />
          <Route
            path='/create-course/:id/content'
            element={<CourseContentEditor />}
          />
          <Route path='/my-courses' element={<MyCourses />} />
          <Route path='/profile' element={<PersonalInformation />} />
          <Route
            path='/personal-information'
            element={<PersonalInformation />}
          />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
