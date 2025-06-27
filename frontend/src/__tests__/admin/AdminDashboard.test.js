import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import AdminDashboard from '../../components/admin/AdminDashboard';
import axiosInstance from '../../utils/axiosConfig';

// Mock axios instance
jest.mock('../../utils/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

// Mock Material-UI Select component

describe('AdminDashboard Component', () => {
  const mockAdminUser = {
    _id: 'admin123',
    fullName: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockUsers = [
    {
      _id: 'user1',
      fullName: 'Student One',
      email: 'student1@example.com',
      role: 'student',
      enrolledCourses: ['course1', 'course2'],
    },
    {
      _id: 'user2',
      fullName: 'Instructor One',
      email: 'instructor1@example.com',
      role: 'instructor',
      enrolledCourses: [],
    },
    {
      _id: 'admin123',
      fullName: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      enrolledCourses: ['course3'],
    },
  ];

  const mockAnalytics = {
    courses: { total: 25 },
    users: {
      total: 120,
      byRole: {
        instructor: 15,
        student: 104,
      },
    },
    engagement: {
      averageCompletionRate: 0.68,
    },
  };

  const mockCourses = [
    { _id: 'course1', title: 'React Basics', instructor: 'Instructor One' },
    {
      _id: 'course2',
      title: 'Advanced JavaScript',
      instructor: 'Instructor Two',
    },
    {
      _id: 'course3',
      title: 'Node.js Fundamentals',
      instructor: 'Instructor One',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('redirects non-admins to dashboard', async () => {
    // Mock user as non-admin
    axiosInstance.get.mockImplementationOnce(() =>
      Promise.resolve({
        data: { ...mockAdminUser, role: 'student' },
      }),
    );

    const navigateMock = jest.fn();
    jest
      .spyOn(require('react-router-dom'), 'useNavigate')
      .mockReturnValue(navigateMock);

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('renders admin dashboard with analytics and user table', async () => {
    // Mock API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockAdminUser });
      }
      if (url === '/api/users') {
        return Promise.resolve({ data: mockUsers });
      }
      if (url === '/api/analytics') {
        return Promise.resolve({ data: mockAnalytics });
      }
      if (url === '/api/courses') {
        return Promise.resolve({ data: mockCourses });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });

    // Check analytics data display
    expect(screen.getByText('Total Courses')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Avg. Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('68.0%')).toBeInTheDocument();

    // Check user table headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Enrolled Courses')).toBeInTheDocument();

    // Check if user data is displayed
    expect(screen.getByText('Student One')).toBeInTheDocument();
    expect(screen.getByText('student1@example.com')).toBeInTheDocument();
    expect(screen.getByText('Instructor One')).toBeInTheDocument();
  });

  test('allows admin to change user role', async () => {
    // Mock API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockAdminUser });
      }
      if (url === '/api/users') {
        return Promise.resolve({ data: mockUsers });
      }
      if (url === '/api/analytics') {
        return Promise.resolve({ data: mockAnalytics });
      }
      if (url === '/api/courses') {
        return Promise.resolve({ data: mockCourses });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    // Mock put request for role update
    axiosInstance.put.mockResolvedValue({
      data: {
        user: { ...mockUsers[0], role: 'instructor' },
        message: 'User updated successfully',
      },
    });

    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Student One')).toBeInTheDocument();
    });

    // Find the role select element for the first user
    const studentRow = screen.getByText('Student One').closest('tr');
    const selectElement = within(studentRow).getByDisplayValue('student');

    // Trigger the change event directly on the hidden input element
    fireEvent.change(selectElement, { target: { value: 'instructor' } });

    // Verify the API call was made correctly
    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/user1', {
        role: 'instructor',
      });
    });
  });

  test('opens enrollment dialog and allows managing course enrollments', async () => {
    // Mock API responses
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockAdminUser });
      }
      if (url === '/api/users') {
        return Promise.resolve({ data: mockUsers });
      }
      if (url === '/api/analytics') {
        return Promise.resolve({ data: mockAnalytics });
      }
      if (url === '/api/courses') {
        return Promise.resolve({ data: mockCourses });
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    render(<AdminDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Student One')).toBeInTheDocument();
    });

    // Find the edit button for the first user (the one with EditIcon)
    const studentRow = screen.getByText('Student One').closest('tr');
    const editButton = within(studentRow).getByLabelText('Manage Enrollments');

    // Click the edit button to open the enrollment dialog
    fireEvent.click(editButton);

    // Verify dialog opens
    await waitFor(() => {
      expect(screen.getByText(/Enroll User in Courses/i)).toBeInTheDocument();
    });

    // Check if courses are displayed in the dialog
    expect(screen.getByText('React Basics')).toBeInTheDocument();
    expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js Fundamentals')).toBeInTheDocument();

    // Mock the put request for enrollment update
    axiosInstance.put.mockResolvedValue({
      data: { message: 'User enrollments updated successfully' },
    });

    // Toggle a course enrollment status
    const reactCourseCheckbox = screen
      .getByText('React Basics')
      .closest('li')
      .querySelector('input[type="checkbox"]');

    fireEvent.click(reactCourseCheckbox);

    // Save changes
    fireEvent.click(screen.getByText('Save'));

    // Verify API call
    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith('/api/users/user1', {
        enrolledCourses: expect.any(Array),
      });
    });
  });

  test('displays error message when API calls fail', async () => {
    // Mock user data success but other API calls failure
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/users/me') {
        return Promise.resolve({ data: mockAdminUser });
      }
      return Promise.reject(new Error('API Error'));
    });

    render(<AdminDashboard />);

    // Wait for error message
    await waitFor(() => {
      expect(
        screen.getByText(/Failed to load initial data/i),
      ).toBeInTheDocument();
    });
  });
});
