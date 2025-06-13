const mongoose = require('mongoose'); // Moved mongoose import to the top
const Course = require('../../models/course');
const User = require('../../models/user');

// Helper function to process content items for update/insert
const processContentItems = (contentArray, existingContent) => {
  const processedContent = [];
  
  // eslint-disable-next-line no-restricted-syntax
  for (const item of contentArray) {
    // eslint-disable-next-line no-underscore-dangle
    if (item._id) {
      // Validate the _id format
      // eslint-disable-next-line no-underscore-dangle
      if (!mongoose.Types.ObjectId.isValid(item._id)) {
        // eslint-disable-next-line no-underscore-dangle
        throw new Error(`Invalid content item ID: ${item._id}`);
      }
      
      // Find the existing content item by _id to verify it exists
      const existingItem = existingContent.find(
        // eslint-disable-next-line no-underscore-dangle
        (existing) => existing._id.toString() === item._id.toString()
      );
      
      if (!existingItem) {
        // eslint-disable-next-line no-underscore-dangle
        throw new Error(`Content item with ID ${item._id} not found`);
      }
      
      // Add the updated item (preserve the _id)
      processedContent.push({
        ...item,
        // eslint-disable-next-line no-underscore-dangle
        _id: existingItem._id,
      });
    } else {
      // Add as new content (MongoDB will generate a new _id)
      const newItem = { ...item };
      // eslint-disable-next-line no-underscore-dangle
      delete newItem._id; // Ensure no _id is set for new items
      processedContent.push(newItem);
    }
  }
  
  // Return the complete new content array (this replaces the existing content)
  return processedContent;
};

// Update course content
exports.updateCourseContent = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body; // Changed let to const

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

    // Fetch the user attempting the update
    const user = await User.findById(req.user.id);
    if (!user) {
      // This case might indicate an issue with the token or user DB consistency
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow both instructors and admins to update content
    const isInstructor = existingCourse.instructor === user.fullName; // Use fetched user
    const isAdmin = user.role === 'admin'; // Use fetched user

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can update content',
      });
    }

    // Process content items for update/insert
    const updatedContent = processContentItems(content, existingCourse.content);

    // Update the course with the processed content
    const course = await Course.findByIdAndUpdate(
      id,
      { content: updatedContent },
      { new: true, runValidators: true }
    );

    return res.json({
      message: 'Course content updated successfully',
      course,
    });
  } catch (error) {
    // Handle specific validation errors from processContentItems
    if (
      error.message.includes('Invalid content item ID') ||
      error.message.includes('not found')
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }
    
    return res.status(500).json({
      message: 'Failed to update course content',
      error: error.message,
    });
  }
};
