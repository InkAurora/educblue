import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyCourses from './MyCourses';
import axiosInstance from '../utils/axiosConfig';

jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
}));

describe('MyCourses Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    // This will keep the component in loading state during the test
    axiosInstance.get.mockImplementation(() => new Promise(() => {}));

    render(<MyCourses />);

    // Check for loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message on API error', async () => {
    // Setup axios error
    const errorMessage = 'Network Error';
    axiosInstance.get.mockRejectedValueOnce(new Error(errorMessage));

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(`Failed to fetch courses: ${errorMessage}`),
      ).toBeInTheDocument();
    });
  });

  test('displays access denied message on 403 error', async () => {
    // Setup axios 403 error
    axiosInstance.get.mockRejectedValueOnce({
      response: { status: 403 },
    });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'Access denied. You do not have permission to view these courses.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('displays unauthorized message on 401 error', async () => {
    // Setup axios 401 error
    axiosInstance.get.mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText('You must be logged in to view your courses'),
      ).toBeInTheDocument();
    });
  });

  test('displays message when no courses are available', async () => {
    // Setup axios response with empty courses array
    axiosInstance.get.mockResolvedValueOnce({ data: { courses: [] } });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(/You haven't created any courses yet/),
      ).toBeInTheDocument();
    });
  });

  test('displays courses from API response', async () => {
    // Mock courses data - API now returns all instructor's courses
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        duration: 10,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Advanced JavaScript',
        description: 'Master JavaScript concepts',
        price: 39.99,
        duration: 15,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
    });
  });

  test('navigates to edit content page when Edit Content button is clicked', async () => {
    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        duration: 10,
        status: 'published',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    // Wait for the component to render with data
    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    // Click the Edit Content button
    fireEvent.click(screen.getByText('Edit Content'));

    // Verify navigation
    expect(mockedNavigate).toHaveBeenCalledWith('/create-course/1/content');
  });

  test('navigates to course analytics page when View Analytics button is clicked', async () => {
    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        duration: 10,
        status: 'published',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    // Wait for the component to render with data
    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    // Click the View Analytics button
    fireEvent.click(screen.getByText('View Analytics'));

    // Verify navigation
    expect(mockedNavigate).toHaveBeenCalledWith('/courses/1/analytics');
  });

  test('navigates to course details page when View Course button is clicked', async () => {
    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        duration: 10,
        status: 'published',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    // Wait for the component to render with data
    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    // Click the View Course button
    fireEvent.click(screen.getByText('View Course'));

    // Verify navigation
    expect(mockedNavigate).toHaveBeenCalledWith('/courses/1');
  });

  test('displays correct price formatting', async () => {
    // Mock course data with different price formats
    const courses = [
      {
        _id: '1',
        title: 'Free Course',
        description: 'A free course',
        price: 0,
        duration: 5,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Paid Course',
        description: 'A paid course',
        price: 29.99,
        duration: 10,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    await waitFor(() => {
      // Check for price display with $ sign
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  test('displays course duration correctly', async () => {
    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'Short Course',
        description: 'A short course',
        price: 19.99,
        duration: 1,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Long Course',
        description: 'A long course',
        price: 49.99,
        duration: 20,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    await waitFor(() => {
      expect(screen.getByText('Duration: 1 hours')).toBeInTheDocument();
      expect(screen.getByText('Duration: 20 hours')).toBeInTheDocument();
    });
  });

  test('displays course status chips correctly', async () => {
    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'Published Course',
        description: 'A published course',
        price: 19.99,
        duration: 5,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Draft Course',
        description: 'A draft course',
        price: 29.99,
        duration: 10,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: { courses } });

    render(<MyCourses />);

    await waitFor(() => {
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  test('calls correct API endpoint', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: { courses: [] } });

    render(<MyCourses />);

    await waitFor(() => {
      expect(axiosInstance.get).toHaveBeenCalledWith('/api/courses/instructor');
    });
  });
});
