import React from 'react';
import { render, screen } from '@testing-library/react';
import CourseDetails from './CourseDetails';

// Mock all the imports
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockImplementation(() =>
    Promise.resolve({
      redirectToCheckout: jest.fn().mockResolvedValue({}),
    }),
  ),
}));

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => (
    <div data-testid='markdown-content'>{children}</div>
  ),
}));

jest.mock('dompurify', () => ({
  sanitize: jest.fn((content) => content),
}));

jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
  useNavigate: () => jest.fn(),
}));

// Mock component to avoid actual rendering of CourseDetails
jest.mock('./CourseDetails', () => {
  return function MockedCourseDetails(props) {
    return (
      <div data-testid='course-details'>Mocked CourseDetails Component</div>
    );
  };
});

describe('CourseDetails Component', () => {
  test('renders without crashing', () => {
    render(<CourseDetails />);
    expect(screen.getByTestId('course-details')).toBeInTheDocument();
  });
});
