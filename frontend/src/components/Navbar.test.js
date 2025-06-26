import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { jwtDecode } from 'jwt-decode';
import Navbar from './Navbar';
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

  test('handles logout correctly', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-token-123';
      if (key === 'refreshToken') return 'fake-refresh-token-123';
      return null;
    });
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    // Setup axios mock response for logout
    axiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

    render(<Navbar />);

    // Find and click the logout link
    const logoutButton = screen.getByText('Logout');

    await act(async () => {
      fireEvent.click(logoutButton);
    });

    // Verify axios was called with correct parameters
    expect(axiosInstance.post).toHaveBeenCalledWith('/api/auth/logout', {
      refreshToken: 'fake-refresh-token-123',
    });

    // Check if token was removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');

    // Check if user was redirected to home page
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/');

    // Check if authChange event was dispatched
    expect(window.dispatchEvent).toHaveBeenCalled();
  });

  test('handles logout when API call fails', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'fake-token-123';
      if (key === 'refreshToken') return 'fake-refresh-token-123';
      return null;
    });
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    // Setup axios mock to throw an error
    axiosInstance.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<Navbar />);

    // Find and click the logout link
    const logoutButton = screen.getByText('Logout');

    await act(async () => {
      fireEvent.click(logoutButton);
    });

    // Should still clean up even if API fails
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('refreshToken');
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
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
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('handles token without email property', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');

    // Mock the jwtDecode to return a token without email but with sub
    jwtDecode.mockReturnValue({
      sub: 'user123',
    });

    render(<Navbar />);

    // Check if the sub value is used as fallback
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  test('handles token with empty or undefined user info', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');

    // Mock the jwtDecode to return an empty object
    jwtDecode.mockReturnValue({});

    render(<Navbar />);

    // Check that "User" is displayed as fallback
    expect(screen.getByText('User')).toBeInTheDocument();
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

  test('storage event listener updates auth state when token changes', () => {
    // Setup initial state
    window.localStorage.getItem.mockReturnValueOnce('initial-token');
    jwtDecode.mockReturnValueOnce({ email: 'initial@example.com' });

    render(<Navbar />);
    expect(screen.getByText('initial@example.com')).toBeInTheDocument();

    // Capture the storage event listener
    const storageEventCallback = window.addEventListener.mock.calls.find(
      (call) => call[0] === 'storage',
    )[1];

    // Update the mock to return a different token
    window.localStorage.getItem.mockReturnValueOnce('new-token');
    jwtDecode.mockReturnValueOnce({ email: 'updated@example.com' });

    // Simulate storage event
    act(() => {
      storageEventCallback({ key: 'token' });
    });

    // Re-render to reflect changes
    render(<Navbar />);
    expect(screen.getByText('updated@example.com')).toBeInTheDocument();
  });

  test('storage event ignores non-token changes', () => {
    // Setup initial state
    window.localStorage.getItem.mockReturnValueOnce('initial-token');
    jwtDecode.mockReturnValueOnce({ email: 'test@example.com' });

    render(<Navbar />);

    // Capture the storage event listener
    const storageEventCallback = window.addEventListener.mock.calls.find(
      (call) => call[0] === 'storage',
    )[1];

    // Reset the mocks to track new calls
    window.localStorage.getItem.mockClear();
    jwtDecode.mockClear();

    // Simulate storage event with non-token key
    act(() => {
      storageEventCallback({ key: 'not-token' });
    });

    // Token should not be checked
    expect(window.localStorage.getItem).not.toHaveBeenCalled();
    expect(jwtDecode).not.toHaveBeenCalled();
  });

  test('authChange event listener updates auth state', () => {
    // Setup initial state
    window.localStorage.getItem.mockReturnValueOnce('initial-token');
    jwtDecode.mockReturnValueOnce({ email: 'initial@example.com' });

    render(<Navbar />);

    // Capture the authChange event listener
    const authChangeCallback = window.addEventListener.mock.calls.find(
      (call) => call[0] === 'authChange',
    )[1];

    // Update the mock to return a different token
    window.localStorage.getItem.mockReturnValueOnce('new-token');
    jwtDecode.mockReturnValueOnce({ email: 'new@example.com' });

    // Simulate authChange event
    act(() => {
      authChangeCallback();
    });

    // Re-render to reflect changes
    render(<Navbar />);
    expect(screen.getByText('new@example.com')).toBeInTheDocument();
  });

  test('shows Dashboard button when user is logged in', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    // Check if Dashboard button is rendered
    const dashboardButton = screen.getByText('Dashboard');
    expect(dashboardButton).toBeInTheDocument();
  });

  test('Dashboard button links to dashboard page', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    const dashboardButton = screen.getByText('Dashboard');

    // Check if the link has the correct href
    expect(dashboardButton.getAttribute('href')).toBe('/dashboard');
  });

  test('does not show Dashboard button when user is not logged in', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValue(null);

    render(<Navbar />);

    // Check that Dashboard button is not in the document
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  test('renders Dashboard button before Logout button', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    // Get the HTML content to check element order
    const container = screen.getByText('Dashboard').closest('div');
    const html = container.innerHTML;

    // Check if Dashboard appears before Logout in the HTML
    const dashboardIndex = html.indexOf('Dashboard');
    const logoutIndex = html.indexOf('Logout');

    expect(dashboardIndex).toBeLessThan(logoutIndex);
  });

  // New tests for Create Course button
  test('shows Create Course button when user is an instructor', () => {
    // Mock a token in localStorage with instructor role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    render(<Navbar />);

    // Check if Create Course button is rendered
    expect(screen.getByText('Create Course')).toBeInTheDocument();
  });

  test('does not show Create Course button when user is a student', () => {
    // Mock a token in localStorage with student role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'student@example.com',
      role: 'student',
    });

    render(<Navbar />);

    // Check that Create Course button is not in the document
    expect(screen.queryByText('Create Course')).not.toBeInTheDocument();
  });

  test('Create Course button links to create-course page', () => {
    // Mock a token in localStorage with instructor role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    render(<Navbar />);

    const createCourseButton = screen.getByText('Create Course');

    // Check if the link has the correct href
    expect(createCourseButton.getAttribute('href')).toBe('/create-course');
  });

  test('renders Create Course button before Dashboard button', () => {
    // Mock a token in localStorage with instructor role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    render(<Navbar />);

    // Get the HTML content to check element order
    const container = screen.getByText('Create Course').closest('div');
    const html = container.innerHTML;

    // Check if Create Course appears before Dashboard in the HTML
    const createCourseIndex = html.indexOf('Create Course');
    const dashboardIndex = html.indexOf('Dashboard');

    expect(createCourseIndex).toBeLessThan(dashboardIndex);
  });

  // New tests for My Courses button
  test('shows My Courses button when user is an instructor', () => {
    // Mock a token in localStorage with instructor role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    render(<Navbar />);

    // Check if My Courses button is rendered
    expect(screen.getByText('My Courses')).toBeInTheDocument();
  });

  test('does not show My Courses button when user is a student', () => {
    // Mock a token in localStorage with student role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'student@example.com',
      role: 'student',
    });

    render(<Navbar />);

    // Check that My Courses button is not in the document
    expect(screen.queryByText('My Courses')).not.toBeInTheDocument();
  });

  test('My Courses button links to my-courses page', () => {
    // Mock a token in localStorage with instructor role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    render(<Navbar />);

    const myCoursesButton = screen.getByText('My Courses');

    // Check if the link has the correct href
    expect(myCoursesButton.getAttribute('href')).toBe('/my-courses');
  });

  test('renders My Courses button after Create Course button', () => {
    // Mock a token in localStorage with instructor role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'instructor@example.com',
      role: 'instructor',
    });

    render(<Navbar />);

    // Get the HTML content to check element order
    const container = screen.getByText('Create Course').closest('div');
    const html = container.innerHTML;

    // Check if Create Course appears before My Courses in the HTML
    const createCourseIndex = html.indexOf('Create Course');
    const myCoursesIndex = html.indexOf('My Courses');

    expect(createCourseIndex).toBeLessThan(myCoursesIndex);
  });

  test('shows Profile button when user is logged in', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    render(<Navbar />);

    // Check if Profile button is rendered
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Profile').getAttribute('href')).toBe(
      '/personal-information',
    );
  });

  test('fetchUserData sets user full name when API returns data', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    // Mock successful API response
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        fullName: 'John Doe',
      },
    });

    await act(async () => {
      render(<Navbar />);
    });

    // Check API call was made with correct parameters
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/users/me', {
      headers: {
        Authorization: 'Bearer fake-token-123',
      },
    });

    // Check the user's full name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('fetchUserData handles API error gracefully', async () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({ email: 'test@example.com' });

    // Mock failed API response
    axiosInstance.get.mockRejectedValueOnce(new Error('API Error'));

    await act(async () => {
      render(<Navbar />);
    });

    // Should still display email as fallback
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('handles error in token decoding', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValue('invalid-token');

    // Mock jwtDecode to throw an error
    jwtDecode.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    render(<Navbar />);

    // Check that token was removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');

    // Check login status was reset
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  test('shows admin button for admin users', () => {
    // Mock a token in localStorage with admin role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'admin@example.com',
      role: 'admin',
    });

    render(<Navbar />);

    // Check if Admin button is rendered
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  test('does not show admin button for non-admin users', () => {
    // Mock a token in localStorage with student role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'student@example.com',
      role: 'student',
    });

    render(<Navbar />);

    // Check that Admin button is not in the document
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  test('Admin button links to admin page', () => {
    // Mock a token in localStorage with admin role
    window.localStorage.getItem.mockReturnValue('fake-token-123');
    jwtDecode.mockReturnValue({
      email: 'admin@example.com',
      role: 'admin',
    });

    render(<Navbar />);

    const adminButton = screen.getByText('Admin');

    // Check if the link has the correct href
    expect(adminButton.getAttribute('href')).toBe('/admin');
  });
});
