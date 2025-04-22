import React from 'react';
import { render, screen } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import CourseDetails from './CourseDetails';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

describe('CourseDetails', () => {
  beforeEach(() => {
    useParams.mockReturnValue({ id: '123' });
  });

  test('displays the course ID from URL parameters', () => {
    render(<CourseDetails />);
    expect(screen.getByText('Course ID: 123')).toBeInTheDocument();
  });

  test('displays different course ID when URL parameter changes', () => {
    useParams.mockReturnValue({ id: '456' });
    render(<CourseDetails />);
    expect(screen.getByText('Course ID: 456')).toBeInTheDocument();
  });
});
