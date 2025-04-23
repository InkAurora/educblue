import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';

// Mock jwtDecode as a named export
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));
import { jwtDecode } from 'jwt-decode';

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Don't use requireActual which causes the error
  Link: ({ children, to }) => <a href={to}>{children}</a>,
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

// Add mock for addEventListener and removeEventListener
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const originalDispatchEvent = window.dispatchEvent;

describe('Navbar Component', () => {
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

  test('renders the app name', () => {
    render(<Navbar />);

    expect(screen.getByText('Educ Blue')).toBeInTheDocument();
  });

  test('shows Login and Register links when user is not logged in', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValueOnce(null);

    render(<Navbar />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();

    // Check localStorage was checked
    expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
  });

  test('shows Logout link when user is logged in', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  test('handles logout correctly', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    // Find and click the logout link
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    // Check if token was removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');

    // Check if user was redirected to home page
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/');

    // Check if authChange event was dispatched
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  test('Login link points to login page', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValue(null);

    render(<Navbar />);

    const loginLink = screen.getByText('Login');

    // Check if the link has the correct href
    expect(loginLink.getAttribute('href')).toBe('/login');
  });

  test('Register link points to register page', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValue(null);

    render(<Navbar />);

    const registerLink = screen.getByText('Register');

    // Check if the link has the correct href
    expect(registerLink.getAttribute('href')).toBe('/register');
  });

  test('displays user email when logged in', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    // Check if the user's email is displayed
    expect(screen.getByText('Hello, test@example.com')).toBeInTheDocument();
  });

  test('handles token without email property', () => {
    // Mock a token in localStorage without email but with sub property
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ sub: 'user123' });

    render(<Navbar />);

    // Check if the sub value is used as fallback
    expect(screen.getByText('Hello, user123')).toBeInTheDocument();
  });

  test('handles invalid token by logging out', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('invalid-token');

    // Mock jwtDecode to throw an error
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    render(<Navbar />);

    // Check if localStorage.removeItem was called
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');

    // Check that login/register buttons are shown (user logged out)
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();

    // Reset mock for other tests
    jwtDecode.mockReset();
  });

  test('registers event listeners on mount', () => {
    render(<Navbar />);

    // Check that event listeners were added
    expect(window.addEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function),
    );
    expect(window.addEventListener).toHaveBeenCalledWith(
      'authChange',
      expect.any(Function),
    );
  });

  test('removes event listeners on unmount', () => {
    const { unmount } = render(<Navbar />);

    unmount();

    // Check that event listeners were removed
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function),
    );
    expect(window.removeEventListener).toHaveBeenCalledWith(
      'authChange',
      expect.any(Function),
    );
  });
});
