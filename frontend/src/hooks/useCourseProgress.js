import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../utils/axiosConfig';

/**
 * Custom hook for managing course progress
 * @param {string} courseId - The ID of the course
 * @param {string} sectionId - The ID of the current section
 * @param {string} contentId - The ID of the current content item
 * @returns {Object} Progress data and functions
 */
const useCourseProgress = (courseId, sectionId, contentId) => {
  const [progress, setProgress] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [actualContentId, setActualContentId] = useState(null);
  const isMountedRef = useRef(true);
  const initialFetchDoneRef = useRef(false);

  // Create a memoized function to fetch progress data
  const fetchProgressData = useCallback(async () => {
    if (!courseId || !isMountedRef.current)
      return { records: [], percentage: 0 };

    try {
      const progressResponse = await axiosInstance.get(
        `/api/progress/${courseId}`,
      );

      // Ensure component is still mounted before updating state
      if (!isMountedRef.current) return { records: [], percentage: 0 };

      // Handle the new response format with progressRecords and progressPercentage
      const responseData = progressResponse.data;

      // Extract progress records array and percentage
      const progressRecords = Array.isArray(responseData.progressRecords)
        ? responseData.progressRecords
        : Array.isArray(responseData)
          ? responseData
          : [];

      const percentage =
        typeof responseData.progressPercentage === 'number'
          ? responseData.progressPercentage
          : 0;

      // Update state with the extracted values
      setProgress(progressRecords);
      setProgressPercentage(percentage);
      setError(null);

      return {
        records: progressRecords,
        percentage: percentage,
      };
    } catch (progressErr) {
      if (!isMountedRef.current) return { records: [], percentage: 0 };

      console.error('Error fetching progress data:', progressErr);
      if (progressErr.response?.status === 404) {
        // No progress found is not an error state, just means no progress yet
        setProgress([]);
        setProgressPercentage(0);
        setError(null);
      } else {
        setError('Failed to load progress data');
        setProgress([]); // Ensure we still have an empty array in case of error
        setProgressPercentage(0);
      }
      return { records: [], percentage: 0 };
    }
  }, [courseId]);

  // Validate and potentially transform contentId to ensure it's compatible with the backend
  useEffect(() => {
    // Check if contentId seems to be just a numeric index
    const isNumericIndex = /^\d+$/.test(contentId);

    if (isNumericIndex) {
      // For numeric indexes, we'll need to fetch the course to get the actual content item
      const fetchContentDetails = async () => {
        if (!courseId) return;

        try {
          const courseResponse = await axiosInstance.get(
            `/api/courses/${courseId}`,
          );
          const courseData = courseResponse.data;

          if (Array.isArray(courseData.content)) {
            const index = parseInt(contentId, 10);
            if (index >= 0 && index < courseData.content.length) {
              const contentItem = courseData.content[index];
              // Use the MongoDB _id if available, otherwise generate a more stable ID
              if (contentItem._id) {
                setActualContentId(contentItem._id);
              } else if (contentItem.id) {
                setActualContentId(contentItem.id);
              } else {
                // Create a consistent ID based on title
                const stableId = contentItem.title
                  ? `${contentItem.title.replace(/\s+/g, '-').toLowerCase()}-${index}`
                  : `content-item-${index}`;
                setActualContentId(stableId);
              }
            }
          }
        } catch (err) {
          console.error(
            'Error fetching content details for progress tracking:',
            err,
          );
        }
      };

      fetchContentDetails();
    } else {
      // If it's not a numeric index, assume it's already a valid ID
      setActualContentId(contentId);
    }
  }, [courseId, sectionId, contentId]);

  // Do a single fetch when component mounts - no polling
  useEffect(() => {
    isMountedRef.current = true;

    // Only fetch once on component mount
    if (!initialFetchDoneRef.current) {
      fetchProgressData();
      initialFetchDoneRef.current = true;
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchProgressData]);
  /**
   * Mark content as completed
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  const markContentCompleted = async () => {
    if (!courseId || !sectionId || !actualContentId) {
      console.error(
        'Cannot mark content completed: Missing courseId, sectionId, or contentId',
        {
          courseId,
          sectionId,
          actualContentId,
        },
      );
      return false;
    }

    try {
      setCompleting(true);

      // Make API call to mark content as completed using the new endpoint format
      const response = await axiosInstance.post(
        `/api/progress/${courseId}/${sectionId}/${actualContentId}`,
        { completed: true },
      );

      // Handle response which might have the new format or be a single progress record
      if (isMountedRef.current) {
        const responseData = response.data;

        // Check if response has the new API format
        if (responseData && responseData.progressRecords) {
          setProgress(responseData.progressRecords);
          setProgressPercentage(responseData.progressPercentage || 0);
        } else if (responseData) {
          // If it's a single progress record being returned, update the array
          setProgress((prevProgress) => {
            // Ensure prevProgress is an array
            const progressArray = Array.isArray(prevProgress)
              ? prevProgress
              : [];

            const existingProgressIndex = progressArray.findIndex(
              (p) => p.contentId === actualContentId,
            );

            if (existingProgressIndex >= 0) {
              // Update existing progress entry
              const newProgress = [...progressArray];
              newProgress[existingProgressIndex] = responseData;
              return newProgress;
            }

            // Add new progress entry
            return [...progressArray, responseData];
          });
        }

        setCompleting(false);
      }

      // Refresh progress data to get updated percentage
      await fetchProgressData();

      return true;
    } catch (err) {
      console.error('Error marking content as completed:', err);

      if (isMountedRef.current) {
        // Provide better error messages based on API documentation
        if (err.response?.status === 400) {
          if (err.response.data.message === 'Invalid content ID format') {
            setError(
              'The system could not process this content for progress tracking.',
            );
          } else if (err.response.data.message === 'Content ID is required') {
            setError(
              'Content identifier is missing. Please try refreshing the page.',
            );
          } else {
            setError(
              err.response.data.message ||
                'Failed to mark content as completed',
            );
          }
        } else {
          setError('Failed to mark content as completed');
        }
        setCompleting(false);
      }
      return false;
    }
  };

  /**
   * Force refresh of progress data
   * @returns {Promise<Object>} The latest progress data with records and percentage
   */
  const refreshProgress = async () => {
    return await fetchProgressData();
  };

  /**
   * Check if the current content item is completed
   * @returns {boolean} Whether the content is completed
   */
  const isContentCompleted = () => {
    if (!actualContentId) return false;

    // Add an explicit check to ensure progress is an array before calling .some()
    if (!Array.isArray(progress)) {
      return false;
    }

    return progress.some(
      (p) =>
        (p.contentId === actualContentId || p.contentId === contentId) &&
        p.completed,
    );
  };

  return {
    progress,
    progressPercentage,
    completing,
    error,
    markContentCompleted,
    isContentCompleted,
    refreshProgress,
  };
};

export default useCourseProgress;
