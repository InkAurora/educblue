const Course = require('../models/course');

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    return res.json(course);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a course (for instructors)
exports.createCourse = async (req, res) => {
  const {
    title,
    description,
    markdownDescription,
    price,
    instructor,
    duration,
    content,
  } = req.body;

  // Validate markdown description if provided
  if (
    markdownDescription !== undefined &&
    typeof markdownDescription !== 'string'
  ) {
    return res
      .status(400)
      .json({ message: 'Markdown description must be a string' });
  }

  // Validate content array if provided
  if (content) {
    const validContentTypes = ['video', 'quiz', 'document', 'markdown'];

    // Check if all content items have valid types
    const hasInvalidContent = content.some(
      (item) => !item.type || !validContentTypes.includes(item.type)
    );

    // Check if markdown type items have content
    const hasInvalidMarkdown = content.some(
      (item) =>
        item.type === 'markdown' &&
        (!item.content || typeof item.content !== 'string')
    );

    if (hasInvalidContent) {
      return res.status(400).json({
        message: `Content items must have a valid type: ${validContentTypes.join(', ')}`,
      });
    }

    if (hasInvalidMarkdown) {
      return res.status(400).json({
        message:
          'Markdown content items must include a content field with string value',
      });
    }
  }

  try {
    const course = new Course({
      title,
      description,
      markdownDescription,
      price,
      instructor,
      duration,
      content,
      status: 'draft', // Setting status to 'draft' by default
    });
    await course.save();
    return res.status(201).json({
      message: 'Course created successfully in draft mode',
      courseId: course.id,
      course,
    });
  } catch (error) {
    return res
      .status(400)
      .json({ message: 'Invalid data', error: error.message });
  }
};

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

// Publish course
exports.publishCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if course has at least one content item
    if (!course.content || course.content.length === 0) {
      return res.status(400).json({
        message:
          'Cannot publish course with no content. Add content items first.',
      });
    }

    // Update the course status to 'published'
    course.status = 'published';
    await course.save();

    return res.json({
      message: 'Course published successfully',
      courseId: course.id,
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to publish course',
      error: error.message,
    });
  }
};
