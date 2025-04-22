import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import CourseList from './CourseList';

jest.mock('axios');
jest.mock('react-router-dom');

describe('CourseList', () => {
  const mockCourses = [
    {
      id: 1,
      title: 'React Basics',
      description: 'Learn React fundamentals',
      price: 99.99,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    render(<CourseList />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    render(<CourseList />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch courses. Please try again later.')
      ).toBeInTheDocument();
    });
  });

  test('displays courses when API call succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });
    render(<CourseList />);

    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('Learn React fundamentals')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
  });
});
