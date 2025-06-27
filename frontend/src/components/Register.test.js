import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';

// Import the mocked axiosConfig
import axiosInstance from '../utils/axiosConfig';

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockedUsedNavigate,
}));

// Mock axiosConfig
jest.mock('../utils/axiosConfig', () => ({
  post: jest.fn(),
  __esModule: true,
  default: {
    post: jest.fn(),
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

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn();

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mock
    localStorageMock.clear.mockReset();
    localStorageMock.getItem.mockReset();
    localStorageMock.setItem.mockReset();
    localStorageMock.removeItem.mockReset();
    // Reset mocked implementations
    axiosInstance.post.mockReset();
  });

  test('renders register form correctly', () => {
    render(<Register />);

    // Check if all form elements are rendered
    expect(
      screen.getByRole('heading', { name: /register/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    // Role selector remains but only student option available
    expect(
      screen.getByRole('button', { name: /register/i }),
    ).toBeInTheDocument();
  });

  test('allows entering email and password', () => {
    render(<Register />);

    // Simulate user input
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Check if the inputs have the correct values
    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      'test@example.com',
    );
    expect(screen.getByLabelText(/password/i)).toHaveValue('password123');

    // No role selection UI; default role handled internally
  });

  test('submits form and handles successful registration', async () => {
    const mockResponse = {
      data: {
        accessToken: 'fake-token-123',
        refreshToken: 'fake-refresh-token',
      },
    };
    axiosInstance.post.mockResolvedValueOnce(mockResponse);

    render(<Register />);

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Wait for form validation to complete and button to be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /register/i }),
      ).not.toBeDisabled();
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the form submission to complete
    await waitFor(() => {
      // Check if axiosInstance.post was called with the right arguments
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'test@example.com',
        password: 'password123',
        role: 'student', // role is fixed to student
      });

      // Check if tokens were stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'token',
        'fake-token-123',
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'fake-refresh-token',
      );

      // Check if auth change event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));

      // Verify the event name is 'authChange'
      const eventArg = window.dispatchEvent.mock.calls[0][0];
      expect(eventArg.type).toBe('authChange');

      // Check if user was redirected to personal information page
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/personal-information');
    });
  });

  test('handles registration error - user already exists', async () => {
    // Mock axios to reject with a 409 error
    const error = {
      response: {
        status: 409,
        data: { message: 'User already exists' },
      },
    };
    axiosInstance.post.mockRejectedValueOnce(error);

    render(<Register />);

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Wait for form validation to complete and button to be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /register/i }),
      ).not.toBeDisabled();
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('User already exists')).toBeInTheDocument();
    });

    // Verify we don't navigate away
    expect(mockedUsedNavigate).not.toHaveBeenCalled();
  });

  test('handles generic server error', async () => {
    // Mock axios to reject with a generic error
    const error = {
      response: {
        status: 500,
        data: { message: 'Server error' },
      },
    };
    axiosInstance.post.mockRejectedValueOnce(error);

    render(<Register />);

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Wait for form validation to complete and button to be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /register/i }),
      ).not.toBeDisabled();
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    // Mock axios to reject with no response
    axiosInstance.post.mockRejectedValueOnce(new Error('Network error'));

    render(<Register />);

    // Fill the form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Wait for form validation to complete and button to be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /register/i }),
      ).not.toBeDisabled();
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(
          'An error occurred during registration. Please try again.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('validates email format and shows error message for invalid email', async () => {
    render(<Register />);

    // Enter invalid email
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' },
    });

    // Tab away to trigger validation
    fireEvent.blur(screen.getByLabelText(/email address/i));

    // Check if error message appears
    await waitFor(() => {
      expect(
        screen.getByText('Please enter a valid email address'),
      ).toBeInTheDocument();
    });

    // Fix the email format
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'valid@example.com' },
    });

    // Check if error message disappears
    await waitFor(() => {
      expect(
        screen.queryByText('Please enter a valid email address'),
      ).not.toBeInTheDocument();
    });
  });

  test('validates password length and shows error message for short passwords', async () => {
    render(<Register />);

    // Enter short password
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '12345' },
    });

    // Tab away to trigger validation
    fireEvent.blur(screen.getByLabelText(/password/i));

    // Check if error message appears
    await waitFor(() => {
      expect(
        screen.getByText('Password must be at least 6 characters long'),
      ).toBeInTheDocument();
    });

    // Fix the password length
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123456' },
    });

    // Check if error message disappears
    await waitFor(() => {
      expect(
        screen.queryByText('Password must be at least 6 characters long'),
      ).not.toBeInTheDocument();
    });
  });

  test('submit button is disabled when form is invalid', async () => {
    render(<Register />);

    // Initially the form is empty, button should be disabled
    expect(screen.getByRole('button', { name: /register/i })).toBeDisabled();

    // Enter invalid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '12345' }, // Too short
    });

    // Button should still be disabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /register/i })).toBeDisabled();
    });

    // Fix the data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'valid@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '123456' },
    });

    // Button should be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /register/i }),
      ).not.toBeDisabled();
    });
  });

  test('shows validation error when form submitted with invalid data', async () => {
    render(<Register />);

    // Enter invalid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '12345' }, // Too short
    });

    // Try to submit the form (in Register.js the form has noValidate attribute)
    // We need to find the form element in a different way since it doesn't have a role
    const form = screen.getByTestId('register-form');
    fireEvent.submit(form);

    // Check for error message
    await waitFor(() => {
      expect(
        screen.getByText(
          'Please fix the errors in the form before submitting.',
        ),
      ).toBeInTheDocument();
    });
  });

  test('button shows loading state during submission', async () => {
    // Mock axiosInstance to delay response
    axiosInstance.post.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: { accessToken: 'token', refreshToken: 'refresh-token' },
            });
          }, 100);
        }),
    );

    render(<Register />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Wait for form validation to complete and button to be enabled
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /register/i }),
      ).not.toBeDisabled();
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check if button text changed to loading state
    expect(screen.getByText(/registering\.\.\./i)).toBeInTheDocument();

    // Wait for the submission to complete
    await waitFor(() => {
      expect(axiosInstance.post).toHaveBeenCalled();
    });
  });
});
