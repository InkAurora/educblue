import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseContentEditor from './CourseContentEditor';
import useCourseContent from '../../../hooks/useCourseContent';

// Mock the custom hook
jest.mock('../../../hooks/useCourseContent');

// Mock the child components to focus on testing just this component
jest.mock('./ContentItemList', () => ({ content, onEdit, onDelete, onAdd }) => (
  <div data-testid='mock-content-item-list'>
    <button data-testid='add-content-button' onClick={onAdd}>
      Add Content
    </button>
    {content.map((item, index) => (
      <div key={index} data-testid={`content-item-${index}`}>
        {item.title} ({item.type})
        <button
          data-testid={`edit-button-${index}`}
          onClick={() => onEdit(index)}
        >
          Edit
        </button>
        <button
          data-testid={`delete-button-${index}`}
          onClick={() => onDelete(index)}
        >
          Delete
        </button>
      </div>
    ))}
  </div>
));

jest.mock(
  './ContentItemForm',
  () =>
    ({
      open,
      onClose,
      currentItem,
      setCurrentItem,
      onSave,
      error,
      isEditing,
    }) =>
      open ? (
        <div data-testid='mock-content-item-form'>
          <div>Type: {currentItem.type}</div>
          <div>Title: {currentItem.title}</div>
          <div>VideoURL: {currentItem.videoUrl}</div>
          <div>Content: {currentItem.content}</div>
          <div>IsEditing: {isEditing.toString()}</div>
          {error && <div data-testid='form-error'>{error}</div>}
          <input
            data-testid='title-input'
            value={currentItem.title}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, title: e.target.value })
            }
          />
          <input
            data-testid='video-url-input'
            value={currentItem.videoUrl}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, videoUrl: e.target.value })
            }
          />
          <textarea
            data-testid='content-textarea'
            value={currentItem.content}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, content: e.target.value })
            }
          />
          <select
            data-testid='type-select'
            value={currentItem.type}
            onChange={(e) =>
              setCurrentItem({ ...currentItem, type: e.target.value })
            }
          >
            <option value='video'>Video</option>
            <option value='markdown'>Markdown</option>
            <option value='quiz'>Quiz</option>
          </select>
          <button data-testid='cancel-button' onClick={onClose}>
            Cancel
          </button>
          <button data-testid='save-button' onClick={onSave}>
            Save
          </button>
        </div>
      ) : null,
);

// Mock useParams - simplified approach
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
}));

describe('CourseContentEditor Component', () => {
  // Helper function to set up default mock returns
  const setupMockHook = ({
    course = { _id: '123', title: 'Test Course' },
    content = [],
    loading = false,
    error = '',
    savingContent = false,
    publishing = false,
    saveContent = jest.fn().mockResolvedValue(true),
    publishCourse = jest.fn().mockResolvedValue(true),
  } = {}) => {
    useCourseContent.mockReturnValue({
      course,
      content,
      setContent: jest.fn((newContent) => {
        content = newContent;
      }),
      loading,
      error,
      setError: jest.fn(),
      savingContent,
      publishing,
      saveContent,
      publishCourse,
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockHook();
  });

  test('renders loading spinner when loading', () => {
    setupMockHook({ loading: true });
    render(<CourseContentEditor />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders course title and content area when course is loaded', () => {
    render(<CourseContentEditor />);
    expect(screen.getByText(/Add Content: Test Course/i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-content-item-list')).toBeInTheDocument();
  });

  test('renders error alert when error exists', () => {
    setupMockHook({ error: 'Test error message' });
    render(<CourseContentEditor />);
    expect(screen.getByTestId('error-alert')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('opens dialog for adding new content item', () => {
    render(<CourseContentEditor />);
    fireEvent.click(screen.getByTestId('add-content-button'));
    expect(screen.getByTestId('mock-content-item-form')).toBeInTheDocument();
    expect(screen.getByText('IsEditing: false')).toBeInTheDocument();
  });

  test('opens dialog for editing existing content item', () => {
    setupMockHook({
      content: [
        {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video',
          content: '',
        },
      ],
    });
    render(<CourseContentEditor />);
    fireEvent.click(screen.getByTestId('edit-button-0'));
    expect(screen.getByTestId('mock-content-item-form')).toBeInTheDocument();
    expect(screen.getByText('IsEditing: true')).toBeInTheDocument();
    expect(screen.getByText('Title: Test Video')).toBeInTheDocument();
  });

  test('deletes content item when delete button is clicked', () => {
    const setContentMock = jest.fn();
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [
        {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video',
          content: '',
        },
      ],
      setContent: setContentMock,
      loading: false,
      error: '',
      setError: jest.fn(),
      savingContent: false,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);
    fireEvent.click(screen.getByTestId('delete-button-0'));
    expect(setContentMock).toHaveBeenCalledWith([]);
  });

  test('saves content item when form is submitted', () => {
    const setContentMock = jest.fn();
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [],
      setContent: setContentMock,
      loading: false,
      error: '',
      setError: jest.fn(),
      savingContent: false,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    // Open the form
    fireEvent.click(screen.getByTestId('add-content-button'));

    // Fill in the form
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'New Video Item' },
    });

    fireEvent.change(screen.getByTestId('video-url-input'), {
      target: { value: 'https://example.com/new-video' },
    });

    // Save the form
    fireEvent.click(screen.getByTestId('save-button'));

    // Check that setContent was called with the new item
    expect(setContentMock).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'New Video Item',
        videoUrl: 'https://example.com/new-video',
        type: 'video',
      }),
    ]);
  });

  test('validates item before saving', () => {
    const setErrorMock = jest.fn();
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: setErrorMock,
      savingContent: false,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    // Open the form
    fireEvent.click(screen.getByTestId('add-content-button'));

    // Don't fill in the title

    // Save the form
    fireEvent.click(screen.getByTestId('save-button'));

    // Error should be set
    expect(setErrorMock).toHaveBeenCalledWith('Title is required');
  });

  test('validates video URL for video items', () => {
    const setErrorMock = jest.fn();
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: setErrorMock,
      savingContent: false,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    // Open the form
    fireEvent.click(screen.getByTestId('add-content-button'));

    // Fill in the title but not the video URL
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'New Video Item' },
    });

    // Save the form
    fireEvent.click(screen.getByTestId('save-button'));

    // Error should be set
    expect(setErrorMock).toHaveBeenCalledWith('Video URL is required');
  });

  test('validates content for markdown items', () => {
    const setErrorMock = jest.fn();
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: setErrorMock,
      savingContent: false,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    // Open the form
    fireEvent.click(screen.getByTestId('add-content-button'));

    // Fill in the title but not the content
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'New Markdown Item' },
    });

    // Change the type to markdown
    fireEvent.change(screen.getByTestId('type-select'), {
      target: { value: 'markdown' },
    });

    // Save the form
    fireEvent.click(screen.getByTestId('save-button'));

    // Error should be set
    expect(setErrorMock).toHaveBeenCalledWith(
      'Content is required for markdown items',
    );
  });

  test('saves course content when save content button is clicked', async () => {
    const saveContentMock = jest.fn().mockResolvedValue(true);
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [
        {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video',
          content: '',
        },
      ],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: jest.fn(),
      savingContent: false,
      publishing: false,
      saveContent: saveContentMock,
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    const saveButton = screen.getByText('Save Content');
    fireEvent.click(saveButton);

    expect(saveContentMock).toHaveBeenCalled();
  });

  test('handles saving content in progress state', () => {
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [
        {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video',
          content: '',
        },
      ],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: jest.fn(),
      savingContent: true,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    // Save button should contain a progress indicator
    expect(screen.getAllByRole('progressbar')[0]).toBeInTheDocument();
  });

  test('publishes course when publish button is clicked', () => {
    const publishCourseMock = jest.fn();
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [
        {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video',
          content: '',
        },
      ],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: jest.fn(),
      savingContent: false,
      publishing: false,
      saveContent: jest.fn(),
      publishCourse: publishCourseMock,
    });

    render(<CourseContentEditor />);

    const publishButton = screen.getByText('Publish Course');
    fireEvent.click(publishButton);

    expect(publishCourseMock).toHaveBeenCalled();
  });

  test('handles publishing in progress state', () => {
    useCourseContent.mockReturnValue({
      course: { _id: '123', title: 'Test Course' },
      content: [
        {
          type: 'video',
          title: 'Test Video',
          videoUrl: 'https://example.com/video',
          content: '',
        },
      ],
      setContent: jest.fn(),
      loading: false,
      error: '',
      setError: jest.fn(),
      savingContent: false,
      publishing: true,
      saveContent: jest.fn(),
      publishCourse: jest.fn(),
    });

    render(<CourseContentEditor />);

    // Publish button should contain a progress indicator
    expect(screen.getAllByRole('progressbar')[0]).toBeInTheDocument();
  });

  test('edit form loads with the correct existing content data', () => {
    setupMockHook({
      content: [
        {
          type: 'markdown',
          title: 'Test Markdown',
          videoUrl: '',
          content: 'Some markdown content',
        },
      ],
    });

    render(<CourseContentEditor />);
    fireEvent.click(screen.getByTestId('edit-button-0'));

    expect(screen.getByText('Type: markdown')).toBeInTheDocument();
    expect(screen.getByText('Title: Test Markdown')).toBeInTheDocument();
    expect(
      screen.getByText('Content: Some markdown content'),
    ).toBeInTheDocument();
  });
});
