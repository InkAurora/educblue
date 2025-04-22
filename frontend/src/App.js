import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Container, Typography } from '@mui/material';
import CourseList from './components/CourseList';
import CourseDetails from './components/CourseDetails';

function App() {
  return (
    <BrowserRouter>
      <Container>
        <Typography
          variant='h3'
          component='h1'
          sx={{ my: 4, textAlign: 'center' }}
        >
          Educ Blue
        </Typography>
        <Routes>
          <Route path='/' element={<CourseList data-testid='course-list' />} />
          <Route
            path='/courses/:id'
            element={<CourseDetails data-testid='course-details' />}
          />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
