import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseList from './CourseList';
import axiosInstance from '../utils/axiosConfig';

// Mock axiosInstance with proper implementation
jest.mock('../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
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
    axiosInstance.get.mockImplementation(() => new Promise(() => {}));
    render(<CourseList />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    axiosInstance.get.mockRejectedValueOnce(new Error('API Error'));
    render(<CourseList />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch courses/i)).toBeInTheDocument();
    });
  });

  test('displays courses when API call succeeds', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: mockCourses });
    render(<CourseList />);

    await waitFor(() => {
      expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
      expect(
        screen.getByText('Learn the fundamentals of JavaScript programming.'),
      ).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('8 hours')).toBeInTheDocument();

      // Check for second course
      expect(
        screen.getByText('Web Development with Node.js'),
      ).toBeInTheDocument();
      expect(screen.getByText('$79.99')).toBeInTheDocument();
    });
  });

  test('displays message when no courses are available', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: [] });
    render(<CourseList />);

    await waitFor(() => {
      expect(
        screen.getByText('No courses available at this time.'),
      ).toBeInTheDocument();
    });
  });

  test('navigates to course details when View Details button is clicked', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: mockCourses });
    render(<CourseList />);

    await waitFor(() => {
      expect(screen.getAllByText('View Details')[0]).toBeInTheDocument();
    });

    const viewDetailsButtons = screen.getAllByText('View Details');

    await act(async () => {
      await userEvent.click(viewDetailsButtons[0]);
    });

    expect(mockedNavigate).toHaveBeenCalledWith(
      `/courses/${mockCourses[0]._id}`,
    );
  });

  test('displays a CORS error message when appropriate', async () => {
    const corsError = new Error('Network Error');
    corsError.message = 'CORS error: No access-control-allow-origin header';
    axiosInstance.get.mockRejectedValueOnce(corsError);

    render(<CourseList />);

    await waitFor(() => {
      expect(screen.getByText(/CORS error:/i)).toBeInTheDocument();
    });
  });

  test('accepts and uses data-testid prop', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: mockCourses });
    render(<CourseList data-testid='custom-test-id' />);

    await waitFor(() => {
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  test('handles non-array response data gracefully', async () => {
    axiosInstance.get.mockResolvedValueOnce({
      data: { message: 'invalid format' },
    });
    render(<CourseList />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load courses: Unexpected data format/i),
      ).toBeInTheDocument();
    });
  });
});
