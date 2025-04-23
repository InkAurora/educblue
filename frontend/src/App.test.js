import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the components
jest.mock('./components/CourseList', () => () => (
  <div data-testid='course-list'>CourseList Mock</div>
));
jest.mock('./components/CourseDetails', () => () => (
  <div data-testid='course-details'>CourseDetails Mock</div>
));
jest.mock('./components/Login', () => () => (
  <div data-testid='login'>Login Mock</div>
));
jest.mock('./components/Navbar', () => () => (
  <div data-testid='navbar'>Navbar Mock</div>
));
jest.mock('./components/UserDashboard', () => () => (
  <div data-testid='user-dashboard'>UserDashboard Mock</div>
));

// Mock react-router-dom with a simplified approach
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Link: ({ children }) => <a href='/'>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ search: '' }), // Added useLocation
}));

describe('App', () => {
  test('renders without crashing', () => {
    render(<App />);
    // Check for the Navbar component which contains the app name
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders Navbar component', () => {
    render(<App />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders course list component', () => {
    render(<App />);
    expect(screen.getByTestId('course-list')).toBeInTheDocument();
  });

  test('renders login component', () => {
    render(<App />);
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  test('renders user dashboard component', () => {
    render(<App />);
    expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
  });
});
