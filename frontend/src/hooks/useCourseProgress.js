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

  // Fetch progress data when courseId changes
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!courseId) return;

      try {
        const progressResponse = await axiosInstance.get(
          `/api/progress/${courseId}`,
        );
        setProgress(progressResponse.data || []);
      } catch (progressErr) {
        console.error('Error fetching progress data:', progressErr);
        setError('Failed to load progress data');
      }
    };

    fetchProgressData();
  }, [courseId]);

  /**
   * Mark content as completed
   */
  const markContentCompleted = async () => {
    if (!courseId || !contentId) return;

    try {
      setCompleting(true);

      // Make API call to mark content as completed
      await axiosInstance.post(`/api/progress/${courseId}/${contentId}`, {
        completed: true,
      });

      // Update progress state
      setProgress((prevProgress) => {
        const existingProgressIndex = prevProgress.findIndex(
          (p) => p.contentId === contentId,
        );

        if (existingProgressIndex >= 0) {
          // Update existing progress entry
          const newProgress = [...prevProgress];
          newProgress[existingProgressIndex] = {
            ...newProgress[existingProgressIndex],
            completed: true,
          };
          return newProgress;
        }

        // Add new progress entry
        return [...prevProgress, { contentId, completed: true }];
      });

      setCompleting(false);
      return true;
    } catch (err) {
      console.error('Error marking content as completed:', err);
      setError('Failed to mark content as completed');
      setCompleting(false);
      return false;
    }
  };

  /**
   * Check if the current content item is completed
   * @returns {boolean} Whether the content is completed
   */
  const isContentCompleted = () => {
    return progress.some((p) => p.contentId === contentId && p.completed);
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
