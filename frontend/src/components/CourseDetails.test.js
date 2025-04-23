import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock axios before importing components that use it
jest.mock('axios');
import axios from 'axios';

import CourseDetails from './CourseDetails';

// Mock useNavigate and useParams
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Simplified mock implementation
  useNavigate: () => mockedUsedNavigate,
  useParams: () => ({ id: '123' }),
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

// Mock window.alert
global.alert = jest.fn();

describe('CourseDetails Component', () => {
  const mockCourse = {
    _id: '123',
    title: 'Test Course',
    description: 'This is a test course',
    price: 49.99,
    instructor: 'Test Instructor',
    duration: 12,
    content: [
      { _id: 'c1', title: 'Introduction', type: 'video' },
      { _id: 'c2', title: 'Getting Started', type: 'text' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    axios.get.mockImplementationOnce(() => new Promise(() => {}));

    render(<CourseDetails />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders error when API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(<CourseDetails />);

    await waitFor(() => {
      expect(screen.getByText('Course not found')).toBeInTheDocument();
    });
  });

  test('renders course details when API call succeeds', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });

    render(<CourseDetails />);

    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
      expect(screen.getByText('This is a test course')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(
        screen.getByText('Instructor: Test Instructor'),
      ).toBeInTheDocument();
      expect(screen.getByText('Duration: 12 hours')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
      expect(screen.getByText('Getting Started')).toBeInTheDocument();
    });
  });

  // New tests for enrollment functionality
  test('renders Enroll button', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });

    render(<CourseDetails />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /enroll now/i }),
      ).toBeInTheDocument();
    });
  });

  test('redirects to login page when not authenticated', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });
    localStorage.getItem.mockReturnValueOnce(null); // No token

    render(<CourseDetails />);

    await waitFor(() => {
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      fireEvent.click(enrollButton);
    });

    expect(window.alert).toHaveBeenCalledWith('Please log in to enroll');
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/login');
  });

  test('handles successful enrollment', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });
    localStorage.getItem.mockReturnValueOnce('fake-token-123'); // With token
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    render(<CourseDetails />);

    await waitFor(() => {
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      fireEvent.click(enrollButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/enroll',
        { courseId: '123' },
        { headers: { Authorization: 'Bearer fake-token-123' } },
      );
      expect(screen.getByText('Enrolled successfully')).toBeInTheDocument();
    });
  });

  test('handles already enrolled error', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });
    localStorage.getItem.mockReturnValueOnce('fake-token-123'); // With token
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'User already enrolled in this course' } },
    });

    render(<CourseDetails />);

    await waitFor(() => {
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      fireEvent.click(enrollButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Already enrolled')).toBeInTheDocument();
    });
  });

  test('handles enrollment errors', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });
    localStorage.getItem.mockReturnValueOnce('fake-token-123'); // With token
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Server error' } },
    });

    render(<CourseDetails />);

    await waitFor(() => {
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      fireEvent.click(enrollButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('disables button during enrollment process', async () => {
    axios.get.mockResolvedValueOnce({ data: mockCourse });
    localStorage.getItem.mockReturnValueOnce('fake-token-123'); // With token

    // Create a promise that doesn't resolve immediately
    let resolvePromise;
    const enrollPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axios.post.mockImplementationOnce(() => enrollPromise);

    render(<CourseDetails />);

    await waitFor(() => {
      const enrollButton = screen.getByRole('button', { name: /enroll now/i });
      fireEvent.click(enrollButton);
    });

    await waitFor(() => {
      const enrollButton = screen.getByRole('button', { name: /enrolling/i });
      expect(enrollButton).toBeDisabled();
      expect(enrollButton).toHaveTextContent('Enrolling...');
    });

    // Resolve the promise to complete the enrollment
    resolvePromise({ data: { success: true } });

    await waitFor(() => {
      expect(screen.getByText('Enrolled successfully')).toBeInTheDocument();
    });
  });
});
