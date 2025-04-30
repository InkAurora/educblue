import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import CourseSidebar from './CourseSidebar';

// Mock useMediaQuery to control responsive behavior
jest.mock('@mui/material/useMediaQuery');

// Sample test data
const mockCourse = {
  title: 'React Fundamentals',
  instructor: 'Jane Doe',
  content: [
    { id: '1', title: 'Introduction', type: 'video' },
    { id: '2', title: 'React Components', type: 'markdown' },
    { id: '3', title: 'Hooks Overview', type: 'markdown' },
    { id: '4', title: 'Final Quiz', type: 'quiz' },
  ],
};

const mockProgress = [
  { contentId: '1', completed: true },
  { contentId: '3', completed: true },
];

const mockCourseId = '123';

// Create a theme for ThemeProvider
const theme = createTheme();

// Helper function to render with necessary providers
const renderWithProviders = (component) => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </MemoryRouter>,
  );
};

describe('CourseSidebar', () => {
  // Test 1: Course title and instructor display
  test('renders course title and instructor correctly', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    renderWithProviders(
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
  test('displays all content items with correct titles and types', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Check all content item titles are displayed
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('React Components')).toBeInTheDocument();
    expect(screen.getByText('Hooks Overview')).toBeInTheDocument();
    expect(screen.getByText('Final Quiz')).toBeInTheDocument();

    // Check content types are displayed
    expect(screen.getByText('video')).toBeInTheDocument();
    expect(screen.getAllByText('markdown').length).toBe(2);
    expect(screen.getByText('quiz')).toBeInTheDocument();
  });

  // Test 3: Completed items have checkmarks
  test('displays checkmarks for completed content items', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    const { container } = renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Find all CheckCircleIcon instances (completed items)
    const checkCircleIcons = container.querySelectorAll(
      '.MuiSvgIcon-colorSuccess',
    );
    expect(checkCircleIcons.length).toBe(2); // We should have 2 completed items
  });

  // Test 4: Content items link to the correct URL
  test('content items link to the correct URLs', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Check that each ListItemButton has the correct link
    const links = screen.getAllByRole('link');

    // Check the first item links to the correct URL
    expect(links[0]).toHaveAttribute('href', '/courses/123/content/1');

    // Check the second item links to the correct URL
    expect(links[1]).toHaveAttribute('href', '/courses/123/content/2');
  });

  // Test 5: Mobile view displays toggle button
  test('displays toggle button on mobile view', () => {
    // Mock mobile view
    useMediaQuery.mockReturnValue(true);

    renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Check that toggle button is present in mobile view
    expect(screen.getByTestId('course-sidebar-toggle')).toBeInTheDocument();

    // Desktop sidebar should not be present
    expect(
      screen.queryByTestId('course-sidebar-desktop'),
    ).not.toBeInTheDocument();
  });

  // Test 6: Mobile drawer opens when toggle button is clicked
  test('opens drawer when toggle button is clicked on mobile', () => {
    // Mock mobile view
    useMediaQuery.mockReturnValue(true);

    renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={mockProgress}
        courseId={mockCourseId}
      />,
    );

    // Click the toggle button
    fireEvent.click(screen.getByTestId('course-sidebar-toggle'));

    // After clicking, drawer should be open and course title should be visible
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Instructor: Jane Doe')).toBeInTheDocument();
  });

  // Test 7: Desktop view displays persistent drawer
  test('displays persistent drawer on desktop view', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    renderWithProviders(
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
  test('handles null or undefined progress gracefully', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={null}
        courseId={mockCourseId}
      />,
    );

    // The component should render without crashing
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();

    // Check that no checkmarks are displayed when progress is null
    const { container } = renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={null}
        courseId={mockCourseId}
      />,
    );

    // There should be no success icons
    const checkCircleIcons = container.querySelectorAll(
      '.MuiSvgIcon-colorSuccess',
    );
    expect(checkCircleIcons.length).toBe(0);
  });

  // Test 9: Test for content not in progress array (to cover remaining branch in isContentCompleted)
  test('displays no checkmark for content not in progress array', () => {
    // Mock desktop view
    useMediaQuery.mockReturnValue(false);

    // Create progress array that doesn't include contentId '2' or '4'
    const limitedProgress = [
      { contentId: '1', completed: true },
      { contentId: '3', completed: true },
    ];

    const { container } = renderWithProviders(
      <CourseSidebar
        course={mockCourse}
        progress={limitedProgress}
        courseId={mockCourseId}
      />,
    );

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
