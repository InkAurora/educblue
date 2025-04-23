import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import CourseList from './CourseList';

jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('CourseList', () => {
  const mockCourses = [
    {
      _id: '68074d007e5d64ea96cb511a',
      title: 'JavaScript Basics',
      description: 'Learn the fundamentals of JavaScript programming.',
      price: 49.99,
      instructor: 'John Smith',
      duration: 8,
      content: [
        {
          _id: 'content1',
          title: 'Introduction to JavaScript',
          type: 'video',
        },
      ],
    },
    {
      _id: '68074d007e5d64ea96cb511c',
      title: 'Web Development with Node.js',
      description: 'Master server-side JavaScript development with Node.js.',
      price: 79.99,
      instructor: 'Sarah Johnson',
      duration: 12,
      content: [
        {
          _id: 'content3',
          title: 'Getting Started with Node.js',
          type: 'video',
        },
      ],
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
      expect(screen.getByText(/Failed to fetch courses/i)).toBeInTheDocument();
    });
  });

  test('displays courses when API call succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourses });
    render(<CourseList />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
      expect(
        screen.getByText('Learn the fundamentals of JavaScript programming.'),
      ).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(screen.getByText('Instructor: John Smith')).toBeInTheDocument();
      expect(screen.getByText('Duration: 8 hours')).toBeInTheDocument();

      // Check for second course
      expect(
        screen.getByText('Web Development with Node.js'),
      ).toBeInTheDocument();
      expect(screen.getByText('$79.99')).toBeInTheDocument();
    });
  });

  test('displays message when no courses are available', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });
    render(<CourseList />);

    await waitFor(() => {
      expect(
        screen.getByText('No courses available at this time.'),
      ).toBeInTheDocument();
    });
  });
});
