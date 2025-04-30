const Course = require('../models/course');
const User = require('../models/user');

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
    // Check if user exists in the request (set by auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the user to check enrollment status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is the course instructor or is enrolled in the course
    const isInstructor = course.instructor === user.fullName;
    const isEnrolled = user.enrolledCourses.includes(req.params.id);

    // If user is either the instructor or enrolled, return full course details
    if (isInstructor || isEnrolled) {
      return res.json(course);
    }

    // For non-enrolled users, return limited course information
    const limitedCourse = {
      _id: course._id,  // Changed from 'id' to '_id' to match test expectations
      title: course.title,
      description: course.description,
      markdownDescription: course.markdownDescription,
      price: course.price,
      instructor: course.instructor,
      duration: course.duration,
      status: course.status,
    };

    return res.json(limitedCourse);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get course content by ID
exports.getCourseContentById = async (req, res) => {
  try {
    const { id, contentId } = req.params;

    // Check if user exists in the request (set by auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the user to check enrollment status
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is the course instructor or is enrolled in the course
    const isInstructor = course.instructor === user.fullName;
    const isEnrolled = user.enrolledCourses.includes(id);

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    // Find the specific content item
    const contentItem = course.content.find(
      (item) => item.id.toString() === contentId
    );

    if (!contentItem) {
      return res.status(404).json({ message: 'Content not found' });
    }

    return res.json(contentItem);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

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
