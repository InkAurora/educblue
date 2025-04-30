const Course = require('../../models/course');

// Update course content
exports.updateCourseContent = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  // Validate content array
  if (!content || !Array.isArray(content) || content.length === 0) {
    return res.status(400).json({
      message: 'Content must be a non-empty array',
    });
  }

  // Validate content types
  const validContentTypes = ['video', 'quiz', 'document', 'markdown'];

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

  try {
    // We only update the content field, ensuring instructor field can't be modified
    const course = await Course.findByIdAndUpdate(
      id,
      { content },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

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
