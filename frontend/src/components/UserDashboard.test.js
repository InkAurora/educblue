import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock axios before importing components that use it
jest.mock('axios');
import axios from 'axios';

import UserDashboard from './UserDashboard';

// Mock react-router-dom
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
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('UserDashboard Component', () => {
  const mockUserData = {
    _id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    enrolledCourses: [
      {
        id: 'course1',
        title: 'JavaScript Basics',
        description: 'Learn the fundamentals of JavaScript programming.',
        instructor: 'John Smith',
      },
      {
        id: 'course2',
        title: 'React Mastery',
        description: 'Advanced React concepts and patterns.',
        instructor: 'Jane Doe',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  test('redirects to login if no token exists', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValueOnce(null);

    render(<UserDashboard />);

    // Check if navigate was called with '/login'
    expect(mockedNavigate).toHaveBeenCalledWith('/login');
  });

  test('displays loading state initially when token exists', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Make axios.get hang (never resolve)
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(<UserDashboard />);

    // Check if loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error message when API call fails', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API error
    const errorMessage = 'API Error';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    render(<UserDashboard />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText(`Failed to fetch profile: ${errorMessage}`),
      ).toBeInTheDocument();
    });
  });

  test('displays user email and enrolled courses when API call succeeds', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock successful API response
    axios.get.mockResolvedValueOnce({ data: mockUserData });

    render(<UserDashboard />);

    // Check if user email is displayed
    await waitFor(() => {
      expect(
        screen.getByText(`Welcome, ${mockUserData.email}`),
      ).toBeInTheDocument();
    });

    // Check if both courses are displayed
    expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    expect(
      screen.getByText('Learn the fundamentals of JavaScript programming.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Instructor: John Smith')).toBeInTheDocument();

    expect(screen.getByText('React Mastery')).toBeInTheDocument();
    expect(
      screen.getByText('Advanced React concepts and patterns.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Instructor: Jane Doe')).toBeInTheDocument();

    // Check if Continue Learning buttons are present
    const continueButtons = screen.getAllByText('Continue Learning');
    expect(continueButtons.length).toBe(2);
  });

  test('displays message when user has no enrolled courses', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API response with no enrolled courses
    const userWithNoCourses = { ...mockUserData, enrolledCourses: [] };
    axios.get.mockResolvedValueOnce({ data: userWithNoCourses });

    render(<UserDashboard />);

    // Check if no courses message is displayed
    await waitFor(() => {
      expect(
        screen.getByText('You are not enrolled in any courses yet.'),
      ).toBeInTheDocument();
    });
  });

  test('navigates to course details when Continue Learning button is clicked', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock successful API response
    axios.get.mockResolvedValueOnce({ data: mockUserData });

    render(<UserDashboard />);

    // Wait for courses to be displayed
    await waitFor(() => {
      expect(screen.getByText('JavaScript Basics')).toBeInTheDocument();
    });

    // Find and click the first Continue Learning button
    const continueButtons = screen.getAllByText('Continue Learning');
    userEvent.click(continueButtons[0]);

    // Check if navigate was called with the correct course ID
    expect(mockedNavigate).toHaveBeenCalledWith(
      `/courses/${mockUserData.enrolledCourses[0].id}`,
    );
  });

  test('includes Authorization header with token in API request', async () => {
    // Mock a token in localStorage
    const token = 'fake-token-123';
    window.localStorage.getItem.mockReturnValueOnce(token);

    // Mock successful API response
    axios.get.mockResolvedValueOnce({ data: mockUserData });

    render(<UserDashboard />);

    // Check if axios.get was called with correct URL and headers
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:5000/api/users/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    });
  });

  test('handles API response without enrolledCourses field', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API response without enrolledCourses
    const userWithoutCourses = { ...mockUserData };
    delete userWithoutCourses.enrolledCourses;

    axios.get.mockResolvedValueOnce({ data: userWithoutCourses });

    render(<UserDashboard />);

    // Check if user email is displayed
    await waitFor(() => {
      expect(
        screen.getByText(`Welcome, ${mockUserData.email}`),
      ).toBeInTheDocument();
    });

    // Check if no courses message is displayed (since enrolledCourses would be empty)
    expect(
      screen.getByText('You are not enrolled in any courses yet.'),
    ).toBeInTheDocument();
  });

  test('handles course with courseId property instead of id', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API response with course using courseId instead of id
    const userWithAlternateCourseIds = {
      ...mockUserData,
      enrolledCourses: [
        {
          courseId: 'alt-course-id',
          title: 'Course with courseId',
          description: 'This course uses courseId property',
          instructor: 'Alice Johnson',
        },
      ],
    };

    axios.get.mockResolvedValueOnce({ data: userWithAlternateCourseIds });

    render(<UserDashboard />);

    // Wait for course to be displayed
    await waitFor(() => {
      expect(screen.getByText('Course with courseId')).toBeInTheDocument();
    });

    // Click the Continue Learning button
    const continueButton = screen.getByText('Continue Learning');
    userEvent.click(continueButton);

    // Check if navigate was called with the correct course ID using courseId property
    expect(mockedNavigate).toHaveBeenCalledWith(
      `/courses/${userWithAlternateCourseIds.enrolledCourses[0].courseId}`,
    );
  });

  test('handles course with _id property instead of id', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API response with course using _id instead of id
    const userWithUnderscoreIds = {
      ...mockUserData,
      enrolledCourses: [
        {
          _id: 'mongo-id-format',
          title: 'MongoDB Course',
          description: 'This course uses MongoDB-style _id property',
          instructor: 'Bob Smith',
        },
      ],
    };

    axios.get.mockResolvedValueOnce({ data: userWithUnderscoreIds });

    render(<UserDashboard />);

    // Wait for course to be displayed
    await waitFor(() => {
      expect(screen.getByText('MongoDB Course')).toBeInTheDocument();
    });

    // Click the Continue Learning button
    const continueButton = screen.getByText('Continue Learning');
    userEvent.click(continueButton);

    // Check if navigate was called with the correct course ID using _id property
    expect(mockedNavigate).toHaveBeenCalledWith(
      `/courses/${userWithUnderscoreIds.enrolledCourses[0]._id}`,
    );
  });

  test('handles error when course has no ID property', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API response with course missing any ID property
    const userWithInvalidCourse = {
      ...mockUserData,
      enrolledCourses: [
        {
          // No id, courseId, or _id property
          title: 'Invalid Course',
          description: 'This course has no ID property',
          instructor: 'Unknown',
        },
      ],
    };

    axios.get.mockResolvedValueOnce({ data: userWithInvalidCourse });

    render(<UserDashboard />);

    // Wait for course to be displayed
    await waitFor(() => {
      expect(screen.getByText('Invalid Course')).toBeInTheDocument();
    });

    // Click the Continue Learning button
    const continueButton = screen.getByText('Continue Learning');
    userEvent.click(continueButton);

    // Check if error is set correctly (component will display error message)
    await waitFor(() => {
      expect(
        screen.getByText('Could not find course ID. Please try again later.'),
      ).toBeInTheDocument();
    });

    // Verify navigate was NOT called
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  test('handles fullName property if available instead of email', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token');

    // Mock API response with fullName property
    const userWithFullName = {
      ...mockUserData,
      fullName: 'John Doe User',
    };

    axios.get.mockResolvedValueOnce({ data: userWithFullName });

    render(<UserDashboard />);

    // Check if fullName is displayed instead of email
    await waitFor(() => {
      expect(
        screen.getByText(`Welcome, ${userWithFullName.fullName}`),
      ).toBeInTheDocument();
    });
  });
});
