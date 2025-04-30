import { renderHook, act } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import useCourseProgress from './useCourseProgress';
import axiosInstance from '../utils/axiosConfig';

// Mock axios instance
jest.mock('../utils/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('useCourseProgress Hook', () => {
  const mockCourseId = 'course-123';
  const mockContentId = 'content-456';
  const mockProgress = [
    { contentId: 'content-123', completed: true },
    { contentId: 'content-789', completed: true },
  ];

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
  });

  it('should fetch progress data on init', async () => {
    // Set up the mock
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgress });

    // Render the hook
    const { result } = renderHook(() => useCourseProgress(mockCourseId));

    // Initially progress should be empty
    expect(result.current.progress).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for the effect to run and state to update
    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    // Verify API was called correctly
    expect(axiosInstance.get).toHaveBeenCalledWith(
      `/api/progress/${mockCourseId}`,
    );
  });

  it('should handle errors when fetching progress', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    axiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

    const { result } = renderHook(() => useCourseProgress(mockCourseId));

    // Wait for the error to be processed
    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load progress data');
    });

    // Check that error handling is correct
    expect(result.current.progress).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should mark an item as completed', async () => {
    // Set up mocks
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgress });
    axiosInstance.post.mockResolvedValueOnce({});

    // Render the hook with both courseId and contentId
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockContentId),
    );

    // Wait for the initial data to load
    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    // Before marking as completed
    expect(result.current.completing).toBe(false);

    // Mark item as completed
    let success;
    await act(async () => {
      success = await result.current.markContentCompleted();
    });

    // Verify success
    expect(success).toBe(true);

    // Check if API was called correctly
    expect(axiosInstance.post).toHaveBeenCalledWith(
      `/api/progress/${mockCourseId}/${mockContentId}`,
      { completed: true },
    );

    // Check if the item was added to progress
    expect(
      result.current.progress.some(
        (item) => item.contentId === mockContentId && item.completed,
      ),
    ).toBe(true);
  });

  it('should check if an item is completed', async () => {
    // Set up mock
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgress });

    // Render the hook with the content that exists in the progress data
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, 'content-123'),
    );

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    // Check completion status - should be true for existing item
    expect(result.current.isContentCompleted()).toBe(true);

    // Reset mocks and render with different content ID
    axiosInstance.get.mockReset();
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgress });

    const { result: result2 } = renderHook(() =>
      useCourseProgress(mockCourseId, 'content-999'),
    );

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result2.current.progress).toEqual(mockProgress);
    });

    // Should be false for non-existent item
    expect(result2.current.isContentCompleted()).toBe(false);
  });

  it('should not fetch progress when courseId is missing', () => {
    // Render hook without courseId
    renderHook(() => useCourseProgress());

    // Get should not be called
    expect(axiosInstance.get).not.toHaveBeenCalled();
  });

  it('should handle errors when marking content as completed', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Set up mocks
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgress });
    axiosInstance.post.mockRejectedValueOnce(new Error('Failed to update'));

    // Render the hook
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockContentId),
    );

    // Wait for initial data to be loaded
    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    // Try to mark as completed
    let success;
    await act(async () => {
      success = await result.current.markContentCompleted();
    });

    // Should handle error properly
    expect(success).toBe(false);
    expect(result.current.error).toBe('Failed to mark content as completed');
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should not try to mark content as completed when ids are missing', async () => {
    // Render hook without contentId
    const { result } = renderHook(() => useCourseProgress(mockCourseId));

    // Try to mark as completed
    await act(async () => {
      await result.current.markContentCompleted();
    });

    // Post should not be called
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });
});
