import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import axiosInstance from '../utils/axiosConfig';

// Mock axios config module
jest.mock('../utils/axiosConfig', () => ({
  post: jest.fn(),
  __esModule: true,
  default: { post: jest.fn() },
}));

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Simpler mock that doesn't rely on requireActual
  useNavigate: () => mockedUsedNavigate,
}));

// Mock localStorage
const localStorageMock = (function localStorageMock() {
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

// Mock window.dispatchEvent
window.dispatchEvent = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with email and password fields', () => {
    render(<Login />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('handles input changes', () => {
    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('submits form and handles successful login', async () => {
    // Mock successful login response with both tokens
    axiosInstance.post.mockResolvedValueOnce({
      data: {
        accessToken: 'fake-access-token-123',
        refreshToken: 'fake-refresh-token-456',
      },
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for the login request to complete
    await waitFor(() => {
      // Check if axiosInstance.post was called with the correct data
      expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      // Check if tokens were saved to localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'token',
        'fake-access-token-123',
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'refreshToken',
        'fake-refresh-token-456',
      );

      // Check if auth change event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalled();

      // Check if navigation occurred to dashboard
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('handles login failure with invalid credentials', async () => {
    // Mock failed login response
    axiosInstance.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Invalid credentials' } },
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(/invalid email or password/i),
      ).toBeInTheDocument();
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles login failure with server error', async () => {
    // Mock server error
    axiosInstance.post.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Server error' } },
    });

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles network error without response object', async () => {
    // Mock network error without response object
    axiosInstance.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText(/an error occurred during login. please try again./i),
      ).toBeInTheDocument();
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  test('disables button during login process', async () => {
    // Use a promise that we can control the resolve timing
    let resolvePromise;
    const loginPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axiosInstance.post.mockImplementationOnce(() => loginPromise);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Button should be disabled and show loading text
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /logging in/i }),
      ).toBeDisabled();
    });

    // Resolve the promise to complete the login
    resolvePromise({
      data: {
        accessToken: 'fake-access-token-123',
        refreshToken: 'fake-refresh-token-456',
      },
    });

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalled();
    });
  });
});
