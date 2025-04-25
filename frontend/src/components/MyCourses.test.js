import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import MyCourses from './MyCourses';

jest.mock('axios');
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
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
  });

  test('renders loading state initially', async () => {
    // Setup token and mocks
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: 'instructor@example.com' });
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading

    render(<MyCourses />);

    // Check for loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error when not logged in', async () => {
    // Setup empty token
    window.localStorage.getItem.mockReturnValue(null);

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText('You must be logged in to view your courses'),
      ).toBeInTheDocument();
    });
  });

  test('displays error message on API error', async () => {
    // Setup token
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: 'instructor@example.com' });

    // Setup axios error
    const errorMessage = 'Network Error';
    axios.get.mockRejectedValueOnce({ message: errorMessage });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(`Failed to fetch courses: ${errorMessage}`),
      ).toBeInTheDocument();
    });
  });

  test('displays access denied message on 403 error', async () => {
    // Setup token
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: 'instructor@example.com' });

    // Setup axios 403 error
    axios.get.mockRejectedValueOnce({
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
    // Setup token
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: 'instructor@example.com' });

    // Setup axios response with empty array
    axios.get.mockResolvedValueOnce({ data: [] });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'You haven\'t created any courses yet. Click "Create Course" to get started.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('displays courses created by the instructor', async () => {
    // Setup token and instructor email
    const instructorEmail = 'instructor@example.com';
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: instructorEmail });

    // Mock courses data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        instructor: instructorEmail,
        duration: 10,
        published: true,
      },
      {
        _id: '2',
        title: 'Advanced JavaScript',
        description: 'Master JavaScript concepts',
        price: 39.99,
        instructor: instructorEmail,
        duration: 15,
        published: false,
      },
      {
        _id: '3',
        title: 'Another Course',
        description: 'Not by this instructor',
        price: 19.99,
        instructor: 'another@example.com',
        duration: 5,
        published: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      // Should find the two courses by the current instructor
      expect(screen.getByText('React Basics')).toBeInTheDocument();
      expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();

      // Should not find the course by another instructor
      expect(screen.queryByText('Another Course')).not.toBeInTheDocument();

      // Should display status chips
      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('Draft')).toBeInTheDocument();
    });
  });

  test('navigates to edit content page when Edit Content button is clicked', async () => {
    // Setup token and instructor email
    const instructorEmail = 'instructor@example.com';
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: instructorEmail });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        instructor: instructorEmail,
        duration: 10,
        published: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    // Wait for the component to render with data
    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    // Click the Edit Content button
    const editButton = screen.getByText('Edit Content');
    userEvent.click(editButton);

    // Verify navigation
    expect(mockedNavigate).toHaveBeenCalledWith('/create-course/1/content');
  });

  test('navigates to course details page when View Course button is clicked', async () => {
    // Setup token and instructor email
    const instructorEmail = 'instructor@example.com';
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: instructorEmail });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'React Basics',
        description: 'Learn React fundamentals',
        price: 29.99,
        instructor: instructorEmail,
        duration: 10,
        published: true,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    // Wait for the component to render with data
    await waitFor(() => {
      expect(screen.getByText('React Basics')).toBeInTheDocument();
    });

    // Click the View Course button
    const viewButton = screen.getByText('View Course');
    userEvent.click(viewButton);

    // Verify navigation
    expect(mockedNavigate).toHaveBeenCalledWith('/courses/1');
  });

  test('handles invalid JWT token gracefully', async () => {
    // Setup token but make jwtDecode throw an error
    window.localStorage.getItem.mockReturnValue('invalid-token');
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    render(<MyCourses />);

    await waitFor(() => {
      expect(
        screen.getByText('You must be logged in to view your courses'),
      ).toBeInTheDocument();
    });
  });

  test('displays correct price formatting', async () => {
    // Setup token and instructor email
    const instructorEmail = 'instructor@example.com';
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: instructorEmail });

    // Mock course data with different price formats
    const courses = [
      {
        _id: '1',
        title: 'Free Course',
        description: 'A free course',
        price: 0,
        instructor: instructorEmail,
        duration: 5,
        published: true,
      },
      {
        _id: '2',
        title: 'Paid Course',
        description: 'A paid course',
        price: 29.99,
        instructor: instructorEmail,
        duration: 10,
        published: false,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      // Check for price display with $ sign
      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });
  });

  test('displays course duration correctly', async () => {
    // Setup token and instructor email
    const instructorEmail = 'instructor@example.com';
    window.localStorage.getItem.mockReturnValue('fake-token');
    jwtDecode.mockReturnValue({ email: instructorEmail });

    // Mock course data
    const courses = [
      {
        _id: '1',
        title: 'Short Course',
        description: 'A short course',
        price: 19.99,
        instructor: instructorEmail,
        duration: 1,
        published: true,
      },
      {
        _id: '2',
        title: 'Long Course',
        description: 'A long course',
        price: 49.99,
        instructor: instructorEmail,
        duration: 20,
        published: false,
      },
    ];

    axios.get.mockResolvedValueOnce({ data: courses });

    render(<MyCourses />);

    await waitFor(() => {
      expect(screen.getByText('Duration: 1 hours')).toBeInTheDocument();
      expect(screen.getByText('Duration: 20 hours')).toBeInTheDocument();
    });
  });
});
