import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';

// Mock useNavigate
const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  // Don't use requireActual which causes the error
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockedUsedNavigate,
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the app name', () => {
    render(<Navbar />);
    
    expect(screen.getByText('Educ Blue')).toBeInTheDocument();
  });

  test('shows Login link when user is not logged in', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValueOnce(null);
    
    render(<Navbar />);
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    
    // Check localStorage was checked
    expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
  });

  test('shows Logout link when user is logged in', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token-123');
    
    render(<Navbar />);
    
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  test('handles logout correctly', () => {
    // Mock a token in localStorage
    window.localStorage.getItem.mockReturnValueOnce('fake-token-123');
    
    render(<Navbar />);
    
    // Find and click the logout link
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    // Check if token was removed from localStorage
    expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
    
    // Check if user was redirected to home page
    expect(mockedUsedNavigate).toHaveBeenCalledWith('/');
  });

  test('Login link points to login page', () => {
    // Ensure no token in localStorage
    window.localStorage.getItem.mockReturnValueOnce(null);
    
    render(<Navbar />);
    
    const loginLink = screen.getByText('Login');
    
    // Check if the link has the correct href
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});