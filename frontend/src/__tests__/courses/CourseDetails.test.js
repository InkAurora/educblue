import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import CourseDetails from '../../components/CourseDetails';
import axiosInstance from '../../utils/axiosConfig';

// Mock react-markdown
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid='markdown-content'>{children}</div>
  ),
}));

// Mock DOMPurify
jest.mock('dompurify', () => ({
  __esModule: true,
  default: {
    sanitize: jest.fn((content) => content),
  },
}));

// Mock axios instance
jest.mock('../../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (function localStorageMockFunction() {
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

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'test-course-id' }),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/courses/test-course-id' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

describe('CourseDetails Component', () => {
  const mockCourse = {
    _id: 'test-course-id',
    title: 'Test Course',
    description: 'Course description',
    markdownDescription: '# Test Course\n\nDetailed description',
    instructor: 'Instructor Name',
    price: 99.99,
    duration: '6 weeks',
    sections: [
      {
        _id: 'section1',
        title: 'Introduction',
        description: 'Getting started',
        content: [
          { _id: 'content1', title: 'Welcome Video', type: 'video' },
          { _id: 'content2', title: 'Course Overview', type: 'markdown' },
        ],
      },
      {
        _id: 'section2',
        title: 'Advanced Topics',
        description: 'Deep dive into advanced concepts',
        content: [{ _id: 'content3', title: 'Lesson 1', type: 'video' }],
      },
    ],
  };

  const mockProgressResponse = {
    progressRecords: [{ contentId: 'content1', completed: true }],
    progressPercentage: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token-123');
  });

  test('admin can access course as instructor even when not the actual instructor', async () => {
    // Mock user data as admin
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({
          data: {
            _id: 'admin-id',
            fullName: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            enrolledCourses: [],
          },
        });
      }
      if (url === '/api/courses/test-course-id') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/test-course-id') {
        return Promise.resolve({ data: mockProgressResponse });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseDetails data-testid='course-details' />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });

    // Verify the admin can see sections
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Advanced Topics')).toBeInTheDocument();

    // Course content should be accessible despite not being enrolled
    expect(
      screen.queryByText('Please enroll to access course content'),
    ).not.toBeInTheDocument();
  });

  test('instructor can only access their own courses as instructor', async () => {
    // Mock user data as instructor (but not of this course)
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({
          data: {
            _id: 'instructor-id',
            fullName: 'Different Instructor',
            email: 'other@example.com',
            role: 'instructor',
            enrolledCourses: [],
          },
        });
      }
      if (url === '/api/courses/test-course-id') {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseDetails data-testid='course-details' />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });

    // Verify the different instructor cannot see instructor content
    // and sees the enrollment prompt
    await waitFor(() => {
      expect(
        screen.getByText('Please enroll to access course content'),
      ).toBeInTheDocument();
    });
  });

  test('student must enroll to access course content', async () => {
    // Mock user data as student
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({
          data: {
            _id: 'student-id',
            fullName: 'Student User',
            email: 'student@example.com',
            role: 'student',
            enrolledCourses: [],
          },
        });
      }
      if (url === '/api/courses/test-course-id') {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseDetails data-testid='course-details' />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });

    // Verify student sees enrollment prompt
    expect(
      screen.getByText('Please enroll to access course content'),
    ).toBeInTheDocument();
  });

  test('enrolled student can access course content', async () => {
    // Mock user data as enrolled student
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({
          data: {
            _id: 'student-id',
            fullName: 'Student User',
            email: 'student@example.com',
            role: 'student',
            enrolledCourses: ['test-course-id'],
          },
        });
      }
      if (url === '/api/courses/test-course-id') {
        return Promise.resolve({ data: mockCourse });
      }
      if (url === '/api/progress/test-course-id') {
        return Promise.resolve({ data: mockProgressResponse });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<CourseDetails data-testid='course-details' />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });

    // Verify student can access sections
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Advanced Topics')).toBeInTheDocument();

    // Enrollment prompt should not be shown
    expect(
      screen.queryByText('Please enroll to access course content'),
    ).not.toBeInTheDocument();
  });
});
