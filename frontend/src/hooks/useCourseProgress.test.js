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
  const mockSectionId = 'section-456';
  const mockContentId = 'content-789';
  const mockProgress = [
    { contentId: 'content-123', completed: true },
    { contentId: 'content-789', completed: true },
  ];

  // Mock response with new API format
  const mockProgressResponse = {
    progressRecords: mockProgress,
    progressPercentage: 75,
  };

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
  });

  it('should fetch progress data on init', async () => {
    // Set up the mock with new API format
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    // Render the hook
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId),
    );

    // Initially progress should be empty
    expect(result.current.progress).toEqual([]);
    expect(result.current.progressPercentage).toBe(0);
    expect(result.current.error).toBeNull();

    // Wait for the effect to run and state to update
    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
      expect(result.current.progressPercentage).toBe(75);
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

    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId),
    );

    // Wait for the error to be processed
    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load progress data');
    });

    // Check that error handling is correct
    expect(result.current.progress).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should mark an item as completed with valid contentId', async () => {
    // Use a non-numeric contentId to avoid course details fetch
    const validContentId = 'content-abc-123';

    // Set up mocks for progress fetch
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    // Mock the mark completed API call with new response format
    axiosInstance.post.mockResolvedValueOnce({
      data: {
        progressRecords: [
          ...mockProgress,
          { contentId: validContentId, completed: true },
        ],
        progressPercentage: 80,
      },
    });

    // Mock the refresh progress fetch after marking complete
    axiosInstance.get.mockResolvedValueOnce({
      data: {
        progressRecords: [
          ...mockProgress,
          { contentId: validContentId, completed: true },
        ],
        progressPercentage: 80,
      },
    });

    // Render the hook with valid contentId
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId, validContentId),
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
      `/api/progress/${mockCourseId}/${mockSectionId}/${validContentId}`,
      { completed: true },
    );

    // Check if the progress was updated
    await waitFor(() => {
      expect(result.current.progressPercentage).toBe(80);
    });
  });

  it('should check if an item is completed', async () => {
    // Set up mock with new API format
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    // Render the hook with the content that exists in the progress data
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId, 'content-123'),
    );

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    // Check completion status - should be true for existing item
    expect(result.current.isContentCompleted()).toBe(true);

    // Reset mocks and render with different content ID
    axiosInstance.get.mockReset();
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    const { result: result2 } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId, 'content-999'),
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

    // Use a non-numeric contentId to avoid course details fetch
    const validContentId = 'content-abc-123';

    // Set up mocks for progress fetch
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    // Mock failed post request
    axiosInstance.post.mockRejectedValueOnce(new Error('Failed to update'));

    // Render the hook
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId, validContentId),
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
    // Render hook without contentId (and sectionId)
    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId),
    );

    // Try to mark as completed
    await act(async () => {
      await result.current.markContentCompleted();
    });

    // Post should not be called
    expect(axiosInstance.post).not.toHaveBeenCalled();
  });

  it('should handle 404 error when fetching progress', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock 404 error response
    const error404 = new Error('Not found');
    error404.response = { status: 404 };
    axiosInstance.get.mockRejectedValueOnce(error404);

    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId),
    );

    // Wait for the error to be processed
    await waitFor(() => {
      expect(result.current.progress).toEqual([]);
      expect(result.current.progressPercentage).toBe(0);
      expect(result.current.error).toBeNull(); // 404 is not treated as error
    });

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('should handle 400 error with specific message when marking content as completed', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const validContentId = 'content-abc-123';
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    // Mock 400 error with specific message
    const error400 = new Error('Bad request');
    error400.response = {
      status: 400,
      data: { message: 'Invalid content ID format' },
    };
    axiosInstance.post.mockRejectedValueOnce(error400);

    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId, validContentId),
    );

    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    let success;
    await act(async () => {
      success = await result.current.markContentCompleted();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe(
      'The system could not process this content for progress tracking.',
    );

    consoleErrorSpy.mockRestore();
  });

  it('should use refreshProgress function correctly', async () => {
    axiosInstance.get.mockResolvedValueOnce({ data: mockProgressResponse });

    const { result } = renderHook(() =>
      useCourseProgress(mockCourseId, mockSectionId),
    );

    await waitFor(() => {
      expect(result.current.progress).toEqual(mockProgress);
    });

    // Mock another response for refresh
    const refreshedData = {
      progressRecords: [
        ...mockProgress,
        { contentId: 'new-content', completed: true },
      ],
      progressPercentage: 90,
    };
    axiosInstance.get.mockResolvedValueOnce({ data: refreshedData });

    // Call refresh
    let refreshResult;
    await act(async () => {
      refreshResult = await result.current.refreshProgress();
    });

    expect(refreshResult.records).toEqual(refreshedData.progressRecords);
    expect(refreshResult.percentage).toBe(90);
    expect(result.current.progressPercentage).toBe(90);
  });
});
