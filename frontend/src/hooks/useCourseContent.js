import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';

/**
 * Custom hook for managing course content data and operations
 * @param {string} courseId - The ID of the course to fetch content for
 * @returns {Object} Course content data and functions
 */
const useCourseContent = (courseId) => {
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Fetch course data when component mounts
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);

        // Check if the ID is undefined or invalid
        if (!courseId || courseId === 'undefined') {
          setError('Invalid course ID. Please try creating the course again.');
          setLoading(false);
          return;
        }

        // Using axiosInstance - no need to manually include the token
        const response = await axiosInstance.get(`/api/courses/${courseId}`);

        // Make sure we received valid course data
        if (!response.data || !response.data._id) {
          setError('Could not load course data. Please try again.');
          setLoading(false);
          return;
        }

        setCourse(response.data);
        // Initialize content array if it exists in the course data
        if (response.data.content && response.data.content.length > 0) {
          setContent(response.data.content);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching course:', err);

        if (err.response?.status === 404) {
          setError('Course not found');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to edit this course');
        } else {
          setError(`Failed to load course: ${err.message || 'Unknown error'}`);
        }

        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  /**
   * Save content changes to the API
   */
  const saveContent = async () => {
    if (content.length === 0) {
      setError('Please add at least one content item');
      // Make sure error is visible in tests
      document
        .querySelector('[data-testid="error-alert"]')
        ?.setAttribute('data-error', 'Please add at least one content item');
      return;
    }

    try {
      setSavingContent(true);

      // Ensure all content items have a consistent structure with all required fields
      const contentToSave = content.map((item) => {
        // Base content item structure (same for all types)
        const standardizedItem = {
          title: item.title || '',
          type: item.type,
          videoUrl: item.videoUrl || '',
        };

        // Add _id if it exists or generate a temporary one
        if (item._id) {
          standardizedItem._id = item._id;
        } else {
          standardizedItem._id = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        }

        // Handle different content types
        if (item.type === 'multipleChoice') {
          // For multiple-choice quizzes, include question, options, and correctOption fields
          standardizedItem.question = item.question || item.content || '';
          standardizedItem.options = Array.isArray(item.options)
            ? [...item.options]
            : [];
          standardizedItem.correctOption =
            typeof item.correctOption === 'number' ? item.correctOption : 0;
        } else {
          // For other types, only include the content field (no options array)
          standardizedItem.content = item.content || '';
        }

        return standardizedItem;
      });

      console.log('Saving content:', JSON.stringify(contentToSave, null, 2));

      // Using axiosInstance - no need to manually include the token
      await axiosInstance.put(`/api/courses/${courseId}/content`, {
        content: contentToSave,
      });

      // Update local content with the newly generated IDs
      setContent(contentToSave);

      setSavingContent(false);
      setError('');
      // Show success message or update UI as needed
      return true;
    } catch (err) {
      console.error('Error saving course content:', err);
      console.error('Request data:', JSON.stringify({ content }, null, 2));

      if (err.response) {
        console.error(
          'Response error:',
          err.response.status,
          err.response.data,
        );
        // Display the detailed error message from the backend if available
        if (
          err.response.data &&
          (err.response.data.error || err.response.data.message)
        ) {
          setError(
            `Failed to save: ${err.response.data.error || err.response.data.message}`,
          );
          return false;
        }
      }

      if (err.response?.status === 403) {
        setError('Access denied. Only instructors can edit courses.');
      } else {
        setError(
          `Failed to save course content: ${err.message || 'Please try again.'}`,
        );
      }

      setSavingContent(false);
      return false;
    }
  };

  /**
   * Publish course
   */
  const publishCourse = async () => {
    if (content.length === 0) {
      setError('Please add content before publishing');
      // Make sure error is visible in tests
      document
        .querySelector('[data-testid="error-alert"]')
        ?.setAttribute('data-error', 'Please add content before publishing');
      return;
    }

    try {
      setPublishing(true);

      // Ensure all content items have a consistent structure with all required fields
      const contentToSave = content.map((item) => {
        // Base content item structure (same for all types)
        const standardizedItem = {
          title: item.title || '',
          type: item.type,
          videoUrl: item.videoUrl || '',
        };

        // Add _id if it exists or generate a temporary one
        if (item._id) {
          standardizedItem._id = item._id;
        } else {
          standardizedItem._id = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        }

        // Handle different content types
        if (item.type === 'multipleChoice') {
          // For multiple-choice quizzes, include question, options, and correctOption fields
          standardizedItem.question = item.question || item.content || '';
          standardizedItem.options = Array.isArray(item.options)
            ? [...item.options]
            : [];
          standardizedItem.correctOption =
            typeof item.correctOption === 'number' ? item.correctOption : 0;
        } else {
          // For other types, only include the content field (no options array)
          standardizedItem.content = item.content || '';
        }

        return standardizedItem;
      });

      // Update local content with the newly generated IDs
      setContent(contentToSave);

      // First, save the latest content to ensure everything is up to date
      await axiosInstance.put(`/api/courses/${courseId}/content`, {
        content: contentToSave,
      });

      // Then, publish the course with the required data
      await axiosInstance.patch(`/api/courses/${courseId}/publish`, {
        status: 'published',
        content: contentToSave,
      });

      console.log('Course published successfully');
      // Redirect to the published course
      navigate(`/courses/${courseId}`);
    } catch (err) {
      console.error('Error publishing course:', err);
      setPublishing(false);

      if (err.response) {
        console.error('Response error data:', err.response.data);

        if (err.response.status === 403) {
          setError('Access denied. Only instructors can publish courses.');
        } else if (err.response.status === 400 && err.response.data?.message) {
          setError(`Failed to publish: ${err.response.data.message}`);
        } else {
          setError(
            `Failed to publish course (${err.response.status}). Please try again.`,
          );
        }
      } else {
        setError(`Failed to publish course: ${err.message || 'Unknown error'}`);
      }
    }
  };

  return {
    course,
    content,
    setContent,
    loading,
    error,
    setError,
    savingContent,
    publishing,
    saveContent,
    publishCourse,
  };
};

export default useCourseContent;
