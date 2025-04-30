import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import App from './App';

// Mock react-router-dom components directly
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => (
    <div data-testid='mock-browser-router'>{children}</div>
  ),
  Routes: ({ children }) => <div data-testid='mock-routes'>{children}</div>,
  Route: ({ path, element }) => (
    <div
      data-testid={`route-${path.replace(/\//g, '-').replace(/:/g, '')}`}
      data-path={path}
    >
      {element}
    </div>
  ),
}));

// Mock all the components that routes render
jest.mock('./components/CourseList', () => () => (
  <div data-testid='mock-course-list'>Course List Component</div>
));
jest.mock('./components/CourseDetails', () => () => (
  <div data-testid='mock-course-details'>Course Details Component</div>
));
jest.mock('./components/courses/CourseContent', () => () => (
  <div data-testid='mock-course-content'>Course Content Component</div>
));
jest.mock('./components/Login', () => () => (
  <div data-testid='mock-login'>Login Component</div>
));
jest.mock('./components/Register', () => () => (
  <div data-testid='mock-register'>Register Component</div>
));
jest.mock('./components/Success', () => () => (
  <div data-testid='mock-success'>Success Component</div>
));
jest.mock('./components/UserDashboard', () => () => (
  <div data-testid='mock-dashboard'>User Dashboard Component</div>
));
jest.mock('./components/CreateCourse', () => () => (
  <div data-testid='mock-create-course'>Create Course Component</div>
));
jest.mock('./components/courses/editor/CourseContentEditor', () => () => (
  <div data-testid='mock-course-content-editor'>
    Course Content Editor Component
  </div>
));
jest.mock('./components/MyCourses', () => () => (
  <div data-testid='mock-my-courses'>My Courses Component</div>
));
jest.mock('./components/PersonalInformation', () => () => (
  <div data-testid='mock-personal-info'>Personal Information Component</div>
));
jest.mock('./components/Navbar', () => () => (
  <div data-testid='mock-navbar'>Navbar Component</div>
));

// Also mock Material UI components
jest.mock('@mui/material', () => ({
  Container: ({ children }) => (
    <div data-testid='mock-container'>{children}</div>
  ),
  Typography: ({ children }) => (
    <div data-testid='mock-typography'>{children}</div>
  ),
  Box: ({ children }) => <div data-testid='mock-box'>{children}</div>,
}));

// Clean up after each test
afterEach(cleanup);

describe('App Component', () => {
  test('should render App with all routes correctly', () => {
    render(<App />);

    // Check for navbar
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();

    // Check for header content
    expect(screen.getByText('Educ Blue')).toBeInTheDocument();

    // Verify all routes are present
    expect(screen.getByTestId('mock-routes')).toBeInTheDocument();

    // Check that all components are rendered
    expect(screen.getByTestId('mock-course-list')).toBeInTheDocument();
    expect(screen.getByTestId('mock-course-details')).toBeInTheDocument();
    expect(screen.getByTestId('mock-course-content')).toBeInTheDocument();
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();
    expect(screen.getByTestId('mock-register')).toBeInTheDocument();
    expect(screen.getByTestId('mock-success')).toBeInTheDocument();
    expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mock-create-course')).toBeInTheDocument();
    expect(
      screen.getByTestId('mock-course-content-editor'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('mock-my-courses')).toBeInTheDocument();

    // Check for PersonalInformation component (used in two routes)
    const personalInfoElements = screen.getAllByTestId('mock-personal-info');
    expect(personalInfoElements.length).toBe(2);
  });
});
