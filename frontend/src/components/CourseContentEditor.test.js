import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseContentEditor from './CourseContentEditor';
import axiosInstance from '../utils/axiosConfig';
import { act } from 'react-dom/test-utils';

// Mock modules
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  post: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-simplemde-editor', () => {
  return function DummySimpleMDE(props) {
    return (
      <textarea
        data-testid='mock-simplemde'
        value={props.value || ''}
        onChange={(e) => props.onChange && props.onChange(e.target.value)}
      />
    );
  };
});

// Mock Material-UI components
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ children, open, ...props }) =>
      open ? (
        <div role='dialog' {...props}>
          {children}
        </div>
      ) : null,
    DialogTitle: ({ children, ...props }) => (
      <div
        data-testid='content-dialog-title'
        id='content-dialog-title'
        {...props}
      >
        {children}
      </div>
    ),
    DialogContent: ({ children, ...props }) => <div {...props}>{children}</div>,
    DialogActions: ({ children, ...props }) => <div {...props}>{children}</div>,
    Select: ({ children, value, onChange, inputProps, ...props }) => (
      <select
        data-testid='content-type-select'
        value={value || ''}
        onChange={(e) =>
          onChange &&
          onChange({ target: { name: props.name, value: e.target.value } })
        }
        aria-labelledby={props.labelId}
        {...props}
        inputprops={inputProps}
      >
        {children}
      </select>
    ),
    MenuItem: ({ value, children, ...props }) => (
      <option
        data-testid={`${value}-option`}
        data-value={value}
        value={value}
        {...props}
      >
        {children}
      </option>
    ),
    TextField: ({ onChange, value, label, name, ...props }) => (
      <div>
        <label htmlFor={props.id || name || label}>{label}</label>
        <input
          id={props.id || name || label}
          name={name}
          aria-label={label}
          value={value || ''}
          onChange={(e) =>
            onChange &&
            onChange({ target: { name: name, value: e.target.value } })
          }
          {...props}
        />
      </div>
    ),
    CircularProgress: () => <div role='progressbar' />,
    Alert: ({ children, severity, sx, ...props }) => (
      <div data-testid={`${severity}-alert`} role='alert' sx={sx} {...props}>
        {children}
      </div>
    ),
    AlertTitle: ({ children, ...props }) => (
      <strong {...props}>{children}</strong>
    ),
  };
});

// Mock icons to avoid SVG rendering issues
jest.mock('@mui/icons-material', () => ({
  Edit: () => <span data-testid='edit-icon'>Edit Icon</span>,
  Delete: () => <span data-testid='delete-icon'>Delete Icon</span>,
  Add: () => <span data-testid='add-icon'>Add Icon</span>,
}));

describe('CourseContentEditor Component', () => {
  const mockCourse = {
    _id: '123',
    title: 'Test Course',
    description: 'Test description',
    content: [
      {
        type: 'video',
        title: 'Existing Video',
        videoUrl: 'https://example.com/video',
      },
      {
        type: 'markdown',
        title: 'Existing Markdown',
        content: '# Markdown Content',
      },
    ],
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset navigation mock
    mockNavigate.mockClear();

    // Default axios mocks
    axiosInstance.get.mockResolvedValue({ data: mockCourse });
    axiosInstance.put.mockResolvedValue({ data: { success: true } });
    axiosInstance.patch.mockResolvedValue({ data: { success: true } });

    // Add mock for quizContent field
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      if (id === 'quizContent') {
        return {
          value:
            '{"questions": [{"text": "Test question", "answers": ["Answer 1", "Answer 2"]}]}',
        };
      }
      return null;
    });
  });

  afterEach(() => {
    if (document.getElementById.mockRestore) {
      document.getElementById.mockRestore();
    }
  });

  test('loads and displays course content', async () => {
    render(<CourseContentEditor />);

    // Should show loading initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Check if course title is displayed after loading
    await waitFor(() => {
      // The component shows either "Add Content: {title}" or just "Add Course Content"
      const headingElement = screen.getByText(/Add Content: Test Course/i);
      expect(headingElement).toBeInTheDocument();

      // Check for course content items
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
      expect(screen.getByText(/Existing Markdown/i)).toBeInTheDocument();
    });

    // API should have been called correctly
    expect(axiosInstance.get).toHaveBeenCalledWith(`/api/courses/123`);
  });

  test('handles error when loading course fails', async () => {
    axiosInstance.get.mockRejectedValue({
      response: { status: 404, data: { message: 'Course not found' } },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasErrorMessage = alerts.some((alert) =>
        alert.textContent.includes('Course not found'),
      );
      expect(hasErrorMessage).toBeTruthy();
    });
  });

  test('handles unauthorized error when loading course', async () => {
    axiosInstance.get.mockRejectedValue({
      response: { status: 403, data: { message: 'Forbidden' } },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasPermissionError = alerts.some(
        (alert) =>
          alert.textContent.includes('You do not have permission') ||
          alert.textContent.includes('Forbidden'),
      );
      expect(hasPermissionError).toBeTruthy();
    });
  });

  test('handles invalid or undefined course ID', async () => {
    // Override useParams mock for this test only
    jest
      .spyOn(require('react-router-dom'), 'useParams')
      .mockReturnValueOnce({ id: undefined });

    render(<CourseContentEditor />);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasInvalidIdError = alerts.some(
        (alert) =>
          alert.textContent.includes('Invalid course ID') ||
          alert.textContent.includes('course ID'),
      );
      expect(hasInvalidIdError).toBeTruthy();
    });

    // Restore the original mock for other tests
    jest.spyOn(require('react-router-dom'), 'useParams').mockRestore();
  });

  test('opens dialog to add new content', async () => {
    render(<CourseContentEditor />);

    // Wait for the content to load
    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click add content button
    fireEvent.click(screen.getByText('Add Content'));

    // Dialog should be open
    await waitFor(() => {
      expect(screen.getByTestId('content-dialog-title')).toBeInTheDocument();
      expect(screen.getByText('Add Content Item')).toBeInTheDocument();
      expect(screen.getByLabelText(/Content Title/i)).toBeInTheDocument();
    });
  });

  test('validates title when saving content item', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    const addButton = screen.getByText('Add Content');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId('content-dialog-title')).toBeInTheDocument();
    });

    // Try to save without title
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    // Should show validation error
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasTitleError = alerts.some((alert) =>
        alert.textContent.includes('Title is required'),
      );
      expect(hasTitleError).toBeTruthy();
    });
  });

  test('validates video URL when saving video content', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    await waitFor(() => {
      expect(screen.getByTestId('content-dialog-title')).toBeInTheDocument();
    });

    // Enter only title, but not video URL
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'New Video' },
    });

    // Try to save
    fireEvent.click(screen.getByText('Save'));

    // Should show validation error for video URL
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasVideoURLError = alerts.some((alert) =>
        alert.textContent.includes('Video URL is required'),
      );
      expect(hasVideoURLError).toBeTruthy();
    });
  });

  test('validates markdown content when saving markdown item', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    // Find and use the select element directly
    const selectElement = screen.getByTestId('content-type-select');
    fireEvent.change(selectElement, {
      target: { value: 'markdown' },
    });

    // Enter only title, but not content
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'New Markdown' },
    });

    // Try to save
    fireEvent.click(screen.getByText('Save'));

    // Should show validation error
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasContentError = alerts.some((alert) =>
        alert.textContent.includes('Content is required'),
      );
      expect(hasContentError).toBeTruthy();
    });
  });

  test('validates quiz content when saving quiz item', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    // Find and use the select element directly
    const selectElement = screen.getByTestId('content-type-select');
    fireEvent.change(selectElement, {
      target: { value: 'quiz' },
    });

    // Enter only title, but not content
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'New Quiz' },
    });

    // Try to save
    fireEvent.click(screen.getByText('Save'));

    // Should show validation error
    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasContentError = alerts.some((alert) =>
        alert.textContent.includes('Content is required'),
      );
      expect(hasContentError).toBeTruthy();
    });
  });

  test('adds new video content item successfully', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'New Test Video' },
    });

    fireEvent.change(screen.getByLabelText(/Video URL/i), {
      target: { value: 'https://example.com/new-video' },
    });

    // Save the item
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    // New item should be in the list
    await waitFor(() => {
      expect(screen.getByText('New Test Video')).toBeInTheDocument();
    });
  });

  test('adds new markdown content item successfully', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    // Change type to markdown using direct select change
    const selectElement = screen.getByTestId('content-type-select');
    fireEvent.change(selectElement, {
      target: { value: 'markdown' },
    });

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'New Markdown Content' },
    });

    // Fill markdown content
    const mockEditor = screen.getByTestId('mock-simplemde');
    fireEvent.change(mockEditor, {
      target: { value: '# New Markdown Heading' },
    });

    // Save the item
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    // New item should be in the list
    await waitFor(() => {
      expect(screen.getByText('New Markdown Content')).toBeInTheDocument();
    });
  });

  test('adds new quiz content item successfully', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    // Change type to quiz using direct select change
    const selectElement = screen.getByTestId('content-type-select');
    fireEvent.change(selectElement, {
      target: { value: 'quiz' },
    });

    // Fill the form
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'New Quiz' },
    });

    // Fill quiz content
    fireEvent.change(screen.getByLabelText(/Quiz Content/i), {
      target: {
        value:
          '{"questions": [{"text": "What is React?", "answers": ["A JS library", "A CSS framework"]}]}',
      },
    });

    // Save the item
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    // New item should be in the list
    await waitFor(() => {
      expect(screen.getByText('New Quiz')).toBeInTheDocument();
    });
  });

  test('edits existing content item', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Find and click edit button for first item
    const editButtons = screen.getAllByTestId('edit-icon');
    fireEvent.click(editButtons[0].closest('button'));

    // Dialog should show with existing values
    await waitFor(() => {
      expect(screen.getByTestId('content-dialog-title')).toBeInTheDocument();
      expect(screen.getByText('Edit Content Item')).toBeInTheDocument();
    });

    // Change title
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'Updated Video Title' },
    });

    // Save the changes
    await act(async () => {
      fireEvent.click(screen.getByText('Save'));
    });

    // Wait for the update to process
    await waitFor(() => {
      expect(screen.getByText('Updated Video Title')).toBeInTheDocument();
      expect(screen.queryByText('Existing Video')).not.toBeInTheDocument();
    });
  });

  test('deletes content item', async () => {
    const mockCourseWithContent = {
      ...mockCourse,
      content: [
        {
          type: 'video',
          title: 'Video To Delete',
          videoUrl: 'https://example.com/video',
        },
        {
          type: 'markdown',
          title: 'Markdown To Keep',
          content: '# Markdown Content',
        },
      ],
    };

    axiosInstance.get.mockResolvedValueOnce({ data: mockCourseWithContent });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText('Video To Delete')).toBeInTheDocument();
    });

    // Find and click delete button for first item
    const deleteButtons = screen.getAllByTestId('delete-icon');
    fireEvent.click(deleteButtons[0].closest('button'));

    // Wait for the item to be removed
    await waitFor(() => {
      expect(screen.queryByText('Video To Delete')).not.toBeInTheDocument();
      expect(screen.getByText('Markdown To Keep')).toBeInTheDocument();
    });
  });

  test('saves course content successfully', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click save content button
    fireEvent.click(screen.getByText('Save Content'));

    // API should be called with correct data
    await waitFor(() => {
      expect(axiosInstance.put).toHaveBeenCalledWith(
        `/api/courses/123/content`,
        { content: expect.any(Array) },
      );
    });
  });

  test('shows error if trying to save without content', async () => {
    // Setup mock with empty content
    axiosInstance.get.mockResolvedValueOnce({
      data: { ...mockCourse, content: [] },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      // Check for the no content message
      expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();
    });

    // Verify Save Content button is disabled when there's no content
    const saveButton = screen.getByText('Save Content');
    expect(saveButton).toBeDisabled();
  });

  test('shows error if trying to publish without content', async () => {
    // Setup mock with empty content
    axiosInstance.get.mockResolvedValueOnce({
      data: { ...mockCourse, content: [] },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();
    });

    // Verify Publish Course button is disabled when there's no content
    const publishButton = screen.getByText('Publish Course');
    expect(publishButton).toBeDisabled();
  });

  test('publishes course successfully', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click publish button
    fireEvent.click(screen.getByText('Publish Course'));

    // API should be called
    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        `/api/courses/123/publish`,
        expect.objectContaining({
          status: 'published',
          content: expect.any(Array),
        }),
      );

      // Should save content first before publishing
      expect(axiosInstance.put).toHaveBeenCalledWith(
        `/api/courses/123/content`,
        { content: expect.any(Array) },
      );
    });

    // Should navigate to course page
    expect(mockNavigate).toHaveBeenCalledWith('/courses/123');
  });

  test('shows error when publishing fails', async () => {
    // Mock the API to resolve for content saving but fail for publishing
    axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });
    axiosInstance.patch.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Only instructors can publish courses' },
      },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click publish button
    fireEvent.click(screen.getByText('Publish Course'));

    // Should show error
    await waitFor(() => {
      const errorElements = screen.getAllByRole('alert');
      const hasExpectedError = errorElements.some(
        (el) =>
          el.textContent.includes('Access denied') ||
          el.textContent.includes('Only instructors can publish courses'),
      );
      expect(hasExpectedError).toBeTruthy();
    });
  });

  test('displays loading indicator when saving content', async () => {
    // Delay the API response to show loading state
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    axiosInstance.put.mockReturnValueOnce(promise);

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click save button
    fireEvent.click(screen.getByText('Save Content'));

    // Should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the API call
    act(() => {
      resolvePromise({ data: { success: true } });
    });

    // Loading indicator should disappear
    await waitFor(() => {
      const saveButton = screen.getByText('Save Content');
      expect(saveButton).not.toBeDisabled();
    });
  });

  test('resets form fields when changing content type', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    await waitFor(() => {
      expect(screen.getByTestId('content-dialog-title')).toBeInTheDocument();
    });

    // Add video data
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'Test Video' },
    });

    fireEvent.change(screen.getByLabelText(/Video URL/i), {
      target: { value: 'https://example.com/video' },
    });

    // Change to markdown
    const selectElement = screen.getByTestId('content-type-select');
    fireEvent.change(selectElement, {
      target: { value: 'markdown' },
    });

    // Verify the markdown editor is now visible and the video URL field is gone
    await waitFor(() => {
      expect(screen.getByTestId('mock-simplemde')).toBeInTheDocument();
      expect(screen.queryByLabelText(/Video URL/i)).not.toBeInTheDocument();
    });
  });

  test('closes dialog without saving changes', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Open dialog
    fireEvent.click(screen.getByText('Add Content'));

    await waitFor(() => {
      expect(screen.getByTestId('content-dialog-title')).toBeInTheDocument();
    });

    // Add data
    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: 'Test Cancel' },
    });

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should be closed
    await waitFor(() => {
      expect(
        screen.queryByTestId('content-dialog-title'),
      ).not.toBeInTheDocument();
    });

    // New item should not be in the list
    expect(screen.queryByText('Test Cancel')).not.toBeInTheDocument();
  });

  test('handles unauthorized error when saving content', async () => {
    axiosInstance.put.mockRejectedValueOnce({
      response: { status: 403, data: { message: 'Forbidden' } },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Try to save
    fireEvent.click(screen.getByText('Save Content'));

    // Should show error
    await waitFor(() => {
      const errorElements = screen.getAllByRole('alert');
      const hasExpectedError = errorElements.some(
        (el) =>
          el.textContent.includes('Access denied') ||
          el.textContent.includes('Only instructors can edit courses'),
      );
      expect(hasExpectedError).toBeTruthy();
    });
  });

  test('handles general error when saving content', async () => {
    axiosInstance.put.mockRejectedValueOnce({
      response: { status: 500 },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Try to save
    fireEvent.click(screen.getByText('Save Content'));

    // Should show error
    await waitFor(() => {
      const errorElements = screen.getAllByRole('alert');
      const hasExpectedError = errorElements.some((el) =>
        el.textContent.includes('Failed to save course content'),
      );
      expect(hasExpectedError).toBeTruthy();
    });
  });

  test('handles non-response errors when loading course', async () => {
    axiosInstance.get.mockRejectedValueOnce(new Error('Network Error'));

    render(<CourseContentEditor />);

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      const hasFailedLoadError = alerts.some(
        (alert) =>
          alert.textContent.includes('Failed to load course') ||
          alert.textContent.includes('Network Error'),
      );
      expect(hasFailedLoadError).toBeTruthy();
    });
  });

  test('shows loading indicator when publishing course', async () => {
    // Delay the API response to show loading state
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });
    axiosInstance.patch.mockReturnValueOnce(promise);

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click publish button
    fireEvent.click(screen.getByText('Publish Course'));

    // Should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the API call
    act(() => {
      resolvePromise({ data: { success: true } });
    });

    // Loading indicator should disappear
    await waitFor(() => {
      const saveButton = screen.getByText('Save Content');
      expect(saveButton).not.toBeDisabled();
    });
  });

  // Additional test to improve coverage
  test('shows error for 400 status when publishing fails', async () => {
    axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });
    axiosInstance.patch.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Content validation failed' },
      },
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click publish button
    fireEvent.click(screen.getByText('Publish Course'));

    // Should show specific error for 400 status
    await waitFor(() => {
      const errorElements = screen.getAllByRole('alert');
      const hasExpectedError = errorElements.some((el) =>
        el.textContent.includes('Content validation failed'),
      );
      expect(hasExpectedError).toBeTruthy();
    });
  });

  // Test for handling non-response errors when publishing
  test('handles non-response errors when publishing course', async () => {
    axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });
    axiosInstance.patch.mockRejectedValueOnce(
      new Error('Network error during publishing'),
    );

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Click publish button
    fireEvent.click(screen.getByText('Publish Course'));

    // Should show general error message
    await waitFor(() => {
      const errorElements = screen.getAllByRole('alert');
      const hasExpectedError = errorElements.some((el) =>
        el.textContent.includes('Failed to publish course'),
      );
      expect(hasExpectedError).toBeTruthy();
    });
  });

  // Test that the handleSaveContent function correctly shows an error when content is empty
  test('shows error when trying to save with empty content array', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Existing Video/i)).toBeInTheDocument();
    });

    // Delete all content items
    const deleteButtons = screen.getAllByTestId('delete-icon');

    // Delete first item
    fireEvent.click(deleteButtons[0].closest('button'));

    // Delete second item (now the first item in the list)
    await waitFor(() => {
      const updatedDeleteButtons = screen.getAllByTestId('delete-icon');
      fireEvent.click(updatedDeleteButtons[0].closest('button'));
    });

    // Now try to save empty content
    await waitFor(() => {
      expect(screen.getByText(/No content added yet/i)).toBeInTheDocument();

      // Save button should be disabled
      const saveButton = screen.getByText('Save Content');
      expect(saveButton).toBeDisabled();
    });
  });
});
