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

// Update course details
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, markdownDescription, price, duration } = req.body;
  // eslint-disable-next-line no-console
  console.log(
    `Update course called for ID: ${id} by user: ${req.user.id}. Body:`,
    req.body
  );

  // Build update object with only provided fields
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (markdownDescription !== undefined)
    updateData.markdownDescription = markdownDescription;
  if (price !== undefined) updateData.price = price;
  if (duration !== undefined) updateData.duration = duration;

  // Validate markdown description if provided
  if (
    markdownDescription !== undefined &&
    typeof markdownDescription !== 'string'
  ) {
    return res
      .status(400)
      .json({ message: 'Markdown description must be a string' });
  }

  try {
    // Check if the course exists
    const existingCourse = await Course.findById(id);
    if (!existingCourse) {
      // eslint-disable-next-line no-console
      console.log(`Update course: Course not found for ID: ${id}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the user making the request
    const user = await User.findById(req.user.id);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`Update course: User not found for ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    // eslint-disable-next-line no-console
    console.log(
      `Update course: Course instructor: ${existingCourse.instructor}, User: ${user.fullName}, User role: ${user.role}`
    );

    // Check if user is either an admin or the course instructor
    const isInstructor = existingCourse.instructor === user.fullName;
    const isAdmin = user.role === 'admin';
    // eslint-disable-next-line no-console
    console.log(
      `Update course: isInstructor: ${isInstructor}, isAdmin: ${isAdmin}`
    );

    if (!isInstructor && !isAdmin) {
      // eslint-disable-next-line no-console
      console.log('Update course: Access denied.');
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can update the course',
      });
    }

    // Update the course with provided fields
    const course = await Course.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.json({
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in updateCourse:', error);
    return res
      .status(500) // Changed from 400 to 500 for unexpected errors
      .json({ message: 'Failed to update course', error: error.message });
  }
};

// Publish course
exports.publishCourse = async (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line no-console
  console.log(`Publish course called for ID: ${id} by user: ${req.user.id}`);
  // eslint-disable-next-line no-console
  console.log('publishCourse - req.params.id:', req.params.id); // Added log
  // eslint-disable-next-line no-console
  console.log('publishCourse - req.user:', JSON.stringify(req.user, null, 2));

  try {
    const courseToPublish = await Course.findById(id); // Renamed variable to avoid conflict

    if (!courseToPublish) {
      // eslint-disable-next-line no-console
      console.log(`Publish course: Course not found for ID: ${id}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the user making the request
    const user = await User.findById(req.user.id);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`Publish course: User not found for ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    // eslint-disable-next-line no-console
    console.log(
      `Publish course: Course instructor: ${courseToPublish.instructor}, User: ${user.fullName}, User role: ${user.role}`
    );

    // Check if user is either an admin or the course instructor
    const isInstructor = courseToPublish.instructor === user.fullName;
    const isAdmin = user.role === 'admin';
    // eslint-disable-next-line no-console
    console.log(
      `Publish course: isInstructor: ${isInstructor}, isAdmin: ${isAdmin}`
    );

    // Check if the course has content first, then permission
    if (!courseToPublish.content || courseToPublish.content.length === 0) {
      // eslint-disable-next-line no-console
      console.log(
        `Publish course: Course ${id} has no content and cannot be published.`
      );
      return res
        .status(400)
        .json({ message: 'Course must have content to be published' });
    }

    if (!isInstructor && !isAdmin) {
      // eslint-disable-next-line no-console
      console.log('Publish course: Access denied.');
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can publish the course',
      });
    }

    courseToPublish.status = 'published';
    await courseToPublish.save();
    return res.json({
      message: 'Course published successfully',
      course: courseToPublish, // Return the updated course
      published: true, // Explicitly set published for the test
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in publishCourse:', error);
    return res
      .status(500)
      .json({ message: 'Failed to publish course', error: error.message });
  }
};

// Delete course
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  // eslint-disable-next-line no-console
  console.log(`Delete course called for ID: ${id} by user: ${req.user.id}`);
  // eslint-disable-next-line no-console
  console.log('deleteCourse - req.params.id:', req.params.id);
  // eslint-disable-next-line no-console
  console.log('deleteCourse - req.user:', JSON.stringify(req.user, null, 2));

  try {
    const courseToDelete = await Course.findById(id); // Renamed variable

    if (!courseToDelete) {
      // eslint-disable-next-line no-console
      console.log(`Delete course: Course not found for ID: ${id}`);
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get the user making the request
    const user = await User.findById(req.user.id);
    if (!user) {
      // eslint-disable-next-line no-console
      console.log(`Delete course: User not found for ID: ${req.user.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    // eslint-disable-next-line no-console
    console.log(
      `Delete course: Course instructor: ${courseToDelete.instructor}, User: ${user.fullName}, User role: ${user.role}`
    );

    // Check if user is either an admin or the course instructor
    const isInstructor = courseToDelete.instructor === user.fullName;
    const isAdmin = user.role === 'admin';
    // eslint-disable-next-line no-console
    console.log(
      `Delete course: isInstructor: ${isInstructor}, isAdmin: ${isAdmin}`
    );

    if (!isInstructor && !isAdmin) {
      // eslint-disable-next-line no-console
      console.log('Delete course: Access denied.');
      return res.status(403).json({
        message:
          'Access denied. Only the course instructor or an admin can delete the course',
      });
    }

    await Course.findByIdAndDelete(id); // Use findByIdAndDelete
    return res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in deleteCourse:', error);
    return res
      .status(500)
      .json({ message: 'Failed to delete course', error: error.message });
  }
};

// Get all courses (for admin)
// ...existing code...
