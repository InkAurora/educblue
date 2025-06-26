import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jwtDecode } from 'jwt-decode';
import InstructorAnalytics from './InstructorAnalytics';
import axiosInstance from '../../utils/axiosConfig';

// Mock dependencies
jest.mock('../../utils/axiosConfig', () => ({
  get: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

// Use manual mock for react-router-dom
jest.mock('react-router-dom');

// Import the mock after mocking
const { mockNavigate } = require('react-router-dom');

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  BarChart: ({ children }) => <div data-testid='bar-chart'>{children}</div>,
  Bar: () => <div data-testid='bar' />,
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='cartesian-grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  Legend: () => <div data-testid='legend' />,
}));

jest.mock('../../components/CourseSidebar', () => ({
  __esModule: true,
  default: ({ courseId }) => (
    <div data-testid='course-sidebar'>Course Sidebar {courseId}</div>
  ),
}));

// Sample data for tests
const mockCourseData = {
  _id: '123',
  title: 'Test Course',
  instructor: { _id: 'instructor-123', fullName: 'John Doe' },
  content: [
    { _id: '1', title: 'Lesson 1', type: 'video' },
    { _id: '2', title: 'Quiz 1', type: 'quiz' },
  ],
};

const mockAnalyticsData = {
  completionRate: 75,
  enrolledCount: 100,
  activeCount: 80,
  quizStats: [
    {
      title: 'Quiz 1',
      averageScore: 85,
      highestScore: 100,
      lowestScore: 65,
      submissionCount: 75,
    },
    {
      title: 'Quiz 2',
      averageScore: 78,
      highestScore: 95,
      lowestScore: 55,
      submissionCount: 68,
    },
  ],
};

const mockUserData = {
  _id: 'instructor-123',
  fullName: 'John Doe', // Same as course instructor for authorized access
  role: 'instructor',
};

const mockUnauthorizedUserData = {
  _id: 'student-456', // Different ID from course instructor
  fullName: 'Jane Smith', // Different from course instructor
  role: 'student',
};

describe('InstructorAnalytics Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    mockNavigate.mockClear();
  });

  const renderWithRouter = (ui) => render(ui);

  test('should show loading state while fetching data', async () => {
    // Setup axios mock to delay response
    axiosInstance.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ data: mockCourseData });
          }, 100);
        }),
    );

    // Setup jwt-decode mock
    jwtDecode.mockReturnValue(mockUserData);

    // Render component
    renderWithRouter(<InstructorAnalytics />);

    // Check for loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('should render analytics dashboard with correct data', async () => {
    // Setup axios mock for successful responses
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('analytics')) {
        return Promise.resolve({ data: mockAnalyticsData });
      }
      return Promise.resolve({ data: mockCourseData });
    });

    // Setup jwt-decode mock
    jwtDecode.mockReturnValue(mockUserData);

    // Render component
    renderWithRouter(<InstructorAnalytics />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for course title (use more specific selector)
    const headingElement = screen.getByRole('heading', { name: 'Test Course' });
    expect(headingElement).toBeInTheDocument();

    // Check for completion rate card
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    // Check for charts
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();

    // Check for quiz stats list
    expect(screen.getByText('Quiz Statistics')).toBeInTheDocument();
    expect(screen.getByText('Quiz 1')).toBeInTheDocument();
    expect(screen.getByText('Quiz 2')).toBeInTheDocument();
    expect(screen.getByText('Average Score: 85%')).toBeInTheDocument();
    expect(screen.getByText('Average Score: 78%')).toBeInTheDocument();
  });

  test('should show error for unauthorized users', async () => {
    // Setup axios mock for successful course data but unauthorized user
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('analytics')) {
        return Promise.resolve({ data: mockAnalyticsData });
      }
      return Promise.resolve({ data: mockCourseData });
    });

    // Setup jwt-decode mock with unauthorized user (different fullName)
    jwtDecode.mockReturnValue(mockUnauthorizedUserData);

    // Render component
    renderWithRouter(<InstructorAnalytics />);

    // Wait for error message to appear
    await waitFor(
      () => {
        expect(
          screen.getByText(
            'You are not authorized to view analytics for this course',
          ),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  test('should redirect to login if no token is present', async () => {
    // Remove token
    localStorage.removeItem('token');

    // Render component
    renderWithRouter(<InstructorAnalytics />);

    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('should show error alert when API call fails', async () => {
    // Setup axios mock for failed response
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('analytics')) {
        return Promise.reject(new Error('Failed to fetch analytics'));
      }
      return Promise.resolve({ data: mockCourseData });
    });

    // Setup jwt-decode mock
    jwtDecode.mockReturnValue(mockUserData);

    // Render component
    renderWithRouter(<InstructorAnalytics />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch analytics data'),
      ).toBeInTheDocument();
    });
  });

  test('should handle case with no quiz data', async () => {
    // Setup axios mock with no quiz stats
    const emptyAnalyticsData = {
      ...mockAnalyticsData,
      quizStats: [],
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('analytics')) {
        return Promise.resolve({ data: emptyAnalyticsData });
      }
      return Promise.resolve({ data: mockCourseData });
    });

    // Setup jwt-decode mock
    jwtDecode.mockReturnValue(mockUserData);

    // Render component
    renderWithRouter(<InstructorAnalytics />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check for no quiz data message
    expect(
      screen.getAllByText('No quiz data available')[0],
    ).toBeInTheDocument();
  });
});
