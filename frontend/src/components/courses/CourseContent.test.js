import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useParams, useNavigate } from 'react-router-dom';
import CourseContent from './CourseContent';
import axiosInstance from '../../utils/axiosConfig';
import useCourseProgress from '../../hooks/useCourseProgress';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Properly mock axios with get and post methods
jest.mock('../../utils/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('../../hooks/useCourseProgress');
jest.mock(
  './content/ContentNavigation',
  () =>
    function MockContentNavigation({ title }) {
      return <div data-testid='content-navigation'>{title}</div>;
    },
);
jest.mock(
  './content/ContentRenderer',
  () =>
    function MockContentRenderer({
      contentItem,
      progress,
      courseId,
      sectionId,
    }) {
      return (
        <div data-testid='content-renderer'>
          <div data-testid='renderer-content-type'>{contentItem.type}</div>
          <div data-testid='renderer-content'>{contentItem.content}</div>
          <div data-testid='renderer-progress-length'>
            {progress ? progress.length : 0}
          </div>
          <div data-testid='renderer-course-id'>
            {courseId || 'no-course-id'}
          </div>
          <div data-testid='renderer-section-id'>
            {sectionId || 'no-section-id'}
          </div>
        </div>
      );
    },
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

  const mockSections = [
    {
      _id: 'section1',
      id: 'section1',
      title: 'Section 1',
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
    },
  ];

  const mockContentItem = {
    _id: 'quiz1',
    title: 'Quiz 1',
    type: 'quiz',
    content: 'What is React?',
  };

  const mockProgress = [
    { contentId: 'quiz1', completed: false, answer: 'A JavaScript library' },
    { contentId: 'content2', completed: true },
  ];

  const mockMarkContentCompleted = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock react-router hooks
    useParams.mockReturnValue({
      id: 'course123',
      sectionId: 'section1',
      contentId: 'quiz1',
    });
    useNavigate.mockReturnValue(jest.fn());

    // Mock localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue('fake-token');
    Storage.prototype.removeItem = jest.fn();

    // Mock axios responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: mockSections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
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
      refreshProgress: jest.fn(),
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
    expect(screen.getByTestId('renderer-section-id')).toHaveTextContent(
      'section1',
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
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: mockSections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    // The component should show the unauthorized warning instead of redirecting
    await waitFor(() => {
      expect(
        screen.getByText(
          /You need to be enrolled in this course to view this content/i,
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/Go to Course Details/i)).toBeInTheDocument();
  });

  test('displays alert if not enrolled in the course', async () => {
    // Setup user not enrolled in course
    const nonEnrolledUser = { ...mockUser, enrolledCourses: [] };
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: nonEnrolledUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: mockSections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(
      () => {
        expect(
          screen.getByText(
            /You need to be enrolled in this course to view this content/i,
          ),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.getByText(/Go to Course Details/i)).toBeInTheDocument();
  });

  test('loads content correctly for enrolled users', async () => {
    render(<CourseContent />);

    // Wait for loading to finish
    await waitFor(
      () => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    expect(screen.getByTestId('content-navigation')).toBeInTheDocument();
  });

  test('redirects to login when no token is present', async () => {
    // Mock no token in localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue(null);
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    render(<CourseContent />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: {
          from: '/courses/course123/sections/section1/content/quiz1',
        },
      });
    });
  });

  test('redirects to login when user token is invalid (401 error)', async () => {
    const mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    // Mock 401 error from user endpoint
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        const error = new Error('Unauthorized');
        error.response = { status: 401 };
        return Promise.reject(error);
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: {
          from: '/courses/course123/sections/section1/content/quiz1',
        },
      });
    });

    // Verify token was removed
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
  });

  test('shows error message when course content fails to load', async () => {
    // Mock error when fetching course data
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.reject(new Error('Server Error'));
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load course content'),
      ).toBeInTheDocument();
    });
  });

  test('allows instructor to view content even if not enrolled', async () => {
    // Create instructor user (not enrolled but is instructor)
    const instructorUser = {
      ...mockUser,
      fullName: 'Test Instructor', // Same as course instructor
      enrolledCourses: [], // Not enrolled
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: instructorUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: mockSections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });

    // Should not show the enrollment warning
    expect(
      screen.queryByText(/You need to be enrolled in this course/i),
    ).not.toBeInTheDocument();
  });

  test('allows admin to view content even if not enrolled', async () => {
    // Create admin user (not enrolled but is admin)
    const adminUser = {
      ...mockUser,
      role: 'admin',
      enrolledCourses: [], // Not enrolled
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: adminUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: mockSections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });

    // Should not show the enrollment warning
    expect(
      screen.queryByText(/You need to be enrolled in this course/i),
    ).not.toBeInTheDocument();
  });

  test('handles course with instructor as object format', async () => {
    // Create course with instructor as object (new format)
    const courseWithInstructorObject = {
      ...mockCourse,
      instructor: {
        _id: 'user1',
        fullName: 'Test User',
      },
    };

    const instructorUser = { ...mockUser, enrolledCourses: [] }; // Not enrolled

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: instructorUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: courseWithInstructorObject });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: mockSections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });

    // Should not show the enrollment warning since user is instructor
    expect(
      screen.queryByText(/You need to be enrolled in this course/i),
    ).not.toBeInTheDocument();
  });

  test('handles section without content array by fetching section details', async () => {
    // Create section without content array
    const sectionsWithoutContent = [
      {
        _id: 'section1',
        id: 'section1',
        title: 'Section 1',
        // No content property
      },
    ];

    const mockSectionDetails = {
      content: [
        {
          _id: 'quiz1',
          title: 'Quiz 1',
          type: 'quiz',
          content: 'What is React?',
        },
      ],
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: sectionsWithoutContent });
      }
      if (url === '/api/courses/course123/sections/section1') {
        return Promise.resolve({ data: mockSectionDetails });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });
  });

  test('falls back to course content when section content is empty', async () => {
    // Create empty section
    const emptySections = [
      {
        _id: 'section1',
        id: 'section1',
        title: 'Section 1',
        content: [], // Empty content array
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: emptySections });
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });
  });

  test('handles error when fetching section details', async () => {
    // Create section without content array that will cause error on detail fetch
    const sectionsWithoutContent = [
      {
        _id: 'section1',
        id: 'section1',
        title: 'Section 1',
        // No content property
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: sectionsWithoutContent });
      }
      if (url === '/api/courses/course123/sections/section1') {
        return Promise.reject(new Error('Section not found'));
      }
      if (url === '/api/courses/course123/sections/section1/content/quiz1') {
        return Promise.resolve({ data: mockContentItem });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });
  });

  test('handles content with different ID formats in getValidContentId', async () => {
    // Create content with various ID formats to test the getValidContentId function
    const contentWithDifferentIds = [
      {
        id: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectID
        title: 'Quiz with MongoDB ID',
        type: 'quiz',
        content: 'What is React?',
      },
      {
        id: 'simple-id', // Simple string ID
        title: 'Quiz with Simple ID',
        type: 'quiz',
        content: 'What is Vue?',
      },
      {
        _id: 'underscore-id', // _id property
        title: 'Quiz with Underscore ID',
        type: 'quiz',
        content: 'What is Angular?',
      },
      {
        title: 'Quiz with Title Only', // Only title, no ID
        type: 'quiz',
        content: 'What is Svelte?',
      },
      {
        type: 'quiz', // No title or ID
        content: 'What is Next.js?',
      },
    ];

    const courseWithDifferentContent = {
      ...mockCourse,
      content: contentWithDifferentIds,
    };

    const sectionsWithDifferentContent = [
      {
        _id: 'section1',
        id: 'section1',
        title: 'Section 1',
        content: contentWithDifferentIds,
      },
    ];

    // Use the simple-id content item
    useParams.mockReturnValue({
      id: 'course123',
      sectionId: 'section1',
      contentId: 'simple-id',
    });

    const contentItemWithSimpleId = {
      id: 'simple-id',
      title: 'Quiz with Simple ID',
      type: 'quiz',
      content: 'What is Vue?',
    };

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockUser });
      }
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: courseWithDifferentContent });
      }
      if (url === '/api/courses/course123/sections') {
        return Promise.resolve({ data: sectionsWithDifferentContent });
      }
      if (
        url === '/api/courses/course123/sections/section1/content/simple-id'
      ) {
        return Promise.resolve({ data: contentItemWithSimpleId });
      }
      return Promise.reject(new Error('Not Found'));
    });

    render(<CourseContent />);

    await waitFor(() => {
      expect(screen.getByTestId('content-renderer')).toBeInTheDocument();
    });

    expect(screen.getByTestId('renderer-content')).toHaveTextContent(
      'What is Vue?',
    );
  });
});
