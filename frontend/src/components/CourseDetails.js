import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography } from '@mui/material';

function CourseDetails() {
  const { id } = useParams();

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant='h4' component='h1' gutterBottom>
        Course ID: {id}
      </Typography>
    </Container>
  );
}

export default CourseDetails;
