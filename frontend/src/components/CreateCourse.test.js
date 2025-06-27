import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCourse from './CreateCourse';

import axiosInstance from '../utils/axiosConfig';

// Mock SimpleMDE editor
jest.mock(
  'react-simplemde-editor',
  () =>
    function MockSimpleMDE({ onChange, value }) {
      return (
        <textarea
          data-testid='mock-simplemde'
          onChange={(e) => onChange(e.target.value)}
          value={value}
        />
      );
    },
);

// Mock useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedNavigate,
}));

// Mock axios
jest.mock('axios');

// Mock axiosInstance
jest.mock('../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CreateCourse Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem.mockReset();

    // Mock the user API call by default to return instructor user
    axiosInstance.get.mockResolvedValue({
      data: { id: 1, role: 'instructor', name: 'Test User' },
    });
  });

  test('renders create course form correctly', async () => {
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/course title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText(/Detailed Description/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-simplemde')).toBeInTheDocument();
  });

  test('handles input changes', async () => {
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Test regular inputs
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Test markdown editor
    fireEvent.change(screen.getByTestId('mock-simplemde'), {
      target: {
        value: '# React Course\n\nThis is a **markdown** description.',
      },
    });

    // Check if inputs have the correct values
    expect(screen.getByLabelText(/course title/i)).toHaveValue('React Basics');
    expect(screen.getByLabelText(/short description/i)).toHaveValue(
      'Learn React fundamentals',
    );
    expect(screen.getByLabelText(/price/i)).toHaveValue(49.99);
    expect(screen.getByLabelText(/duration/i)).toHaveValue(8);
    expect(screen.getByTestId('mock-simplemde')).toHaveValue(
      '# React Course\n\nThis is a **markdown** description.',
    );
  });

  test('validates form fields', async () => {
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Submit form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(
        screen.getByText('Please fix the highlighted fields'),
      ).toBeInTheDocument();
    });
  });

  test('shows error when user is not logged in', async () => {
    // Set up mocks for when user is not logged in
    axiosInstance.get.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
      },
    });

    axiosInstance.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { message: 'You need to be logged in to create a course' },
      },
    });

    // Render component
    render(<CreateCourse />);

    // Wait for the error to be shown
    await waitFor(() => {
      expect(
        screen.getByText('You must be logged in to create a course'),
      ).toBeInTheDocument();
    });
  });

  test('submits form successfully and navigates to new course', async () => {
    // Mock successful API response
    axiosInstance.post.mockResolvedValueOnce({
      data: { courseId: 'new-course-id' }, // Changed from 'id' to 'courseId' to match component logic
    });

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Wait for the form submission to complete
    await waitFor(() => {
      // Check that API was called correctly
      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/api/courses',
        expect.objectContaining({
          title: 'React Basics',
          description: 'Learn React fundamentals',
          price: '49.99',
          duration: '8',
        }),
      );

      // Check that user was navigated to the course content editor
      expect(mockedNavigate).toHaveBeenCalledWith(
        '/create-course/new-course-id/content',
      );
    });
  });

  test('handles course ID nested in course object', async () => {
    // Mock API response with courseId nested in course object
    axiosInstance.post.mockResolvedValueOnce({
      data: {
        course: { id: 'nested-course-id' },
      },
    });

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check that navigation happened with the nested course ID
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith(
        '/create-course/nested-course-id/content',
      );
    });
  });

  test('handles API errors - access denied for non-instructors', async () => {
    // Mock access denied error
    axiosInstance.post.mockRejectedValueOnce({
      response: {
        status: 403,
        data: {
          message: 'Access denied. Only instructors can create courses.',
        },
      },
    });

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText('Access denied. Only instructors can create courses.'),
      ).toBeInTheDocument();
    });
  });

  test('handles API errors with custom message', async () => {
    // Mock error with custom message
    axiosInstance.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Course with this title already exists' },
      },
    });

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText('Course with this title already exists'),
      ).toBeInTheDocument();
    });
  });

  test('handles generic API errors', async () => {
    // Mock generic server error
    axiosInstance.post.mockRejectedValueOnce({
      message: 'Network Error',
    });

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText('Failed to create course. Please try again later.'),
      ).toBeInTheDocument();
    });
  });

  test('disables submit button during form submission', async () => {
    // Create a promise that won't resolve immediately
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axiosInstance.post.mockReturnValueOnce(pendingPromise);

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    const button = screen.getByRole('button', { name: /next/i });

    // Submit the form
    fireEvent.click(button);

    // Check if button is disabled and shows loading spinner
    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    // Resolve the promise to complete the test
    resolvePromise({ data: { id: 'new-course-id' } });
  });

  test('handles validation errors for specific fields', async () => {
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in some fields but leave others blank
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    // Intentionally leave description blank

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check for specific field error
    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    // Now fill in the missing field
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });

    // Error should be cleared when field is updated
    expect(
      screen.queryByText('Description is required'),
    ).not.toBeInTheDocument();
  });

  test('handles course ID not returned in API response', async () => {
    // Mock API response with no course ID
    axiosInstance.post.mockResolvedValueOnce({
      data: {}, // No course ID in response
    });

    // Render and fill the form
    render(<CreateCourse />);

    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Create New Course')).toBeInTheDocument();
    });

    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Check for error message about missing course ID
    await waitFor(() => {
      expect(
        screen.getByText(
          'Created course but received invalid course ID from server',
        ),
      ).toBeInTheDocument();
    });
  });
});
