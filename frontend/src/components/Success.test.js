import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import Success from './Success';

// Mock the required modules
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    search: jest.fn(),
  }),
}));

describe('Success Component', () => {
  // Mock setup before each test
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

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
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock axios to return a pending promise that never resolves during this test
    axios.post.mockImplementation(() => new Promise(() => {}));

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
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock successful API response
    axios.post.mockResolvedValueOnce({});

    render(<Success />);

    // Wait for the success state to be shown
    await waitFor(() => {
      expect(screen.getByText('Payment Successful')).toBeInTheDocument();
      expect(screen.getByText(/Enrollment successful/)).toBeInTheDocument();
    });

    // Verify axios was called with the right parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:5000/api/enroll',
      { session_id: 'test_session_123' },
      {
        headers: {
          Authorization: 'Bearer valid-token',
        },
      },
    );
  });

  test('shows error when session_id is missing', async () => {
    // Mock location without a session ID
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
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
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
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
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock API error with message
    axios.post.mockRejectedValueOnce({
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
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock API error without specific message
    axios.post.mockRejectedValueOnce({
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

  test('navigates back to courses when return button is clicked', async () => {
    // Mock location with a session ID
    jest.spyOn(require('react-router-dom'), 'useLocation').mockReturnValue({
      search: '?session_id=test_session_123',
    });

    // Mock localStorage token
    localStorage.getItem.mockReturnValue('valid-token');

    // Mock successful API response
    axios.post.mockResolvedValueOnce({});

    // Mock navigate function
    const mockNavigate = jest.fn();
    jest
      .spyOn(require('react-router-dom'), 'useNavigate')
      .mockReturnValue(mockNavigate);

    render(<Success />);

    // Wait for the success state
    await waitFor(() => {
      expect(screen.getByText('Return to Courses')).toBeInTheDocument();
    });

    // Click the return button
    userEvent.click(screen.getByText('Return to Courses'));

    // Check if navigation was called
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
