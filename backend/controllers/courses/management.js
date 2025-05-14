const Course = require('../../models/course');
const User = require('../../models/user');

// Create a course (for instructors)
exports.createCourse = async (req, res) => {
  const { title, description, markdownDescription, price, duration, content } =
    req.body;

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
    const validContentTypes = [
      'video',
      'quiz',
      'document',
      'markdown',
      'multipleChoice',
    ];

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

    // Check if multipleChoice type items have required fields
    const hasInvalidMultipleChoice = content.some(
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

    if (hasInvalidMultipleChoice) {
      return res.status(400).json({
        message:
          'Multiple choice questions must include a question (string), options (array of 4 strings), and correctOption (number 0-3)',
      });
    }
  }

  try {
    // Get the user's fullName from database using the ID from JWT token
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const course = new Course({
      title,
      description,
      markdownDescription,
      price,
      instructor: user.fullName, // Set instructor to user's fullName
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

// Publish course
exports.publishCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the user with the ID from the auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure the course's instructor field matches the user's fullName
    if (course.instructor !== user.fullName) {
      return res.status(403).json({
        message: 'Access denied. You are not the instructor of this course',
      });
    }

    // Check if course has at least one content item
    if (!course.content || course.content.length === 0) {
      return res.status(400).json({
        message:
          'Cannot publish course with no content. Add content items first.',
      });
    }

    // Update the status field to 'published'
    course.status = 'published';
    await course.save();

    // Add the course ID to the user's enrolledCourses array using $addToSet to avoid duplicates
    await User.findByIdAndUpdate(
      user.id,
      { $addToSet: { enrolledCourses: id } },
      { new: true }
    );

    return res.json({
      message: 'Course published successfully',
      courseId: course.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to publish course',
      error: error.message,
    });
  }
};
