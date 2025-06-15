const mongoose = require('mongoose'); // Moved mongoose import to the top
const Course = require('../../models/course');
const User = require('../../models/user');

// Helper function to process content items for update/insert within a section
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

// Helper function to validate content items
const validateContentItems = (contentArray) => {
  const validContentTypes = [
    'video',
    'quiz',
    'document',
    'markdown',
    'multipleChoice',
  ];

  // Check if all content items have valid types
  const invalidContent = contentArray.find(
    (item) => !item.type || !validContentTypes.includes(item.type)
  );

  if (invalidContent) {
    throw new Error(
      `Content items must have a valid type: ${validContentTypes.join(', ')}`
    );
  }

  // Check if markdown type items have content
  const invalidMarkdown = contentArray.find(
    (item) =>
      item.type === 'markdown' &&
      (!item.content || typeof item.content !== 'string')
  );

  if (invalidMarkdown) {
    throw new Error(
      'Markdown content items must include a content field with string value'
    );
  }

  // Check if multipleChoice type items have required fields
  const invalidMultipleChoice = contentArray.find(
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
    throw new Error(
      'Multiple choice questions must include a question (string), options (array of 4 strings), and correctOption (number 0-3)'
    );
  }
};

// Update course sections
exports.updateCourseSections = async (req, res) => {
  const { id } = req.params;
  const { sections } = req.body;

  // Validate sections array
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({
      message: 'Sections must be a non-empty array',
    });
  }

  // Validate each section
  const invalidSection = sections.find(
    (section) =>
      !section.title ||
      typeof section.title !== 'string' ||
      !Array.isArray(section.content)
  );

  if (invalidSection) {
    return res.status(400).json({
      message: 'Each section must have a title (string) and content (array)',
    });
  }

  try {
    // Validate content within each section
    // eslint-disable-next-line no-restricted-syntax
    for (const section of sections) {
      if (section.content.length > 0) {
        validateContentItems(section.content);
      }
    }

    // Check if the course exists and get instructor information before updating
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Fetch the user attempting the update
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow both instructors and admins to update sections
    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can update sections',
      });
    }

    // Process sections and their content
    const processedSections = sections.map((section) => {
      // eslint-disable-next-line no-underscore-dangle
      if (section._id) {
        // Find existing section to preserve content item IDs
        const existingSection = existingCourse.sections.find(
          // eslint-disable-next-line no-underscore-dangle
          (existing) => existing._id.toString() === section._id.toString()
        );
        
        if (existingSection) {
          return {
            ...section,
            // eslint-disable-next-line no-underscore-dangle
            _id: existingSection._id,
            content: processContentItems(
              section.content,
              existingSection.content
            ),
          };
        }
      }
      
      // New section or section not found, create new
      const newSection = { ...section };
      // eslint-disable-next-line no-underscore-dangle
      delete newSection._id;
      return newSection;
    });

    // Update the course with the processed sections
    const course = await Course.findByIdAndUpdate(
      id,
      { sections: processedSections },
      { new: true, runValidators: true }
    );

    return res.json({
      message: 'Course sections updated successfully',
      course,
    });
  } catch (error) {
    // Handle specific validation errors
    if (
      error.message.includes('Invalid content item ID') ||
      error.message.includes('not found') ||
      error.message.includes('Content items must have') ||
      error.message.includes('Markdown content items') ||
      error.message.includes('Multiple choice questions')
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update course sections',
      error: error.message,
    });
  }
};

// Add a new section to a course
exports.addSection = async (req, res) => {
  const { id } = req.params;
  const { title, description, order, content = [] } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      message: 'Section title is required and must be a string',
    });
  }

  try {
    // Validate content if provided
    if (content.length > 0) {
      validateContentItems(content);
    }

    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can add sections',
      });
    }

    // Add the new section
    const newSection = {
      title,
      content,
      ...(description && { description }),
      ...(order !== undefined && { order }),
    };
    existingCourse.sections.push(newSection);

    await existingCourse.save();

    return res.status(201).json({
      message: 'Section added successfully',
      course: existingCourse,
      newSectionId:
        // eslint-disable-next-line no-underscore-dangle
        existingCourse.sections[existingCourse.sections.length - 1]._id,
    });
  } catch (error) {
    if (
      error.message.includes('Content items must have') ||
      error.message.includes('Markdown content items') ||
      error.message.includes('Multiple choice questions')
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to add section',
      error: error.message,
    });
  }
};

// Delete a section from a course
exports.deleteSection = async (req, res) => {
  const { id, sectionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    return res.status(400).json({
      message: 'Invalid section ID',
    });
  }

  try {
    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can delete sections',
      });
    }

    // Find and remove the section
    const sectionIndex = existingCourse.sections.findIndex(
      // eslint-disable-next-line no-underscore-dangle
      (section) => section._id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({
        message: 'Section not found',
      });
    }

    existingCourse.sections.splice(sectionIndex, 1);
    await existingCourse.save();

    return res.json({
      message: 'Section deleted successfully',
      course: existingCourse,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete section',
      error: error.message,
    });
  }
};

// Add content to a specific section
exports.addContentToSection = async (req, res) => {
  const { id, sectionId } = req.params;
  const contentData = req.body;

  // Validate required fields
  if (!contentData.title || !contentData.type) {
    return res.status(400).json({
      message: 'Content title and type are required',
    });
  }

  try {
    // Validate content if provided
    if (contentData) {
      validateContentItems([contentData]);
    }

    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure the course has sections
    if (!existingCourse.sections) {
      existingCourse.sections = [];
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can add content',
      });
    }

    // Find the specific section
    const sectionIndex = existingCourse.sections.findIndex(
      (section) => section.id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Ensure the section has a content array
    if (!existingCourse.sections[sectionIndex].content) {
      existingCourse.sections[sectionIndex].content = [];
    }

    // Add the new content to the section
    existingCourse.sections[sectionIndex].content.push(contentData);
    
    // Mark the sections array as modified so MongoDB knows to save it
    existingCourse.markModified('sections');

    await existingCourse.save();

    // Get the newly added content item
    const newContent =
      existingCourse.sections[sectionIndex].content[
        existingCourse.sections[sectionIndex].content.length - 1
      ];

    return res.status(201).json({
      message: 'Content added successfully',
      content: newContent,
    });
  } catch (error) {
    if (
      error.message.includes('Content items must have') ||
      error.message.includes('Markdown content items') ||
      error.message.includes('Multiple choice questions')
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to add content',
      error: error.message,
    });
  }
};

// Update content in a specific section
exports.updateContentInSection = async (req, res) => {
  const { id, sectionId, contentId } = req.params;
  const updateData = req.body;

  try {
    // Validate content if provided
    if (updateData) {
      validateContentItems([updateData]);
    }

    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can update content',
      });
    }

    // Find the specific section
    const sectionIndex = existingCourse.sections.findIndex(
      (section) => section.id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Find the specific content item
    const contentIndex = existingCourse.sections[
      sectionIndex
    ].content.findIndex((item) => item.id.toString() === contentId);

    if (contentIndex === -1) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Update the content item
    Object.assign(
      existingCourse.sections[sectionIndex].content[contentIndex],
      updateData
    );

    // Mark the sections array as modified so MongoDB knows to save it
    existingCourse.markModified('sections');

    await existingCourse.save();

    return res.status(200).json({
      message: 'Content updated successfully',
      content: existingCourse.sections[sectionIndex].content[contentIndex],
    });
  } catch (error) {
    if (
      error.message.includes('Content items must have') ||
      error.message.includes('Markdown content items') ||
      error.message.includes('Multiple choice questions')
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: 'Failed to update content',
      error: error.message,
    });
  }
};

// Delete content from a specific section
exports.deleteContentFromSection = async (req, res) => {
  const { id, sectionId, contentId } = req.params;

  try {
    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can delete content',
      });
    }

    // Find the specific section
    const sectionIndex = existingCourse.sections.findIndex(
      (section) => section.id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Find and remove the specific content item
    const contentIndex = existingCourse.sections[
      sectionIndex
    ].content.findIndex((item) => item.id.toString() === contentId);

    if (contentIndex === -1) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Remove the content item
    existingCourse.sections[sectionIndex].content.splice(contentIndex, 1);

    // Mark the sections array as modified so MongoDB knows to save it
    existingCourse.markModified('sections');

    await existingCourse.save();

    return res.status(200).json({
      message: 'Content deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to delete content',
      error: error.message,
    });
  }
};

// Update a specific section
exports.updateSection = async (req, res) => {
  const { id, sectionId } = req.params;
  const { title, description, order } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      message: 'Section title is required and must be a string',
    });
  }

  try {
    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check permissions
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';

    if (!isInstructor && !isAdmin) {
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can update sections',
      });
    }

    // Find the specific section
    const sectionIndex = existingCourse.sections.findIndex(
      (section) => section.id.toString() === sectionId
    );

    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Update the section
    existingCourse.sections[sectionIndex].title = title;
    if (description !== undefined) {
      existingCourse.sections[sectionIndex].description = description;
    }
    if (order !== undefined) {
      existingCourse.sections[sectionIndex].order = order;
    }

    // Mark the sections array as modified so MongoDB knows to save it
    existingCourse.markModified('sections');

    await existingCourse.save();

    return res.status(200).json({
      message: 'Section updated successfully',
      section: existingCourse.sections[sectionIndex],
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update section',
      error: error.message,
    });
  }
};

// Legacy function for backward compatibility (deprecated)
exports.updateCourseContent = async (req, res) =>
  res.status(400).json({
    message:
      'This endpoint is deprecated. Please use /sections endpoint to manage course content within sections.',
  });
