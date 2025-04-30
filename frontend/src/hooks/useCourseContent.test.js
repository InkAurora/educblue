import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import useCourseContent from './useCourseContent';
import axiosInstance from '../utils/axiosConfig';

// Mock axios and useNavigate
const mockNavigate = jest.fn();
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('useCourseContent Hook', () => {
  const mockCourseId = 'course-123';
  const mockCourse = {
    _id: mockCourseId,
    title: 'Test Course',
    description: 'Test Description',
    content: [
      {
        id: 'content-1',
        title: 'Test Content 1',
        type: 'markdown',
        content: '# Test',
      },
      {
        id: 'content-2',
        title: 'Test Content 2',
        type: 'video',
        content: 'https://example.com/video.mp4',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mocks before each test
    document.body.innerHTML = '<div></div>';
  });

  it('should fetch course data on init', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Initially loading should be true and course null
    expect(result.current.loading).toBe(true);
    expect(result.current.course).toBeNull();

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Now data should be loaded
    expect(result.current.course).toEqual(mockCourse);
    expect(result.current.content).toEqual(mockCourse.content);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      `/api/courses/${mockCourseId}`,
    );
  });

  it('should handle errors when fetching course', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    axiosInstance.get.mockRejectedValueOnce({
      response: { status: 404, data: { message: 'Course not found' } },
    });

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for the error to be processed
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check that error handling is correct
    expect(result.current.course).toBeNull();
    expect(result.current.error).toBe('Course not found');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle invalid course ID', async () => {
    const { result } = renderHook(() => useCourseContent('undefined'));

    // Wait for the validation to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      'Invalid course ID. Please try creating the course again.',
    );
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('should save content successfully', async () => {
    // Mock the course fetch
    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });
    axiosInstance.put.mockResolvedValueOnce({});

    // Create an error alert element that might be required by the code
    const errorAlert = document.createElement('div');
    errorAlert.setAttribute('data-testid', 'error-alert');
    document.body.appendChild(errorAlert);

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Set new content
    act(() => {
      result.current.setContent(mockCourse.content);
    });

    // Save content
    let success;
    await act(async () => {
      success = await result.current.saveContent();
    });

    // Check if content was saved
    expect(success).toBe(true);
    expect(axiosInstance.put).toHaveBeenCalledWith(
      `/api/courses/${mockCourseId}/content`,
      { content: mockCourse.content },
    );
    expect(result.current.savingContent).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should show error if trying to save empty content', async () => {
    // Mock the course fetch
    axiosInstance.get.mockResolvedValueOnce({
      data: { ...mockCourse, content: [] },
    });

    // Create an error alert element
    const errorAlert = document.createElement('div');
    errorAlert.setAttribute('data-testid', 'error-alert');
    document.body.appendChild(errorAlert);

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Set empty content
    act(() => {
      result.current.setContent([]);
    });

    // Try to save empty content
    let success;
    await act(async () => {
      success = await result.current.saveContent();
    });

    // Should show an error message
    expect(result.current.error).toBe('Please add at least one content item');
    expect(axiosInstance.put).not.toHaveBeenCalled();
  });

  it('should publish course successfully', async () => {
    // Mock the course fetch and API calls
    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });
    axiosInstance.put.mockResolvedValueOnce({});
    axiosInstance.patch.mockResolvedValueOnce({});

    // Spy on console.log
    const consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {});

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Publish course
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check that publish request was made correctly
    expect(axiosInstance.put).toHaveBeenCalledWith(
      `/api/courses/${mockCourseId}/content`,
      { content: mockCourse.content },
    );

    expect(axiosInstance.patch).toHaveBeenCalledWith(
      `/api/courses/${mockCourseId}/publish`,
      {
        status: 'published',
        content: mockCourse.content,
      },
    );

    // Check that navigation was called
    expect(mockNavigate).toHaveBeenCalledWith(`/courses/${mockCourseId}`);
    expect(consoleLogSpy).toHaveBeenCalledWith('Course published successfully');

    consoleLogSpy.mockRestore();
  });

  it('should show error if trying to publish empty content', async () => {
    // Mock the course fetch with empty content
    axiosInstance.get.mockResolvedValueOnce({
      data: { ...mockCourse, content: [] },
    });

    // Create an error alert element
    const errorAlert = document.createElement('div');
    errorAlert.setAttribute('data-testid', 'error-alert');
    document.body.appendChild(errorAlert);

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Set empty content
    act(() => {
      result.current.setContent([]);
    });

    // Try to publish with empty content
    await act(async () => {
      await result.current.publishCourse();
    });

    // Should show an error message
    expect(result.current.error).toBe('Please add content before publishing');
    expect(axiosInstance.patch).not.toHaveBeenCalled();
  });

  it('should handle save content errors', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });
    axiosInstance.put.mockRejectedValueOnce({
      response: { status: 403 },
    });

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to save content
    let success;
    await act(async () => {
      success = await result.current.saveContent();
    });

    // Check if error was handled properly
    expect(success).toBe(false);
    expect(result.current.error).toBe(
      'Access denied. Only instructors can edit courses.',
    );
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle publish course errors with 403 status', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });
    axiosInstance.put.mockResolvedValueOnce({});
    axiosInstance.patch.mockRejectedValueOnce({
      response: {
        status: 403,
        data: { message: 'Only instructors can publish courses' },
      },
    });

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to publish course
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check if error was handled properly
    expect(result.current.error).toBe(
      'Access denied. Only instructors can publish courses.',
    );
    expect(result.current.publishing).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle publish course errors with 400 status', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });
    axiosInstance.put.mockResolvedValueOnce({});
    axiosInstance.patch.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: 'Content validation failed' },
      },
    });

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to publish course
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check if error was handled properly
    expect(result.current.error).toBe(
      'Failed to publish: Content validation failed',
    );
    expect(result.current.publishing).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle publish course errors with network error', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    axiosInstance.get.mockResolvedValueOnce({ data: mockCourse });
    axiosInstance.put.mockResolvedValueOnce({});
    axiosInstance.patch.mockRejectedValueOnce(
      new Error('Network error during publishing'),
    );

    const { result } = renderHook(() => useCourseContent(mockCourseId));

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to publish course
    await act(async () => {
      await result.current.publishCourse();
    });

    // Check if error was handled properly
    expect(result.current.error).toBe(
      'Failed to publish course: Network error during publishing',
    );
    expect(result.current.publishing).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
