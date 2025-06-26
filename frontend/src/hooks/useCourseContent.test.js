import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import useCourseContent from './useCourseContent';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(), // Mock useNavigate
}));

// Mock axiosInstance
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
}));

describe('useCourseContent Hook', () => {
  let mockNavigate;

  beforeEach(() => {
    // Reset mocks before each test
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    axiosInstance.get.mockReset();
    axiosInstance.put.mockReset();
    axiosInstance.patch.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test
  });

  // Test case 1: Initial state and fetching course data
  test('should initialize with correct state and fetch course data', async () => {
    const mockCourseData = {
      _id: 'course123',
      title: 'Test Course',
      content: [{ _id: 'content1', title: 'Content 1' }],
    };

    // Mock the content endpoints that the hook actually calls
    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: mockCourseData });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: [] }); // Start with empty content list
      }
      return Promise.reject(new Error('Not found'));
    });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Check initial state
    expect(result.current.course).toBeNull();
    expect(result.current.content).toEqual([]);
    expect(result.current.loading).toBe(true); // Should be true initially
    expect(result.current.error).toBe('');

    // Wait for API call and state update
    await act(async () => {
      await Promise.resolve();
    });

    // Check state after fetching data - content starts empty, not from course.content
    expect(result.current.loading).toBe(false);
    expect(result.current.course).toEqual(mockCourseData);
    expect(result.current.content).toEqual([]); // Content is fetched separately and starts empty
    expect(axiosInstance.get).toHaveBeenCalledWith('/api/courses/course123');
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/api/courses/course123/content',
    );
  });

  // Test case 2: Handling error when fetching course data
  test('should handle errors when fetching course data', async () => {
    axiosInstance.get.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for API call and state update
    await act(async () => {
      await Promise.resolve();
    });

    // Check state after error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load course: Failed to fetch');
  });

  // Test case 3: Saving course content successfully
  test('should save course content successfully', async () => {
    const initialContent = [{ _id: 'content1', title: 'Content 1' }];
    axiosInstance.get.mockResolvedValue({
      data: { _id: 'course123', content: initialContent },
    });
    axiosInstance.put.mockResolvedValue({ data: { success: true } }); // Mock PUT request

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Update content and save
    const newContent = [
      ...initialContent,
      { title: 'New Content', type: 'text', content: 'Details' },
    ];
    act(() => {
      result.current.setContent(newContent);
    });

    await act(async () => {
      await result.current.saveContent();
    });

    // Check state after saving
    expect(result.current.savingContent).toBe(false);
    expect(result.current.error).toBe(''); // No error
    expect(axiosInstance.put).toHaveBeenCalledWith(
      '/api/courses/course123/content',
      { content: expect.any(Array) }, // Check that content is passed
    );
  });

  // Test case 4: Handling error when saving course content
  test('should handle errors when saving course content', async () => {
    const mockContentList = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: mockContentList });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: mockContentList[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.put.mockRejectedValue(new Error('Save failed')); // Mock failed PUT

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for initial fetch and content loading
    await act(async () => {
      await Promise.resolve();
    });

    // Attempt to save
    await act(async () => {
      await result.current.saveContent();
    });

    // Check state after error
    expect(result.current.savingContent).toBe(false);
    expect(result.current.error).toBe(
      'Failed to save course content: Save failed',
    );
  });

  // Test case 5: Publishing a course successfully
  test('should publish a course successfully', async () => {
    const courseContent = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: courseContent });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: courseContent[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.put.mockResolvedValue({ data: { success: true } }); // For saving before publish
    axiosInstance.patch.mockResolvedValue({ data: { success: true } }); // For publishing

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for initial fetch and content loading
    await act(async () => {
      await Promise.resolve();
    });

    // Publish the course
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check state and navigation
    expect(result.current.publishing).toBe(true); // Publishing state doesn't reset on success (hook behavior)
    expect(mockNavigate).toHaveBeenCalledWith('/courses/course123'); // Navigation
    expect(axiosInstance.patch).toHaveBeenCalledWith(
      '/api/courses/course123/publish',
      { status: 'published', content: expect.any(Array) }, // Check payload
    );
  });

  // Test case 6: Handling error when publishing a course
  test('should handle errors when publishing a course', async () => {
    const courseContent = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: courseContent });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: courseContent[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.put.mockResolvedValue({ data: { success: true } }); // For saving before publish
    axiosInstance.patch.mockRejectedValue(new Error('Publish failed')); // Mock failed PATCH

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for initial fetch and content loading
    await act(async () => {
      await Promise.resolve();
    });

    // Attempt to publish
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check state after error
    expect(result.current.publishing).toBe(false);
    expect(result.current.error).toBe(
      'Failed to publish course: Publish failed',
    );
  });

  // Test case 7: Invalid course ID handling
  test('should handle invalid course ID during fetch', async () => {
    const { result } = renderHook(() => useCourseContent(undefined)); // Pass undefined ID

    // Wait for effect to run
    await act(async () => {
      await Promise.resolve();
    });

    // Check state for invalid ID
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'Invalid course ID. Please try creating the course again.',
    );
    expect(axiosInstance.get).not.toHaveBeenCalled(); // Should not call API
  });

  // Test case 8: Error when saving content with empty array
  test('should set error if trying to save empty content', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { _id: 'course123', content: [] }, // Start with empty content
    });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Mock querySelector for error visibility check
    document.querySelector = jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
    });

    // Attempt to save empty content
    await act(async () => {
      await result.current.saveContent();
    });

    // Check error state
    expect(result.current.error).toBe('Please add at least one content item');
    expect(axiosInstance.put).not.toHaveBeenCalled(); // PUT should not be called
  });

  // Test case 9: Error when publishing with empty content
  test('should set error if trying to publish empty content', async () => {
    axiosInstance.get.mockResolvedValue({
      data: { _id: 'course123', content: [] }, // Start with empty content
    });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Mock querySelector for error visibility check
    document.querySelector = jest.fn().mockReturnValue({
      setAttribute: jest.fn(),
    });

    // Attempt to publish empty content
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check error state
    expect(result.current.error).toBe('Please add content before publishing');
    expect(axiosInstance.patch).not.toHaveBeenCalled(); // PATCH should not be called
  });

  // Test case 10: Handling 404 error when fetching course
  test('should handle 404 error when fetching course', async () => {
    axiosInstance.get.mockRejectedValue({ response: { status: 404 } });

    const { result } = renderHook(() => useCourseContent('nonexistent-course'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Course not found');
  });

  // Test case 11: Handling 403 error when fetching course
  test('should handle 403 error when fetching course', async () => {
    axiosInstance.get.mockRejectedValue({ response: { status: 403 } });

    const { result } = renderHook(() => useCourseContent('forbidden-course'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(
      'You do not have permission to edit this course',
    );
  });

  // Test case 12: Handling 403 error when saving content
  test('should handle 403 error when saving content', async () => {
    const courseContent = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: courseContent });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: courseContent[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.put.mockRejectedValue({ response: { status: 403 } });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for content to be loaded
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    await act(async () => {
      await result.current.saveContent(); // Attempt save
    });

    expect(result.current.savingContent).toBe(false);
    expect(result.current.error).toBe(
      'Access denied. Only instructors can edit courses.',
    );
  });

  // Test case 13: Handling 403 error when publishing course
  test('should handle 403 error when publishing course', async () => {
    const courseContent = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: courseContent });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: courseContent[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.patch.mockRejectedValue({ response: { status: 403 } });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for content to be loaded
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    await act(async () => {
      await result.current.publishCourse(); // Attempt publish
    });

    expect(result.current.publishing).toBe(false);
    expect(result.current.error).toBe(
      'Access denied. Only instructors can publish courses.',
    );
  });

  // Test case 14: Handling specific backend error message on save
  test('should display specific backend error message on save failure', async () => {
    const errorMessage = 'Backend validation failed';
    const courseContent = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: courseContent });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: courseContent[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.put.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for content to be loaded
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    await act(async () => {
      await result.current.saveContent();
    });

    expect(result.current.error).toBe(`Failed to save: ${errorMessage}`);
  });

  // Test case 15: Handling specific backend error message on publish
  test('should display specific backend error message on publish failure', async () => {
    const errorMessage = 'Publishing prerequisites not met';
    const courseContent = [
      {
        _id: 'content1',
        title: 'Content 1',
        type: 'markdown',
        content: 'Test content',
      },
    ];

    axiosInstance.get.mockImplementation((url) => {
      if (url === '/api/courses/course123') {
        return Promise.resolve({ data: { _id: 'course123' } });
      }
      if (url === '/api/courses/course123/content') {
        return Promise.resolve({ data: courseContent });
      }
      if (url === '/api/courses/course123/content/content1') {
        return Promise.resolve({ data: courseContent[0] });
      }
      return Promise.reject(new Error('Not found'));
    });

    axiosInstance.patch.mockRejectedValue({
      response: { status: 400, data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useCourseContent('course123'));

    // Wait for content to be loaded
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    });

    await act(async () => {
      await result.current.publishCourse();
    });

    expect(result.current.error).toBe(`Failed to publish: ${errorMessage}`);
  });
});
