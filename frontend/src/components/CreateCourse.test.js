import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import CreateCourse from './CreateCourse';

// Mock SimpleMDE editor
jest.mock('react-simplemde-editor', () => {
  return function MockSimpleMDE(props) {
    return (
      <textarea
        data-testid='mock-simplemde'
        onChange={(e) => props.onChange(e.target.value)}
        value={props.value}
      />
    );
  };
});

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedUsedNavigate,
}));

// Mock axios
jest.mock('axios');

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
  });

  test('renders create course form correctly', () => {
    render(<CreateCourse />);

    // Check if all form elements are rendered
    expect(
      screen.getByRole('heading', { name: /create new course/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/course title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short description/i)).toBeInTheDocument();
    expect(screen.getByText(/detailed description/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-simplemde')).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instructor name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/duration/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create course/i }),
    ).toBeInTheDocument();
  });

  test('handles input changes', () => {
    render(<CreateCourse />);

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
    fireEvent.change(screen.getByLabelText(/instructor name/i), {
      target: { value: 'John Doe' },
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
    expect(screen.getByLabelText(/instructor name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/duration/i)).toHaveValue(8);
    expect(screen.getByTestId('mock-simplemde')).toHaveValue(
      '# React Course\n\nThis is a **markdown** description.',
    );
  });

  test('shows error when user is not logged in', async () => {
    // Mock localStorage to return null (no token)
    localStorage.getItem.mockReturnValue(null);

    render(<CreateCourse />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText('You need to be logged in to create a course'),
      ).toBeInTheDocument();
    });

    // Check that API was not called
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('submits form successfully and navigates to new course', async () => {
    // Mock localStorage to return a token
    localStorage.getItem.mockReturnValue('fake-token');

    // Mock successful API response
    const mockResponse = { data: { _id: 'new-course-id' } };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(<CreateCourse />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });
    fireEvent.change(screen.getByLabelText(/short description/i), {
      target: { value: 'Learn React fundamentals' },
    });
    fireEvent.change(screen.getByTestId('mock-simplemde'), {
      target: { value: 'Course content in markdown' },
    });
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: '49.99' },
    });
    fireEvent.change(screen.getByLabelText(/instructor name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByLabelText(/duration/i), {
      target: { value: '8' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    // Wait for the form submission to complete
    await waitFor(() => {
      // Check if API was called with the right data
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/courses',
        {
          title: 'React Basics',
          description: 'Learn React fundamentals',
          markdownDescription: 'Course content in markdown',
          price: 49.99,
          instructor: 'John Doe',
          duration: 8,
        },
        {
          headers: {
            Authorization: 'Bearer fake-token',
          },
        },
      );

      // Check if navigation occurred to the new course page
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/courses/new-course-id');
    });
  });

  test('handles API errors - access denied for non-instructors', async () => {
    // Mock localStorage to return a token
    localStorage.getItem.mockReturnValue('fake-token');

    // Mock API error - 403 forbidden
    axios.post.mockRejectedValueOnce({
      response: { status: 403 },
    });

    render(<CreateCourse />);

    // Fill form with minimal valid data
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText('Access denied. Only instructors can create courses.'),
      ).toBeInTheDocument();
    });
  });

  test('handles API errors with custom message', async () => {
    // Mock localStorage to return a token
    localStorage.getItem.mockReturnValue('fake-token');

    // Mock API error with custom message
    axios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Course with this title already exists' },
      },
    });

    render(<CreateCourse />);

    // Fill form with minimal valid data
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText('Course with this title already exists'),
      ).toBeInTheDocument();
    });
  });

  test('handles generic API errors', async () => {
    // Mock localStorage to return a token
    localStorage.getItem.mockReturnValue('fake-token');

    // Mock generic network error
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    render(<CreateCourse />);

    // Fill form with minimal valid data
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText(
          'An error occurred while creating the course. Please try again.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('disables submit button during form submission', async () => {
    // Mock localStorage to return a token
    localStorage.getItem.mockReturnValue('fake-token');

    // Create a promise that we can control when it resolves
    let resolvePromise;
    const mockPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    axios.post.mockImplementationOnce(() => mockPromise);

    render(<CreateCourse />);

    // Fill form with minimal valid data
    fireEvent.change(screen.getByLabelText(/course title/i), {
      target: { value: 'React Basics' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create course/i }));

    // Check if button is disabled during submission
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    // Check for loading indicator (CircularProgress)
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the promise to complete the API call
    resolvePromise({ data: { _id: 'new-course-id' } });
  });
});
