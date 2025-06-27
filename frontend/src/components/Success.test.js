import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as reactRouterDom from 'react-router-dom';
import Success from './Success';
import axiosInstance from '../utils/axiosConfig';

// Mock the axios instance properly
jest.mock('../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe('Success Component', () => {
  let mockNavigate;

  // Mock setup before each test
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Create navigation mock
    mockNavigate = jest.fn();
    reactRouterDom.useNavigate.mockReturnValue(mockNavigate);

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  test('renders loading state initially', async () => {
    // Mock location with a session ID and delay axios response to keep loading state
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock axiosInstance to return a pending promise that never resolves during this test
    axiosInstance.post.mockImplementation(() => new Promise(() => {}));

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    const { container } = render(<Success />);

    // Check for CircularProgress component
    expect(
      container.querySelector('.MuiCircularProgress-root'),
    ).toBeInTheDocument();
  });

  test('shows success message after successful enrollment', async () => {
    // Mock location with a session ID
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123&course_id=course123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock successful API response
    axiosInstance.post.mockResolvedValueOnce({});

    render(<Success />);

    // Wait for the success state to be shown
    await waitFor(() => {
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
      expect(screen.getByText(/Enrollment successful/)).toBeInTheDocument();
    });

    // Verify axios was called with the right parameters
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/enroll', {
      sessionId: 'test_session_123',
      courseId: 'course123',
    });
  });

  test('shows error when session_id is missing', async () => {
    // Mock location without a session ID
    reactRouterDom.useLocation.mockReturnValue({
      search: '',
    });

    render(<Success />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Enrollment Failed')).toBeInTheDocument();
      expect(
        screen.getByText('Missing session information'),
      ).toBeInTheDocument();
    });
  });

  test('shows error when user is not logged in', async () => {
    // Mock location with session ID but no token
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock missing token
    localStorage.getItem.mockReturnValue(null);

    render(<Success />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Enrollment Failed')).toBeInTheDocument();
      expect(
        screen.getByText('You need to be logged in to complete enrollment'),
      ).toBeInTheDocument();
    });
  });

  test('shows error when enrollment API call fails', async () => {
    // Mock location with session ID
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock API error with message
    axiosInstance.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Course already enrolled',
        },
      },
    });

    render(<Success />);

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Enrollment Failed')).toBeInTheDocument();
      expect(screen.getByText('Course already enrolled')).toBeInTheDocument();
    });
  });

  test('shows generic error when API fails without specific message', async () => {
    // Mock location with session ID
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock API error without specific message
    axiosInstance.post.mockRejectedValueOnce({
      response: {},
    });

    render(<Success />);

    // Wait for the generic error message to be displayed
    await waitFor(() => {
      expect(screen.getByText('Enrollment Failed')).toBeInTheDocument();
      expect(
        screen.getByText(
          'An error occurred during enrollment. Please contact support.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('navigates to course when continue button is clicked', async () => {
    // Mock location with a session ID and course ID
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123&course_id=course123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock successful API response
    axiosInstance.post.mockResolvedValueOnce({});

    render(<Success />);

    // Wait for the success state
    await waitFor(() => {
      expect(screen.getByText('Continue to Course')).toBeInTheDocument();
    });

    // Click the continue button
    userEvent.click(screen.getByText('Continue to Course'));

    // Check if navigation was called with correct course ID
    expect(mockNavigate).toHaveBeenCalledWith('/courses/course123');
  });

  test('navigates back to courses when return button is clicked on error', async () => {
    // Mock location without a session ID to trigger error
    reactRouterDom.useLocation.mockReturnValue({
      search: '',
    });

    render(<Success />);

    // Wait for the error state to be shown with Return to Courses button
    await waitFor(() => {
      expect(screen.getByText('Return to Courses')).toBeInTheDocument();
    });

    // Click the return button
    userEvent.click(screen.getByText('Return to Courses'));

    // Check if navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('uses enrollingCourseId from localStorage when course_id is not in URL', async () => {
    // Mock location with a session ID but no course_id
    reactRouterDom.useLocation.mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token and enrollingCourseId
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'valid-token';
      if (key === 'enrollingCourseId') return 'localStorage-course-123';
      return null;
    });

    // Mock successful API response
    axiosInstance.post.mockResolvedValueOnce({});

    render(<Success />);

    // Wait for the success state to be shown
    await waitFor(() => {
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    });

    // Verify axios was called with the right parameters including course ID from localStorage
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/enroll', {
      sessionId: 'test_session_123',
      courseId: 'localStorage-course-123',
    });

    // Verify localStorage.removeItem was called to clean up
    expect(localStorage.removeItem).toHaveBeenCalledWith('enrollingCourseId');
  });
});
