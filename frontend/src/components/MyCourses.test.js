import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyCourses from './MyCourses';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../utils/axiosConfig';

jest.mock('jwt-decode');
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
}));

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
}));

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('MyCourses Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.getItem.mockReturnValue('fake-token');
  });

  test('renders loading state initially', async () => {
    // Setup token and mocks
    jwtDecode.mockReturnValue({ fullName: 'Test Instructor' });

    // This will keep the component in loading state during the test
    axiosInstance.get.mockImplementation(() => new Promise(() => {}));

    render(<MyCourses />);

    // Check for loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error when not logged in', async () => {
    // Setup empty token
    window.localStorage.getItem.mockReturnValue(null);

    // Mock decode to return null
    jwtDecode.mockReturnValue({});

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText('You must be logged in to view your courses'),
      ).toBeInTheDocument();
    });
  });

  test('displays error message on API error', async () => {
    // Setup token
    jwtDecode.mockReturnValue({ fullName: 'Test Instructor' });

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
    // Setup token
    jwtDecode.mockReturnValue({ fullName: 'Test Instructor' });

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

  test('displays message when no courses are available', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Setup axios response with empty array
    axiosInstance.get.mockResolvedValueOnce({ data: [] });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(/You haven't created any courses yet/),
      ).toBeInTheDocument();
    });
  });

  test('displays courses created by the instructor', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Mock courses data - note that courses are filtered by instructor name
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        instructor: instructorName, // Match the instructor name from token
        duration: 10,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Advanced JavaScript',
        description: 'Master JavaScript concepts',
        price: 39.99,
        instructor: instructorName, // Match the instructor name from token
        duration: 15,
        status: 'draft',
      },
      {
        _id: '3',
        title: 'Other Course',
        description: 'By different instructor',
        price: 19.99,
        instructor: 'Different Instructor', // Different instructor, should be filtered out
        duration: 8,
        status: 'published',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      // Should find the two courses by the current instructor
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
      // Should not find the course by a different instructor
      expect(screen.queryByText('Other Course')).not.toBeInTheDocument();
    });
  });

  test('navigates to edit content page when Edit Content button is clicked', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        instructor: instructorName,
        duration: 10,
        status: 'published',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: courses });

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

  test('navigates to course details page when View Course button is clicked', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        instructor: instructorName,
        duration: 10,
        status: 'published',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: courses });

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

  test('handles invalid JWT token gracefully', async () => {
    // Setup token but make jwtDecode throw an error
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Mock axios to resolve since we're only testing token error handling
    axiosInstance.get.mockResolvedValueOnce({ data: [] });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText('You must be logged in to view your courses'),
      ).toBeInTheDocument();
    });
  });

  test('displays correct price formatting', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Mock course data with different price formats
    const courses = [
      {
        _id: '1',
        title: 'Free Course',
        description: 'A free course',
        price: 0,
        instructor: instructorName,
        duration: 5,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Paid Course',
        description: 'A paid course',
        price: 29.99,
        instructor: instructorName,
        duration: 10,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      // Check for price display with $ sign
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  test('displays course duration correctly', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'Short Course',
        description: 'A short course',
        price: 19.99,
        instructor: instructorName,
        duration: 1,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Long Course',
        description: 'A long course',
        price: 49.99,
        instructor: instructorName,
        duration: 20,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      expect(screen.getByText('Duration: 1 hours')).toBeInTheDocument();
      expect(screen.getByText('Duration: 20 hours')).toBeInTheDocument();
    });
  });

  test('displays course status chips correctly', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'Published Course',
        description: 'A published course',
        price: 19.99,
        instructor: instructorName,
        duration: 5,
        status: 'published',
      },
      {
        _id: '2',
        title: 'Draft Course',
        description: 'A draft course',
        price: 29.99,
        instructor: instructorName,
        duration: 10,
        status: 'draft',
      },
    ];

    axiosInstance.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  test('displays instructor name from token', async () => {
    // Setup token with instructor name
    const instructorName = 'Test Instructor';
    jwtDecode.mockReturnValue({ fullName: instructorName });

    // Setup axios response with empty array
    axiosInstance.get.mockResolvedValueOnce({ data: [] });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(`Instructor: ${instructorName}`),
      ).toBeInTheDocument();
    });
  });
});
