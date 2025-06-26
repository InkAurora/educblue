import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import CreateCourse from '../../components/CreateCourse';
import axiosInstance from '../../utils/axiosConfig';

// Mock react-simplemde-editor
jest.mock('react-simplemde-editor', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid='markdown-editor'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock axios instance
jest.mock('../../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedUsedNavigate,
}));

describe('CreateCourse Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', async () => {
    // Mock the API call for user data - delay to show loading state
    axiosInstance.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                fullName: 'Instructor User',
                email: 'instructor@example.com',
                role: 'instructor',
              },
            });
          }, 100);
        }),
    );

    render(<CreateCourse />);

    // Check loading spinner is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('shows error message for non-instructor/non-admin users', async () => {
    // Mock user data as student
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      },
    });

    render(<CreateCourse />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check error message is shown
    expect(
      screen.getByText('Only instructors and admins can create courses'),
    ).toBeInTheDocument();

    // Check return to dashboard button exists
    const returnButton = screen.getByText('Return to Dashboard');
    expect(returnButton).toBeInTheDocument();

    // Click return button
    fireEvent.click(returnButton);
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('allows instructor to create course', async () => {
    // Mock user data as instructor
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor',
      },
    });

    render(<CreateCourse />);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Check form fields are rendered
    expect(screen.getByLabelText(/Course Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Short Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
  });

  test('allows admin to create course', async () => {
    // Mock user data as admin
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    render(<CreateCourse />);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Check form fields are rendered
    expect(screen.getByLabelText(/Course Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Short Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByTestId('markdown-editor')).toBeInTheDocument();
  });

  test('validates form inputs correctly', async () => {
    // Mock user data as admin
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    render(<CreateCourse />);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Submit form without filling required fields
    const submitButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(submitButton);

    // Check validation errors are shown
    await waitFor(() => {
      expect(
        screen.getByText('Please fix the highlighted fields'),
      ).toBeInTheDocument();
    });
  });

  test('submits form successfully as admin', async () => {
    // Mock user data as admin
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    // Mock successful course creation
    axiosInstance.post.mockResolvedValueOnce({
      data: {
        courseId: 'new-course-123',
      },
    });

    render(<CreateCourse />);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Course Title/i), {
      target: { value: 'Test Course' },
    });

    fireEvent.change(screen.getByLabelText(/Short Description/i), {
      target: { value: 'Course description' },
    });

    fireEvent.change(screen.getByLabelText(/Price/i), {
      target: { value: '99.99' },
    });

    fireEvent.change(screen.getByLabelText(/Duration/i), {
      target: { value: '6' },
    });

    fireEvent.change(screen.getByTestId('markdown-editor'), {
      target: {
        value: '# Detailed Course Description\n\nThis is a test course.',
      },
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(submitButton);

    // Verify API call was made with correct data
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/courses',
        expect.objectContaining({
          title: 'Test Course',
          description: 'Course description',
          price: '99.99',
          duration: '6',
          markdownDescription:
            '# Detailed Course Description\n\nThis is a test course.',
        }),
      );
    });

    // Verify navigation to course content editor
    expect(mockedUsedNavigate).toHaveBeenCalledWith(
      '/create-course/new-course-123/content',
    );
  });
});
