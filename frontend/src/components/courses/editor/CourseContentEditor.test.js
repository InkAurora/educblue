import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseContentEditor from './CourseContentEditor';
import axiosInstance from '../../../utils/axiosConfig';

// Mock axios
jest.mock('../../../utils/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

// Mock the child components to focus on testing just this component
jest.mock(
  './ContentItemList',
  () =>
    function ({ content, onEdit, onDelete, onAdd }) {
      return (
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
      );
    },
);

jest.mock(
  './ContentItemForm',
  () =>
    function ({
      open,
      onClose,
      currentItem,
      setCurrentItem,
      onSave,
      error,
      isEditing,
    }) {
      return open ? (
        <div data-testid='mock-content-item-form'>
          <div>Type: {currentItem.type}</div>
          <div>Title: {currentItem.title}</div>
          <div>VideoURL: {currentItem.videoUrl}</div>
          <div>Content: {currentItem.content}</div>
          <div>IsEditing: {isEditing.toString()}</div>
          {currentItem.options && (
            <div>
              Options: {JSON.stringify(currentItem.options)}
              CorrectOption: {currentItem.correctOption}
            </div>
          )}
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
            <option value='multipleChoice'>Multiple Choice</option>
          </select>
          {currentItem.type === 'multipleChoice' && (
            <div data-testid='multiple-choice-inputs'>
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  data-testid={`option-input-${index}`}
                  value={currentItem.options?.[index] || ''}
                  onChange={(e) => {
                    const newOptions = [
                      ...(currentItem.options || ['', '', '', '']),
                    ];
                    newOptions[index] = e.target.value;
                    setCurrentItem({ ...currentItem, options: newOptions });
                  }}
                  placeholder={`Option ${index + 1}`}
                />
              ))}
              <select
                data-testid='correct-option-select'
                value={currentItem.correctOption || 0}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    correctOption: parseInt(e.target.value, 10),
                  })
                }
              >
                <option value={0}>Option 1</option>
                <option value={1}>Option 2</option>
                <option value={2}>Option 3</option>
                <option value={3}>Option 4</option>
              </select>
            </div>
          )}
          <button data-testid='cancel-button' onClick={onClose}>
            Cancel
          </button>
          <button data-testid='save-button' onClick={onSave}>
            Save
          </button>
        </div>
      ) : null;
    },
);

// Mock useParams
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: '123' }),
}));

// Mock SimpleMDE
jest.mock('react-simplemde-editor', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea
      data-testid='simplemde-editor'
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock markdownUtils
jest.mock('../../../utils/markdownUtils', () => ({
  convertMarkdownToHTML: (text) => `<div>${text}</div>`,
}));

const mockAxios = axiosInstance;

describe('CourseContentEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up comprehensive mocks that prevent component crash
    mockAxios.get.mockImplementation((url) => {
      if (url.includes('/courses/123/sections/') && url.includes('/content')) {
        // Mock section content endpoint
        return Promise.resolve({
          data: { content: [] },
        });
      }
      if (url.includes('/courses/123/sections/')) {
        // Mock individual section endpoint (used by fetchSectionContent)
        return Promise.resolve({
          data: { content: [] },
        });
      }
      if (url.includes('/courses/123/sections')) {
        // Mock sections endpoint
        return Promise.resolve({
          data: [{ id: 'section1', title: 'Section 1' }], // Return array directly
        });
      }
      if (url.includes('/courses/123')) {
        // Mock course endpoint
        return Promise.resolve({
          data: { _id: '123', title: 'Test Course', status: 'draft' },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    mockAxios.post.mockResolvedValue({
      data: { content: { _id: 'new-id', title: 'New Item', type: 'video' } },
    });

    mockAxios.put.mockResolvedValue({
      data: {
        content: { _id: 'updated-id', title: 'Updated Item', type: 'video' },
      },
    });

    mockAxios.patch.mockResolvedValue({ data: {} });
    mockAxios.delete.mockResolvedValue({ data: {} });
  });

  test('renders loading spinner when loading', async () => {
    // Mock delayed response to see loading state
    mockAxios.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: { _id: '123', title: 'Test Course' },
            });
          }, 100);
        }),
    );

    render(<CourseContentEditor />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders course title when loaded', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText('Test Course')).toBeInTheDocument();
    });
  });

  test('renders error alert when API call fails', async () => {
    mockAxios.get.mockImplementation((url) => {
      if (url.includes('/courses/123')) {
        return Promise.reject(new Error('Failed to load'));
      }
      return Promise.resolve({ data: [] });
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load course/i)).toBeInTheDocument();
    });
  });
  test('displays section selection when sections are loaded', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      // Check that the section control exists and has the right role
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveTextContent('Section 1');
    });
  });

  test('shows add section button', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      const addButton = screen.getByTitle(/Add New Section/i);
      expect(addButton).toBeInTheDocument();
    });
  });

  test('opens content form when add content is clicked', async () => {
    render(<CourseContentEditor />);

    // Wait for section to be selected automatically
    await waitFor(() => {
      expect(screen.getByTestId('add-content-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-content-button'));

    await waitFor(() => {
      expect(screen.getByTestId('mock-content-item-form')).toBeInTheDocument();
      expect(screen.getByText('IsEditing: false')).toBeInTheDocument();
    });
  });

  test('validates title is required when saving content', async () => {
    render(<CourseContentEditor />);

    // Wait for section to load
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('add-content-button'));
    });

    // Try to save without title
    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent(
        'Title is required',
      );
    });
  });

  test('validates video URL for video items', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('add-content-button'));
    });

    // Fill title but not video URL for video type
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Test Video' },
    });

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent(
        'Video URL is required',
      );
    });
  });

  test('validates content for markdown items', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('add-content-button'));
    });

    // Change type to markdown
    fireEvent.change(screen.getByTestId('type-select'), {
      target: { value: 'markdown' },
    });

    // Fill title but not content
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Test Markdown' },
    });

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent(
        'Content is required for markdown items',
      );
    });
  });

  test('validates multiple-choice quiz requires question', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('add-content-button'));
    });

    // Change type to multiple choice
    fireEvent.change(screen.getByTestId('type-select'), {
      target: { value: 'multipleChoice' },
    });

    // Fill title but not question content
    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Test Quiz' },
    });

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent(
        'Question is required for multiple-choice quiz',
      );
    });
  });

  test('validates multiple-choice quiz options', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      fireEvent.click(screen.getByTestId('add-content-button'));
    });

    // Change type to multiple choice
    fireEvent.change(screen.getByTestId('type-select'), {
      target: { value: 'multipleChoice' },
    });

    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Test Quiz' },
    });

    fireEvent.change(screen.getByTestId('content-textarea'), {
      target: { value: 'What is 2+2?' },
    });

    // Fill only 3 options (leave one empty)
    fireEvent.change(screen.getByTestId('option-input-0'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByTestId('option-input-1'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('option-input-2'), {
      target: { value: '5' },
    });
    // option-input-3 left empty

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent(
        'All multiple-choice options must have content',
      );
    });
  });

  test('saves valid multiple-choice quiz', async () => {
    render(<CourseContentEditor />);

    // Wait for component to load and select section automatically
    await waitFor(() => {
      fireEvent.click(screen.getByTestId('add-content-button'));
    });

    // Fill all required fields for multiple choice
    fireEvent.change(screen.getByTestId('type-select'), {
      target: { value: 'multipleChoice' },
    });

    fireEvent.change(screen.getByTestId('title-input'), {
      target: { value: 'Math Quiz' },
    });

    fireEvent.change(screen.getByTestId('content-textarea'), {
      target: { value: 'What is 2+2?' },
    });

    // Fill all 4 options
    fireEvent.change(screen.getByTestId('option-input-0'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByTestId('option-input-1'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('option-input-2'), {
      target: { value: '5' },
    });
    fireEvent.change(screen.getByTestId('option-input-3'), {
      target: { value: '6' },
    });

    fireEvent.change(screen.getByTestId('correct-option-select'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/courses/123/sections/section1/content',
        expect.objectContaining({
          type: 'multipleChoice',
          title: 'Math Quiz',
          question: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correctOption: 1,
        }),
      );
    });
  });
  test('publishes course when publish button is clicked', async () => {
    // Mock course with content so publish button is enabled
    mockAxios.get.mockImplementation((url) => {
      if (url === '/api/courses/123') {
        return Promise.resolve({
          data: { title: 'Test Course', status: 'draft' },
        });
      }
      if (url === '/api/courses/123/sections') {
        return Promise.resolve({
          data: [{ id: 'section1', title: 'Section 1' }], // Direct array, not wrapped
        });
      }
      if (url === '/api/courses/123/sections/section1') {
        // This is the endpoint that fetchSectionContent calls
        return Promise.resolve({
          data: {
            content: [
              {
                _id: 'item1',
                title: 'Existing Video',
                type: 'video',
                videoUrl: 'http://example.com',
              },
            ],
          },
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<CourseContentEditor />);

    await waitFor(() => {
      const publishButton = screen.getByText(/Publish Course/i);
      expect(publishButton).not.toBeDisabled();
      fireEvent.click(publishButton);
    });

    await waitFor(() => {
      expect(mockAxios.patch).toHaveBeenCalledWith('/api/courses/123/publish');
    });
  });

  test('prevents publishing when no content exists', async () => {
    render(<CourseContentEditor />);

    await waitFor(() => {
      const publishButton = screen.getByText(/Publish Course/i);
      expect(publishButton).toBeDisabled();
    });
  });

  test('handles edit existing content item', async () => {
    // Mock section with existing content
    mockAxios.get.mockImplementation((url) => {
      if (url.includes('/courses/123/sections/section1')) {
        return Promise.resolve({
          data: {
            content: [
              {
                _id: 'item1',
                title: 'Existing Video',
                type: 'video',
                videoUrl: 'http://example.com',
              },
            ],
          },
        });
      }
      if (url.includes('/courses/123/sections')) {
        return Promise.resolve({
          data: [{ id: 'section1', title: 'Section 1' }],
        });
      }
      if (url.includes('/courses/123')) {
        return Promise.resolve({
          data: { _id: '123', title: 'Test Course', status: 'draft' },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<CourseContentEditor />);

    // Wait for content to load
    await waitFor(() => {
      const editButton = screen.getByTestId('edit-button-0');
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-content-item-form')).toBeInTheDocument();
      expect(screen.getByText('IsEditing: true')).toBeInTheDocument();
      expect(screen.getByText('Title: Existing Video')).toBeInTheDocument();
    });
  });

  test('handles delete content item with confirmation', async () => {
    // Mock section with existing content
    mockAxios.get.mockImplementation((url) => {
      if (url.includes('/courses/123/sections/section1')) {
        return Promise.resolve({
          data: {
            content: [{ _id: 'item1', title: 'Item to Delete', type: 'video' }],
          },
        });
      }
      if (url.includes('/courses/123/sections')) {
        return Promise.resolve({
          data: [{ id: 'section1', title: 'Section 1' }],
        });
      }
      if (url.includes('/courses/123')) {
        return Promise.resolve({
          data: { _id: '123', title: 'Test Course', status: 'draft' },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<CourseContentEditor />);

    // Wait for content to load and click delete
    await waitFor(() => {
      const deleteButton = screen.getByTestId('delete-button-0');
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Are you sure you want to delete/i),
      ).toBeInTheDocument();
    });

    // Confirm deletion - use the dialog's delete button specifically
    const confirmButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAxios.delete).toHaveBeenCalledWith(
        '/api/courses/123/sections/section1/content/item1',
      );
    });
  });
});
