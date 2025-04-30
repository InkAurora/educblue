import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseContent from './CourseContent';
import axiosInstance from '../utils/axiosConfig';

// Mock axios
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

// Mock react-router hooks - set default values
const mockUseParams = jest.fn().mockReturnValue({ id: '123', contentId: '1' });
const mockNavigate = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: () => mockUseParams(),
  useNavigate: () => mockNavigate,
  Link: ({ to, children, ...props }) => (
    <a href={to} {...props} data-testid={props['data-testid']}>
      {children}
    </a>
  ),
}));

// Mock ReactMarkdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content),
}));

// Mock CourseSidebar component
jest.mock('./CourseSidebar', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ course, progress, courseId }) => (
    <div data-testid='course-sidebar-mock'>
      <p>Course: {course?.title}</p>
      <p>Course ID: {courseId}</p>
      <p>Progress Items: {progress?.length || 0}</p>
    </div>
  )),
}));

// Sample test data
const mockCourse = {
  _id: '123',
  title: 'Advanced React Development',
  instructor: 'Jane Smith',
  content: [
    {
      id: '1',
      title: 'Introduction to React',
      type: 'video',
      videoUrl: 'https://example.com/videos/intro.mp4',
    },
    {
      id: '2',
      title: 'Component Basics',
      type: 'markdown',
      content:
        '# Components\n\nComponents are the building blocks of React apps.',
    },
    {
      id: '3',
      title: 'React Quiz',
      type: 'quiz',
      content: 'What is the virtual DOM and how does it work?',
    },
  ],
};

const mockProgress = [
  { contentId: '1', completed: true },
  { contentId: '2', completed: false },
];

const mockEnrolledUser = {
  _id: 'user123',
  fullName: 'Student User',
  enrolledCourses: [{ _id: '123' }],
};

const mockInstructorUser = {
  _id: 'user456',
  fullName: 'Jane Smith',
  enrolledCourses: [],
};

const mockNonEnrolledUser = {
  _id: 'user789',
  fullName: 'Non Enrolled User',
  enrolledCourses: [],
};

describe('CourseContent Component', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '123', contentId: '1' });
    mockNavigate.mockClear();
  });

  // Test 1: Loading state
  test('displays loading indicator when fetching data', () => {
    // Mock axios to return pending promises
    axiosInstance.get.mockImplementation(() => new Promise(() => {}));

    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    render(<CourseContent data-testid='course-content' />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // Test 2: Test non-enrolled user redirection
  test('redirects non-enrolled users to course details', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockNonEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<CourseContent data-testid='course-content' />);

    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/courses/123');
    });
  });

  // Test 3: Test error handling
  test('displays error message when API call fails', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Mock user data success but course data failure
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.reject(new Error('Failed to fetch course'));
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<CourseContent data-testid='course-content' />);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load course content/i),
      ).toBeInTheDocument();
    });
  });

  // Test 4: Test video content rendering
  test('renders video content properly', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/123') {
        return Promise.resolve({ data: mockProgress });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Set params for video content
    mockUseParams.mockReturnValue({ id: '123', contentId: '1' });

    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('video-content')).toBeInTheDocument();
    });

    // Check video player
    expect(screen.getByTestId('video-player')).toBeInTheDocument();

    // Check navigation buttons - first item should have disabled previous button
    const prevButton = screen.getByTestId('prev-button');
    const nextButton = screen.getByTestId('next-button');

    // Check that previous button is disabled (using aria-disabled for MUI)
    expect(prevButton.getAttribute('aria-disabled')).toBe('true');
    expect(nextButton.getAttribute('aria-disabled')).not.toBe('true');
    expect(nextButton).toHaveAttribute('href', '/courses/123/content/2');
  });

  // Test 5: Test markdown content rendering
  test('renders markdown content properly', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/123') {
        return Promise.resolve({ data: mockProgress });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Set params for markdown content
    mockUseParams.mockReturnValue({ id: '123', contentId: '2' });

    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    });

    // Check navigation buttons - middle item should have both buttons enabled
    const prevButton = screen.getByTestId('prev-button');
    const nextButton = screen.getByTestId('next-button');

    expect(prevButton.getAttribute('aria-disabled')).not.toBe('true');
    expect(nextButton.getAttribute('aria-disabled')).not.toBe('true');
    expect(prevButton).toHaveAttribute('href', '/courses/123/content/1');
    expect(nextButton).toHaveAttribute('href', '/courses/123/content/3');

    // Check mark as completed button
    expect(screen.getByTestId('complete-button')).toBeInTheDocument();
  });

  // Test 6: Test quiz content rendering
  test('renders quiz content properly', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/123') {
        return Promise.resolve({ data: mockProgress });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Set params for quiz content
    mockUseParams.mockReturnValue({ id: '123', contentId: '3' });

    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('quiz-content')).toBeInTheDocument();
    });

    // Check quiz content
    expect(
      screen.getByText('What is the virtual DOM and how does it work?'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('quiz-answer-field')).toBeInTheDocument();

    // Check navigation buttons - last item should have next button disabled
    const prevButton = screen.getByTestId('prev-button');
    const nextButton = screen.getByTestId('next-button');

    expect(prevButton.getAttribute('aria-disabled')).not.toBe('true');
    expect(nextButton.getAttribute('aria-disabled')).toBe('true');
    expect(prevButton).toHaveAttribute('href', '/courses/123/content/2');
  });

  // Test 7: Mark as Completed button functionality
  test('handles Mark as Completed button click correctly', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/123') {
        return Promise.resolve({ data: mockProgress });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock successful progress update
    axiosInstance.post.mockResolvedValueOnce({});

    // Set params for markdown content
    mockUseParams.mockReturnValue({ id: '123', contentId: '2' });

    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('complete-button')).toBeInTheDocument();
    });

    // Click the Mark as Completed button
    fireEvent.click(screen.getByTestId('complete-button'));

    // Check API call
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/progress/123/2', {
      completed: true,
    });

    // Wait for button to update
    await waitFor(() => {
      expect(screen.getByTestId('complete-button')).toHaveTextContent(
        /Completed/i,
      );
    });
  });

  // Test 8: Video completion on ended event
  test('marks video content as completed when video ends', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockEnrolledUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/123') {
        return Promise.resolve({ data: mockProgress });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock successful progress update
    axiosInstance.post.mockResolvedValueOnce({});

    // Set params for video content
    mockUseParams.mockReturnValue({ id: '123', contentId: '1' });

    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByTestId('video-player')).toBeInTheDocument();
    });

    // Simulate video ended event
    fireEvent.ended(screen.getByTestId('video-player'));

    // Check API call
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/progress/123/1', {
      completed: true,
    });
  });

  // Test 9: Test for unauthorized access redirect
  test('redirects to login page when token is missing', async () => {
    // No token set in localStorage

    render(<CourseContent data-testid='course-content' />);

    // Should redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: '/courses/123/content/1' },
      });
    });
  });

  // Test 10: Test sanitizeMarkdown helper function directly
  test('sanitizes markdown content correctly', () => {
    // Import the actual sanitizeMarkdown function for a direct test
    const { sanitizeMarkdown } = require('./CourseContent');

    // Reset mock for this test
    require('dompurify').sanitize.mockClear();

    // Call the sanitize function directly
    sanitizeMarkdown('# Components\n\n<script>alert("XSS")</script>');

    // Check that DOMPurify.sanitize was called with the correct content
    expect(require('dompurify').sanitize).toHaveBeenCalledWith(
      '# Components\n\n<script>alert("XSS")</script>',
    );

    // Test with null/undefined input
    expect(sanitizeMarkdown(null)).toBe('');
    expect(sanitizeMarkdown(undefined)).toBe('');
  });

  // Test 11: Test for instructor access
  test('allows instructor access to content', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'fake-token');

    // Set up API responses for instructor user
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockInstructorUser });
      }
      if (url === '/api/courses/123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/123') {
        return Promise.resolve({ data: mockProgress });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<CourseContent data-testid='course-content' />);

    // Wait for content to load (instructor should be allowed to view)
    await waitFor(() => {
      expect(screen.getByTestId('content-title')).toBeInTheDocument();
    });

    // Should see the title
    expect(screen.getByTestId('content-title')).toHaveTextContent(
      'Introduction to React',
    );
  });

  // Test 12: Test authentication error handling
  test('redirects to login when authentication fails', async () => {
    // Mock localStorage token
    localStorage.setItem('token', 'invalid-token');

    // Mock 401 response for user data
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.reject({ response: { status: 401 } });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<CourseContent data-testid='course-content' />);

    // Should redirect to login
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: '/courses/123/content/1' },
      });
    });

    // Should clear tokens
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
