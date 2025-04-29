import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock all components that will be rendered in the app
jest.mock('./components/Navbar', () => () => (
  <div data-testid='navbar'>Navbar Component</div>
));
jest.mock('./components/CourseList', () => () => (
  <div data-testid='course-list'>Course List Component</div>
));
jest.mock('./components/CourseDetails', () => () => (
  <div data-testid='course-details'>Course Details Component</div>
));
jest.mock('./components/Login', () => () => (
  <div data-testid='login'>Login Component</div>
));
jest.mock('./components/Register', () => () => (
  <div data-testid='register'>Register Component</div>
));
jest.mock('./components/UserDashboard', () => () => (
  <div data-testid='dashboard'>Dashboard Component</div>
));
jest.mock('./components/CreateCourse', () => () => (
  <div data-testid='create-course'>Create Course Component</div>
));
jest.mock('./components/CourseContentEditor', () => () => (
  <div data-testid='content-editor'>Content Editor Component</div>
));
jest.mock('./components/MyCourses', () => () => (
  <div data-testid='my-courses'>My Courses Component</div>
));
jest.mock('./components/Success', () => () => (
  <div data-testid='success'>Success Component</div>
));
jest.mock('./components/PersonalInformation', () => () => (
  <div data-testid='personal-information'>Personal Information Component</div>
));

// Mock react-router-dom without requiring the actual module
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ path, element }) => element, // Render all route elements
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
  useParams: () => ({ id: 'test-id', courseId: 'test-course-id' }),
  useLocation: () => ({ pathname: '/' }),
}));

describe('App', () => {
  test('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders Navbar component', () => {
    render(<App />);
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
  });

  test('renders page title', () => {
    render(<App />);
    expect(screen.getByText('Educ Blue')).toBeInTheDocument();
  });

  test('renders course list component', () => {
    render(<App />);
    expect(screen.getByTestId('course-list')).toBeInTheDocument();
  });

  test('renders course details component', () => {
    render(<App />);
    expect(screen.getByTestId('course-details')).toBeInTheDocument();
  });

  test('renders login component', () => {
    render(<App />);
    expect(screen.getByTestId('login')).toBeInTheDocument();
  });

  test('renders register component', () => {
    render(<App />);
    expect(screen.getByTestId('register')).toBeInTheDocument();
  });

  test('renders success component', () => {
    render(<App />);
    expect(screen.getByTestId('success')).toBeInTheDocument();
  });

  test('renders user dashboard component', () => {
    render(<App />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  test('renders create course component', () => {
    render(<App />);
    expect(screen.getByTestId('create-course')).toBeInTheDocument();
  });

  test('renders course content editor component', () => {
    render(<App />);
    expect(screen.getByTestId('content-editor')).toBeInTheDocument();
  });

  test('renders my courses component', () => {
    render(<App />);
    expect(screen.getByTestId('my-courses')).toBeInTheDocument();
  });

  test('renders personal information component', () => {
    render(<App />);
    // Using getAllByTestId as there are two routes rendering the same component
    expect(
      screen.getAllByTestId('personal-information').length,
    ).toBeGreaterThanOrEqual(1);
  });
});
