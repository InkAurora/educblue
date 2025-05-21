const Course = require('../../models/course');
const User = require('../../models/user');

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
    const isAdmin = user.role === 'admin'; // Check if user is admin

    // If user is either the instructor or enrolled or admin, return full course details
    if (isInstructor || isEnrolled || isAdmin) {
      return res.json(course);
    }

    // For non-enrolled users, return limited course information
    const limitedCourse = {
      _id: course._id,
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
    const isAdmin = user.role === 'admin'; // Check if user is admin

    if (!isInstructor && !isEnrolled && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Not enrolled in this course and not an admin' });
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
