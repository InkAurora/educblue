import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import axios from 'axios';

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Simpler mock that doesn't rely on requireActual
  useNavigate: () => mockedUsedNavigate,
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
    // Mock successful login response
    axios.post.mockResolvedValueOnce({ data: { token: 'fake-token-123' } });

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Wait for the login request to complete
    await waitFor(() => {
      // Check if axios.post was called with the correct data
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        { email: 'test@example.com', password: 'password123' },
      );

      // Check if token was saved to localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'token',
        'fake-token-123',
      );

      // Check if navigation occurred
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles login failure with invalid credentials', async () => {
    // Mock failed login response
    axios.post.mockRejectedValueOnce({
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
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  test('handles login failure with server error', async () => {
    // Mock server error
    axios.post.mockRejectedValueOnce({
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
      expect(screen.getByText('Server error')).toBeInTheDocument();
      expect(mockedUsedNavigate).not.toHaveBeenCalled();
    });
  });

  test('disables button during login process', async () => {
    // Use a promise that we can control the resolve timing
    let resolvePromise;
    const loginPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    axios.post.mockImplementationOnce(() => loginPromise);

    render(<Login />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    // Button should be disabled and show loading text
    expect(loginButton).toBeDisabled();
    expect(loginButton).toHaveTextContent('Logging in...');

    // Resolve the promise to complete the login
    resolvePromise({ data: { token: 'fake-token-123' } });

    await waitFor(() => {
      expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
    });
  });
});
