import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { jwtDecode } from 'jwt-decode';
import Navbar from '../components/Navbar';
import axiosInstance from '../utils/axiosConfig';

// Mock axios instance
jest.mock('../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock jwtDecode as a named export
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Don't use requireActual which causes the error
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockedUsedNavigate,
  useLocation: () => ({ pathname: '/' }),
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

// Add mock for addEventListener and removeEventListener
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const originalDispatchEvent = window.dispatchEvent;

describe('Navbar Admin Link Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset window event listener mocks
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    window.dispatchEvent = jest.fn();
  });

  afterEach(() => {
    // Restore original methods
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    window.dispatchEvent = originalDispatchEvent;
  });

  test('shows Admin link when user is admin', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'admin@example.com',
      role: 'admin',
    });

    // Mock axios response for user data
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
      },
    });

    render(<Navbar />);

    // Wait for user data to load and admin link to appear
    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    // Verify admin link points to correct URL
    const adminLink = screen.getByText('Admin');
    expect(adminLink.getAttribute('href')).toBe('/admin');
  });

  test('does not show Admin link when user is not admin', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'student@example.com',
      role: 'student',
    });

    // Mock axios response for user data
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Student User',
        email: 'student@example.com',
        role: 'student',
      },
    });

    render(<Navbar />);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });

  test('does not show Admin link when user is instructor', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    // Mock axios response for user data
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'Instructor User',
        email: 'instructor@example.com',
        role: 'instructor',
      },
    });

    render(<Navbar />);

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.queryByText('Admin')).not.toBeInTheDocument();
    });
  });
});
