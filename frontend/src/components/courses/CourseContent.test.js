import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import CourseContent from './CourseContent';
import axiosInstance from '../../utils/axiosConfig';
import useCourseProgress from '../../hooks/useCourseProgress';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Properly mock axios with get and post methods
jest.mock('../../utils/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../../hooks/useCourseProgress');
jest.mock('../CourseSidebar', () => ({ course, progress, courseId }) => (
  <div data-testid='course-sidebar'>Course Sidebar</div>
));
jest.mock('./content/ContentNavigation', () => ({ courseId, title }) => (
  <div data-testid='content-navigation'>{title}</div>
));
jest.mock(
  './content/ContentRenderer',
  () =>
    ({
      contentItem,
      isCompleted,
      completing,
      onCompleted,
      error,
      progress,
      courseId,
    }) => (
      <div data-testid='content-renderer'>
        <div data-testid='renderer-content-type'>{contentItem.type}</div>
        <div data-testid='renderer-content'>{contentItem.content}</div>
        <div data-testid='renderer-progress-length'>
          {progress ? progress.length : 0}
        </div>
        <div data-testid='renderer-course-id'>{courseId || 'no-course-id'}</div>
      </div>
    ),
);

describe('CourseContent', () => {
  const mockUser = {
    _id: 'user1',
    fullName: 'Test User',
    email: 'test@example.com',
    enrolledCourses: ['course123'],
  };

  const mockCourse = {
    _id: 'course123',
    title: 'Test Course',
    instructor: 'Test Instructor',
    description: 'Test Description',
    content: [
      {
        _id: 'quiz1',
        title: 'Quiz 1',
        type: 'quiz',
        content: 'What is React?',
      },
      {
        _id: 'content2',
        title: 'Lesson 1',
        type: 'markdown',
        content: '# Lesson 1',
      },
    ],
  };

  const mockProgress = [
    { contentId: 'quiz1', completed: false, answer: 'A JavaScript library' },
    { contentId: 'content2', completed: true },
  ];

  const mockMarkContentCompleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock react-router hooks
    useParams.mockReturnValue({ id: 'course123', contentId: 'quiz1' });
    useNavigate.mockReturnValue(jest.fn());

    // Mock localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue('fake-token');

    // Mock axios responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Not Found'));
    });

    // Mock useCourseProgress hook
    useCourseProgress.mockReturnValue({
      progress: mockProgress,
      completing: false,
      error: null,
      markContentCompleted: mockMarkContentCompleted,
      isContentCompleted: () => false,
    });
  });

  test('passes progress data and courseId to ContentRenderer for quiz content', async () => {
    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });

    // Verify that the required props are passed to ContentRenderer
    expect(screen.getByTestId('renderer-content-type')).toHaveTextContent(
      'quiz',
    );
    expect(screen.getByTestId('renderer-content')).toHaveTextContent(
      'What is React?',
    );
    expect(screen.getByTestId('renderer-progress-length')).toHaveTextContent(
      '2',
    );
    expect(screen.getByTestId('renderer-course-id')).toHaveTextContent(
      'course123',
    );
  });

  test('redirects non-enrolled users away from quiz content', async () => {
    // Setup user not enrolled in course
    const nonEnrolledUser = { ...mockUser, enrolledCourses: [] };
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: nonEnrolledUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Not Found'));
    });

    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<CourseContent />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/courses/course123');
    });
  });

  test('displays alert if not enrolled in the course', async () => {
    // Setup user not enrolled in course but instructor didn't redirect yet
    const nonEnrolledUser = { ...mockUser, enrolledCourses: [] };
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: nonEnrolledUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Not Found'));
    });

    // Mock the redirect without actually redirecting
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(
      <BrowserRouter>
        <CourseContent />
      </BrowserRouter>,
    );

    // Use a more flexible approach - look for the text rather than waiting for loading to finish
    await waitFor(
      () => {
        expect(
          screen.queryByText(
            /You need to be enrolled in this course to view this content/i,
          ),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText(/Go to Course Details/i)).toBeInTheDocument();
  });

  test('loads content correctly for enrolled users', async () => {
    render(<CourseContent />);

    // Wait more explicitly for the loading to finish
    await waitFor(
      () => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Now add a small delay to ensure all components have rendered
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('course-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('content-navigation')).toBeInTheDocument();
  });
});
