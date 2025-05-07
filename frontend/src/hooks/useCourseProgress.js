import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

/**
 * Custom hook for managing course progress
 * @param {string} courseId - The ID of the course
 * @param {string} contentId - The ID of the current content item
 * @returns {Object} Progress data and functions
 */
const useCourseProgress = (courseId, contentId) => {
  const [progress, setProgress] = useState([]);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState(null);
  const [actualContentId, setActualContentId] = useState(null);

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
  }, [courseId, contentId]);

  // Fetch progress data when courseId changes
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!courseId) return;

      try {
        const progressResponse = await axiosInstance.get(
          `/api/progress/${courseId}`,
        );
        setProgress(progressResponse.data || []);
        setError(null);
      } catch (progressErr) {
        console.error('Error fetching progress data:', progressErr);
        if (progressErr.response?.status === 404) {
          // No progress found is not an error state, just means no progress yet
          setProgress([]);
          setError(null);
        } else {
          setError('Failed to load progress data');
        }
      }
    };

    fetchProgressData();
  }, [courseId]);

  /**
   * Mark content as completed
   * @returns {Promise<boolean>} Whether the operation was successful
   */
  const markContentCompleted = async () => {
    if (!courseId || !actualContentId) return false;

    try {
      setCompleting(true);

      // Make API call to mark content as completed - include completed: true in the body
      const response = await axiosInstance.post(
        `/api/progress/${courseId}/${actualContentId}`,
        { completed: true },
      );

      // Update progress state with the returned progress record
      setProgress((prevProgress) => {
        const existingProgressIndex = prevProgress.findIndex(
          (p) => p.contentId === actualContentId,
        );

        if (existingProgressIndex >= 0) {
          // Update existing progress entry
          const newProgress = [...prevProgress];
          newProgress[existingProgressIndex] = response.data;
          return newProgress;
        }

        // Add new progress entry
        return [...prevProgress, response.data];
      });

      setCompleting(false);
      return true;
    } catch (err) {
      console.error('Error marking content as completed:', err);

      // Provide better error messages based on API documentation
      if (err.response?.status === 400) {
        if (err.response.data.message === 'Invalid content ID format') {
          setError(
            'The system could not process this content for progress tracking. Please try a different section or contact support.',
          );
        } else if (err.response.data.message === 'Content ID is required') {
          setError(
            'Content identifier is missing. Please try refreshing the page.',
          );
        } else {
          setError(
            err.response.data.message || 'Failed to mark content as completed',
          );
        }
      } else {
        setError('Failed to mark content as completed');
      }
      setCompleting(false);
      return false;
    }
  };

  /**
   * Check if the current content item is completed
   * @returns {boolean} Whether the content is completed
   */
  const isContentCompleted = () => {
    if (!actualContentId) return false;

    return progress.some(
      (p) =>
        (p.contentId === actualContentId || p.contentId === contentId) &&
        p.completed,
    );
  };

  return {
    progress,
    completing,
    error,
    markContentCompleted,
    isContentCompleted,
  };
};

export default useCourseProgress;
