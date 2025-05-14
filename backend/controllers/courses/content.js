const Course = require('../../models/course');
const mongoose = require('mongoose');

// Helper function to sanitize content items
const sanitizeContent = (contentArray) => {
  return contentArray.map((item) => {
    // Create a new object without the _id if it doesn't look like a valid MongoDB ObjectId
    const newItem = { ...item };
    if (
      newItem._id &&
      typeof newItem._id === 'string' &&
      !mongoose.Types.ObjectId.isValid(newItem._id)
    ) {
      delete newItem._id;
    }
    return newItem;
  });
};

// Update course content
exports.updateCourseContent = async (req, res) => {
  const { id } = req.params;
  let { content } = req.body;

  // Validate content array
  if (!content || !Array.isArray(content) || content.length === 0) {
    return res.status(400).json({
      message: 'Content must be a non-empty array',
    });
  }

  // Validate content types
  const validContentTypes = [
    'video',
    'quiz',
    'document',
    'markdown',
    'multipleChoice',
  ];

  // Check if all content items have valid types
  const invalidContent = content.find(
    (item) => !item.type || !validContentTypes.includes(item.type)
  );

  if (invalidContent) {
    return res.status(400).json({
      message: `Content items must have a valid type: ${validContentTypes.join(', ')}`,
      invalidItem: invalidContent,
    });
  }

  // Check if markdown type items have content
  const invalidMarkdown = content.find(
    (item) =>
      item.type === 'markdown' &&
      (!item.content || typeof item.content !== 'string')
  );

  if (invalidMarkdown) {
    return res.status(400).json({
      message:
        'Markdown content items must include a content field with string value',
      invalidItem: invalidMarkdown,
    });
  }

  // Check if multipleChoice type items have required fields
  const invalidMultipleChoice = content.find(
    (item) =>
      item.type === 'multipleChoice' &&
      (!item.question ||
        typeof item.question !== 'string' ||
        !item.options ||
        !Array.isArray(item.options) ||
        item.options.length !== 4 ||
        typeof item.correctOption !== 'number' ||
        item.correctOption < 0 ||
        item.correctOption > 3 ||
        !Number.isInteger(item.correctOption))
  );

  if (invalidMultipleChoice) {
    return res.status(400).json({
      message:
        'Multiple choice questions must include a question (string), options (array of 4 strings), and correctOption (number 0-3)',
      invalidItem: invalidMultipleChoice,
    });
  }

  try {
    // Check if the course exists and get instructor information before updating
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Allow both instructors and admins to update content
    const isInstructor = existingCourse.instructor === req.user.fullName;
    const isAdmin = req.user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can update content',
      });
    }

    // Sanitize content to handle temporary IDs
    const sanitizedContent = sanitizeContent(content);

    // We only update the content field, ensuring instructor field can't be modified
    const course = await Course.findByIdAndUpdate(
      id,
      { content: sanitizedContent },
      { new: true, runValidators: true }
    );

    return res.json({
      message: 'Course content updated successfully',
      course,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update course content',
      error: error.message,
    });
  }
};
