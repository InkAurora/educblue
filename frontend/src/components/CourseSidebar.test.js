import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import axiosInstance from '../utils/axiosConfig';
import CourseSidebar from './CourseSidebar';

// Mock useMediaQuery to control responsive behavior
jest.mock('@mui/material/useMediaQuery');

// Mock axiosConfig
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
}));

// Mock ProgressBar component
jest.mock(
  './courses/ProgressBar',
  () =>
    function MockProgressBar({ percentage }) {
      return <div data-testid='progress-bar'>Progress: {percentage}%</div>;
    },
);

// Mock react-router-dom to provide a stable location
jest.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/courses/123/sections/section1/content/1',
    search: '',
    hash: '',
    state: null,
  }),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Sample test data
const mockCourse = {
  title: 'React Fundamentals',
  instructor: { fullName: 'Jane Doe' },
  id: '123',
};

const mockSections = [
  { id: 'section1', title: 'Getting Started' },
  { id: 'section2', title: 'Advanced Topics' },
];

const mockSectionContent = [
  { id: '1', title: 'Introduction', type: 'video' },
  { id: '2', title: 'React Components', type: 'markdown' },
  { id: '3', title: 'Hooks Overview', type: 'markdown' },
  { id: '4', title: 'Final Quiz', type: 'quiz' },
];

const mockProgress = [
  { contentId: '1', completed: true },
  { contentId: '3', completed: true },
];

const mockCourseId = '123';

// Create a theme for ThemeProvider
const theme = createTheme();

// Helper function to render with necessary providers and mock API responses
const renderWithProviders = async (component, options = {}) => {
  const {
    mockCourse: customCourse = mockCourse,
    mockSections: customSections = mockSections,
    mockSectionContent: customSectionContent = mockSectionContent,
    mockProgress: customProgress = mockProgress,
    progressPercentage = 50,
  } = options;

  // Create the sidebar toggle container that the component expects
  const sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'course-sidebar-container';
  document.body.appendChild(sidebarContainer);

  // Mock API responses
  axiosInstance.get.mockImplementation((url) => {
    if (
      url.includes('/api/courses/') &&
      url.includes('/sections') &&
      !url.includes('/sections/')
    ) {
      // This is the sections list call: /api/courses/{courseId}/sections
      return Promise.resolve({ data: customSections });
    }
    if (
      url.includes('/api/courses/') &&
      url.includes('/sections/') &&
      url.match(/\/sections\/[^/]+$/)
    ) {
      // This is the section content call: /api/courses/{courseId}/sections/{sectionId}
      return Promise.resolve({ data: { content: customSectionContent } });
    }
    if (url.includes('/api/progress/')) {
      return Promise.resolve({
        data: {
          progressRecords: customProgress,
          progressPercentage,
        },
      });
    }
    if (url.includes('/api/courses/') && !url.includes('/sections')) {
      return Promise.resolve({ data: customCourse });
    }
    return Promise.reject(new Error('Not found'));
  });

  const renderResult = render(
    <ThemeProvider theme={theme}>{component}</ThemeProvider>,
  );

  // Wait for async operations to complete
  await waitFor(
    () => {
      // Check if the course title is rendered (indicating data has loaded)
      if (customCourse?.title) {
        expect(screen.getByText(customCourse.title)).toBeInTheDocument();
      }
    },
    { timeout: 3000 },
  );

  return renderResult;
};

describe('CourseSidebar', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Clean up after each test
  afterEach(() => {
    const container = document.getElementById('course-sidebar-container');
    if (container) {
      document.body.removeChild(container);
    }
  });

  // Test 1: Course title and instructor display
  test('renders course title and instructor correctly', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Check that course title and instructor are rendered
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Instructor: Jane Doe')).toBeInTheDocument();
  });

  // Test 2: Content list display
  test('displays all content items with correct titles and types', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Wait for content to load and then check content items
    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    // Check all content item titles are displayed
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('React Components')).toBeInTheDocument();
    expect(screen.getByText('Hooks Overview')).toBeInTheDocument();
    expect(screen.getByText('Final Quiz')).toBeInTheDocument();

    // Check content types are displayed (the component shows user-friendly labels)
    expect(screen.getByText('Video Lesson')).toBeInTheDocument();
    expect(screen.getAllByText('Reading Material').length).toBe(2);
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  // Test 3: Completed items have checkmarks
  test('displays checkmarks for completed content items', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    const { container } = await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    // Find all CheckCircleIcon instances (completed items)
    const checkCircleIcons = container.querySelectorAll(
      '.MuiSvgIcon-colorSuccess',
    );
    expect(checkCircleIcons.length).toBe(2); // We should have 2 completed items
  });

  // Test 4: Content items link to the correct URL
  test('content items link to the correct URLs', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    // Check that each ListItemButton has the correct link structure
    const links = screen.getAllByRole('link');

    // The new URL structure is: /courses/{courseId}/sections/{sectionId}/content/{contentId}
    // Check the first item links to the correct URL format
    expect(links[0]).toHaveAttribute(
      'href',
      '/courses/123/sections/section1/content/1',
    );

    // Check the second item links to the correct URL format
    expect(links[1]).toHaveAttribute(
      'href',
      '/courses/123/sections/section1/content/2',
    );
  });

  // Test 5: Mobile view displays toggle button
  test('displays toggle button on mobile view', async () => {
    // Mock mobile view
    useMediaQuery.mockReturnValue(true);

    // Create container for toggle button
    const container = document.createElement('div');
    container.id = 'course-sidebar-container';
    document.body.appendChild(container);

    render(
      <ThemeProvider theme={theme}>
        <CourseSidebar
          course={mockCourse}
          progress={mockProgress}
          courseId={mockCourseId}
        />
      </ThemeProvider>,
    );

    // Wait for the toggle button to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('course-sidebar-toggle')).toBeInTheDocument();
    });

    // Desktop sidebar should not be present
    expect(
      screen.queryByTestId('course-sidebar-desktop'),
    ).not.toBeInTheDocument();
  });

  // Test 6: Mobile drawer opens when toggle button is clicked
  test('opens drawer when toggle button is clicked on mobile', async () => {
    // Mock mobile view
    useMediaQuery.mockReturnValue(true);

    // Create container for toggle button
    const container = document.createElement('div');
    container.id = 'course-sidebar-container';
    document.body.appendChild(container);

    // Mock axios responses
    axiosInstance.get.mockImplementation((url) => {
      if (url.includes('/sections') && !url.includes('/sections/')) {
        return Promise.resolve({ data: mockSections });
      }
      if (url.includes('/sections/section1')) {
        return Promise.resolve({ data: { content: mockSectionContent } });
      }
      if (url.includes('/api/progress/')) {
        return Promise.resolve({
          data: {
            progressRecords: mockProgress,
            progressPercentage: 50,
          },
        });
      }
      if (url.includes('/api/courses/') && !url.includes('/sections')) {
        return Promise.resolve({ data: mockCourse });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <ThemeProvider theme={theme}>
        <CourseSidebar
          course={mockCourse}
          progress={mockProgress}
          courseId={mockCourseId}
        />
      </ThemeProvider>,
    );

    // Wait for toggle button to be available
    await waitFor(() => {
      expect(screen.getByTestId('course-sidebar-toggle')).toBeInTheDocument();
    });

    // Click the toggle button
    fireEvent.click(screen.getByTestId('course-sidebar-toggle'));

    // After clicking, drawer should be open and course title should be visible
    await waitFor(() => {
      expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    });
    expect(screen.getByText('Instructor: Jane Doe')).toBeInTheDocument();
  });

  // Test 7: Desktop view displays persistent drawer
  test('displays persistent drawer on desktop view', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Check that desktop sidebar is present
    expect(screen.getByTestId('course-sidebar-desktop')).toBeInTheDocument();

    // Mobile toggle should not be present
    expect(
      screen.queryByTestId('course-sidebar-toggle'),
    ).not.toBeInTheDocument();

    // Content should be visible without clicking anything
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
  });

  // Test 8: Adding a test to cover the branch on line 71 (isContentCompleted with null progress)
  test('handles null or undefined progress gracefully', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    const { container } = await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={null}
        courseId={mockCourseId}
      />,
      { mockProgress: null },
    );

    // The component should render without crashing
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    // Check that no checkmarks are displayed when progress is null
    // There should be no success icons
    const checkCircleIcons = container.querySelectorAll(
      '.MuiSvgIcon-colorSuccess',
    );
    expect(checkCircleIcons.length).toBe(0);
  });

  // Test 9: Test for content not in progress array (to cover remaining branch in isContentCompleted)
  test('displays no checkmark for content not in progress array', async () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    // Create progress array that doesn't include contentId '2' or '4'
    const limitedProgress = [
      { contentId: '1', completed: true },
      { contentId: '3', completed: true },
    ];

    const { container } = await renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={limitedProgress}
        courseId={mockCourseId}
      />,
      { mockProgress: limitedProgress },
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    // We should see exactly 2 check icons (for items 1 and 3)
    const checkCircleIcons = container.querySelectorAll(
      '.MuiSvgIcon-colorSuccess',
    );
    expect(checkCircleIcons.length).toBe(2);

    // Verify content items 2 and 4 have no check icons
    const allLinks = screen.getAllByRole('link');

    // For content item 2 (React Components) - should not have CheckCircleIcon
    const reactComponentsLink = allLinks.find((link) =>
      link.textContent.includes('React Components'),
    );
    expect(
      reactComponentsLink.querySelector('[data-testid="CheckCircleIcon"]'),
    ).toBeNull();

    // For content item 4 (Final Quiz) - should not have CheckCircleIcon
    const finalQuizLink = allLinks.find((link) =>
      link.textContent.includes('Final Quiz'),
    );
    expect(
      finalQuizLink.querySelector('[data-testid="CheckCircleIcon"]'),
    ).toBeNull();
  });
});
