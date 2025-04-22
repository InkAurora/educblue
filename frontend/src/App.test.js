import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  useNavigate: () => jest.fn(),
}));

jest.mock('./components/CourseList', () => ({
  __esModule: true,
  default: () => <div data-testid='course-list'>CourseList Component</div>,
}));

jest.mock('./components/CourseDetails', () => ({
  __esModule: true,
  default: () => (
    <div data-testid='course-details'>CourseDetails Component</div>
  ),
}));

describe('App', () => {
  test('renders header text', () => {
    render(<App />);
    expect(screen.getByText('Educ Blue')).toBeInTheDocument();
  });

  test('renders CourseList component', () => {
    render(<App />);
    expect(screen.getByTestId('course-list')).toBeInTheDocument();
  });
});
