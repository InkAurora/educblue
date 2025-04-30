import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CourseContent from './CourseContent'; // Importing directly from the same directory
import useCourseProgress from '../../hooks/useCourseProgress';
import axiosInstance from '../../utils/axiosConfig';

// Mock the dependencies
jest.mock('../../hooks/useCourseProgress');
jest.mock('../CourseSidebar', () => {
  return function MockCourseSidebar({ course, progress, courseId }) {
    return <div data-testid='course-sidebar'>Course Sidebar Mock</div>;
  };
});
jest.mock('./content/ContentNavigation', () => {
  return function MockContentNavigation({
    courseId,
    title,
    previousContentId,
    nextContentId,
  }) {
    return (
      <div data-testid='content-navigation'>
        Content Navigation Mock
        {previousContentId && (
          <span data-testid='prev-content-id'>{previousContentId}</span>
        )}
        {nextContentId && (
          <span data-testid='next-content-id'>{nextContentId}</span>
        )}
      </div>
    );
  };
});
jest.mock('./content/ContentRenderer', () => {
  return function MockContentRenderer({
    contentItem,
    isCompleted,
    completing,
    onCompleted,
  }) {
    return <div data-testid='content-renderer'>Content Renderer Mock</div>;
  };
});
jest.mock('../../utils/axiosConfig', () => ({
  get: jest.fn(),
}));

// Mock useNavigate and other react-router-dom functions
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'course123', contentId: 'content456' }),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  MemoryRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ path, element }) => element,
}));

describe('CourseContent', () => {
  const mockCourseId = 'course123';
  const mockContentId = 'content456';
  const mockCourseData = {
    _id: mockCourseId,
    title: 'Test Course',
    instructor: 'John Doe',
    content: [
      { id: 'content123', title: 'Introduction', type: 'video' },
      { id: mockContentId, title: 'Chapter 1', type: 'markdown' },
      { id: 'content789', title: 'Quiz 1', type: 'quiz' },
    ],
  };
  const mockUserData = {
    fullName: 'Jane Smith',
    enrolledCourses: [mockCourseId],
  };
  const mockProgressData = {
    progress: [{ contentId: 'content123', completed: true }],
    isContentCompleted: jest.fn().mockReturnValue(false),
    completing: false,
    markContentCompleted: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');

    // Mock the user data fetch
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUserData });
      } else if (url === `/api/courses/${mockCourseId}`) {
        return Promise.resolve({ data: mockCourseData });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    // Mock the custom hook
    useCourseProgress.mockReturnValue(mockProgressData);

    // Set up useParams mock for each test
    jest
      .spyOn(require('react-router-dom'), 'useParams')
      .mockImplementation(() => ({
        id: mockCourseId,
        contentId: mockContentId,
      }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders loading state initially', () => {
    render(<CourseContent data-testid='course-content' />);

    // Initially should show loading spinner
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders content when data is loaded', async () => {
    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load
    await waitFor(() => {
      expect(
        screen.getAllByTestId('course-sidebar').length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('content-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });

    // Verify API calls
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/me');
    expect(axiosInstance.get).toHaveBeenCalledWith(
      `/api/courses/${mockCourseId}`,
    );
    expect(useCourseProgress).toHaveBeenCalledWith(mockCourseId, mockContentId);
  });

  it('shows error message when course fetching fails', async () => {
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUserData });
      } else if (url === `/api/courses/${mockCourseId}`) {
        return Promise.reject(new Error('Failed to fetch course'));
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load course content'),
      ).toBeInTheDocument();
    });
  });

  it('redirects to login when no token is present', async () => {
    // Clear the token
    localStorage.removeItem('token');

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: `/courses/${mockCourseId}/content/${mockContentId}` },
      });
    });
  });

  it('redirects to login when token is unauthorized', async () => {
    // Mock unauthorized response
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.reject({ response: { status: 401 } });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: `/courses/${mockCourseId}/content/${mockContentId}` },
      });
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  it('redirects to course details when user is not enrolled', async () => {
    // User not enrolled
    const nonEnrolledUser = {
      ...mockUserData,
      enrolledCourses: ['different-course-id'],
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: nonEnrolledUser });
      } else if (url === `/api/courses/${mockCourseId}`) {
        return Promise.resolve({ data: mockCourseData });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/courses/${mockCourseId}`);
    });
  });

  it('shows error when content ID is not found', async () => {
    // Request with an invalid content ID
    jest
      .spyOn(require('react-router-dom'), 'useParams')
      .mockImplementation(() => ({
        id: mockCourseId,
        contentId: 'non-existent-content',
      }));

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(screen.getByText('Content not found')).toBeInTheDocument();
    });
  });

  it('allows instructor access even if not enrolled', async () => {
    // User is instructor but not enrolled
    const instructorUser = {
      fullName: 'John Doe', // Same as course instructor
      enrolledCourses: [],
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: instructorUser });
      } else if (url === `/api/courses/${mockCourseId}`) {
        return Promise.resolve({ data: mockCourseData });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });
  });

  it('correctly identifies previous content', async () => {
    // We're already testing middle content in the default setup
    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(screen.getByTestId('prev-content-id')).toBeInTheDocument();
      expect(screen.getByTestId('prev-content-id').textContent).toBe(
        'content123',
      );
    });
  });

  it('correctly identifies next content', async () => {
    // We're already testing middle content in the default setup
    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(screen.getByTestId('next-content-id')).toBeInTheDocument();
      expect(screen.getByTestId('next-content-id').textContent).toBe(
        'content789',
      );
    });
  });

  it('handles first content item having no previous content', async () => {
    // Use first content item
    jest
      .spyOn(require('react-router-dom'), 'useParams')
      .mockImplementation(() => ({
        id: mockCourseId,
        contentId: 'content123', // first content
      }));

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
      expect(screen.queryByTestId('prev-content-id')).toBeNull();
      expect(screen.getByTestId('next-content-id')).toBeInTheDocument();
    });
  });

  it('handles last content item having no next content', async () => {
    // Use last content item
    jest
      .spyOn(require('react-router-dom'), 'useParams')
      .mockImplementation(() => ({
        id: mockCourseId,
        contentId: 'content789', // last content
      }));

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
      expect(screen.getByTestId('prev-content-id')).toBeInTheDocument();
      expect(screen.queryByTestId('next-content-id')).toBeNull();
    });
  });
});
